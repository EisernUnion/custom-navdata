import test from 'node:test';
import assert from 'node:assert/strict';
import {NavDataController} from '../dist/ui/controller.js';

const packages=[{id:'gibraltar',name:'Gibraltar',version:'1.0.0',description:'Test package'}];
const results=[{id:'fenix',name:'Fenix',location:'C:/test',status:'ready',message:'Found 1 file.',files:[]}];
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function create(api){
 let actions;
 const snapshots=[];
 const view={bind(value){actions=value;},render(state){snapshots.push(structuredClone(state));}};
 const controller=new NavDataController({packages:async()=>packages,scan:async()=>results,install:async()=>({success:true,message:'Installed'}),...api},view);
 return {controller,snapshots,get actions(){return actions;},get state(){return snapshots.at(-1);}};
}

test('renderer initialization loads packages, scans, and exposes platform/package selection',async()=>{
 const app=create();await app.controller.initialize();
 assert.equal(app.state.packageId,'gibraltar');assert.equal(app.state.scanning,false);assert.equal(app.state.results.length,1);
 app.actions.selectPlatform('fslabs');assert.equal(app.state.platformId,'fslabs');
 app.actions.selectPackage('another');assert.equal(app.state.packageId,'another');
});

test('renderer failures settle with actionable feedback and clean scan states',async()=>{
 const app=create({packages:async()=>{throw new Error('Unavailable');},scan:async()=>{throw new Error('Unavailable');}});
 await app.controller.initialize();
 assert.equal(app.state.scanning,false);assert.equal(app.state.feedback.state,'error');
 assert.ok(app.state.results.every(result=>result.status==='error'));
});

test('renderer prevents duplicate inserts, shows backup result, and rescans after completion',async()=>{
 let finish;let writes=0;let scans=0;
 const app=create({scan:async()=>{scans++;return results;},install:()=>{writes++;return new Promise(resolve=>{finish=resolve;});}});
 await app.controller.initialize();
 const request={databasePath:'C:/test/database.db3',platformId:'fenix',packageId:'gibraltar'};
 app.actions.install(request);app.actions.install(request);
 assert.equal(writes,1);assert.equal(app.state.feedback.state,'loading');assert.equal(app.state.installingPath,request.databasePath);
 finish({success:true,message:'Installed',backupPath:'C:/backups/database.bak'});await flush();
 assert.equal(app.state.installingPath,null);assert.equal(app.state.feedback.state,'success');assert.match(app.state.feedback.message,/database.bak/);assert.equal(scans,2);
});

test('renderer rescans after a rejected insert and allows a retry',async()=>{
 const app=create({install:async()=>{throw new Error('IPC failed');}});await app.controller.initialize();
 app.actions.install({databasePath:'test.db3',platformId:'fenix',packageId:'gibraltar'});await flush();
 assert.equal(app.state.feedback.state,'error');assert.equal(app.state.installingPath,null);assert.equal(app.state.scanning,false);
});
