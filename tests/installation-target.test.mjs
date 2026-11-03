import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {parseInstallRequest,resolveInstallationTarget} from '../dist/main/installation-target.js';

test('insertion requests reject malformed payloads before filesystem access',()=>{
 for(const value of [null,undefined,'sql',[],{}, {platformId:'unknown',databasePath:'file',packageId:'gibraltar'}, {platformId:'fenix',databasePath:123,packageId:'gibraltar'}])assert.throws(()=>parseInstallRequest(value),/Invalid insertion request/);
 assert.deepEqual(parseInstallRequest({platformId:'fslabs',databasePath:'file.rom',packageId:'gibraltar'}),{platformId:'fslabs',databasePath:'file.rom',packageId:'gibraltar'});
});

test('insertion target must appear in a fresh scan and resolve directly inside its platform folder',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'bav-target-test-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const folder=path.join(root,'navdata');await mkdir(folder);
 const file=path.join(folder,'file.db3');const outside=path.join(root,'outside.db3');await writeFile(file,'fixture');await writeFile(outside,'fixture');
 const request={platformId:'fenix',databasePath:file,packageId:'gibraltar'};
 const scan=[{id:'fenix',name:'Fenix',location:folder,status:'ready',message:'',files:[{name:'file.db3',path:file,size:0,modified:'',packages:[]}]}];
 assert.equal(await resolveInstallationTarget(request,scan),await realpath(file));
 await assert.rejects(resolveInstallationTarget({...request,databasePath:outside},scan),/no longer available/);
 const badScan=[{...scan[0],files:[{...scan[0].files[0],path:outside}]}];
 await assert.rejects(resolveInstallationTarget({...request,databasePath:outside},badScan),/outside the platform folder/);
});
