import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {ScanLocationStore} from '../dist/main/scan-locations.js';
import {discoverDatabases} from '../dist/discovery.js';
import {NavDataController} from '../dist/ui/controller.js';

test('scan locations persist, reset and ignore invalid entries',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'bav-loc-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const file=path.join(root,'sub','locations.json');const store=new ScanLocationStore(file);
 assert.deepEqual(await store.load(),{});
 const folder=path.resolve(root,'nav');
 await store.set('fenix',folder);assert.deepEqual(await store.load(),{fenix:folder});
 await store.set('fenix',null);assert.deepEqual(await store.load(),{});
 await writeFile(file,JSON.stringify({fenix:'relative',bogus:folder,fslabs:folder}));
 assert.deepEqual(await store.load(),{fslabs:folder});
});

test('a custom folder replaces the default scan location',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'bav-loc-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const results=await discoverDatabases({fenix:root});
 const fenix=results.find(r=>r.id==='fenix');
 assert.equal(fenix.location,root);assert.equal(fenix.customLocation,true);
});

test('controller selects and resets the location, then rescans',async()=>{
 const calls=[];let actions;let last;
 const view={bind(v){actions=v;},render(s){last=structuredClone(s);}};
 const api={packages:async()=>[],scan:async()=>{calls.push('scan');return [];},install:async()=>({success:true,message:''}),
  selectLocation:async id=>{calls.push('select:'+id);return true;},resetLocation:async id=>{calls.push('reset:'+id);}};
 const c=new NavDataController(api,view);await c.initialize();
 actions.selectLocation();await new Promise(r=>setImmediate(r));
 actions.resetLocation();await new Promise(r=>setImmediate(r));
 assert.deepEqual(calls,['scan','select:fenix','scan','reset:fenix','scan']);
 assert.equal(last.scanning,false);
});
