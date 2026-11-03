import test from 'node:test';
import assert from 'node:assert/strict';
import {UpdateRestartCoordinator} from '../dist/main/update-restart.js';
const tick=()=>new Promise(resolve=>setTimeout(resolve,20));

test('downloaded update waits for database work before prompting or restarting',async t=>{
 let busy=true,prompts=0,restarts=0;
 const updater=new UpdateRestartCoordinator(()=>busy,async()=>{prompts++;return true;},()=>restarts++,5);
 t.after(()=>updater.stop());updater.downloaded();await tick();assert.equal(prompts,0);assert.equal(restarts,0);
 busy=false;await tick();assert.equal(prompts,1);assert.equal(restarts,1);
});

test('Later never restarts the app',async t=>{
 let restarts=0;
 const updater=new UpdateRestartCoordinator(()=>false,async()=>false,()=>restarts++,5);
 t.after(()=>updater.stop());updater.downloaded();await tick();assert.equal(restarts,0);
});

test('an insertion starting while the update dialog is open defers the restart',async t=>{
 let busy=false,respond,restarts=0,prompts=0;
 const updater=new UpdateRestartCoordinator(()=>busy,()=>{prompts++;return new Promise(resolve=>{respond=resolve;});},()=>restarts++,5);
 t.after(()=>updater.stop());updater.downloaded();busy=true;respond(true);await tick();assert.equal(restarts,0);
 busy=false;await tick();assert.equal(prompts,2);respond(true);await tick();assert.equal(restarts,1);
});

test('quitting cancels a deferred update',async()=>{
 let prompts=0;
 const updater=new UpdateRestartCoordinator(()=>true,async()=>{prompts++;return true;},()=>assert.fail('must not restart'),5);
 updater.downloaded();updater.stop();await tick();assert.equal(prompts,0);
});
