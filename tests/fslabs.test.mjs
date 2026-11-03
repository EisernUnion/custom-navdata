import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm,readFile,readdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {NavDataService} from '../dist/navdata/service.js';
import {FslabsAdapter} from '../dist/navdata/adapters/fslabs.js';
import {gibraltar} from '../dist/navdata/packages/gibraltar.js';
import {fslabsGibraltar} from '../dist/navdata/packages/gibraltar-fslabs.js';
import {navDataService} from '../dist/navdata/registry.js';
const schema=await readFile(new URL('./fixtures/fslabs-schema.sql',import.meta.url),'utf8');
const data={...gibraltar,platformVariants:{fslabs:fslabsGibraltar}};
async function fixture(t){
 const root=await mkdtemp(path.join(tmpdir(),'bav-fslabs-test-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const file=path.join(root,'NAV2610002.rom');
 const db=new DatabaseSync(file);
 db.exec(schema);
 db.exec(`INSERT INTO CYCLE_INFO VALUES ('2','CYCLE','2610');
 INSERT INTO AIRPORT (ARPT_IDENT,ARPT_ICAO_CODE,ARPT_LAT,ARPT_LON,CONT_NR,FILE_RECD_NR,CYCLE) VALUES ('LXGB','LX',36.151,-5.349,'1',1,2610);
 INSERT INTO RUNWAY (ARPT_IDENT,ARPT_ICAO_CODE,RUNWAY_IDENT,RUNWAY_LAT,RUNWAY_LON,LANDING_THLD_ELEV,THLD_CROSSING_HEIGHT,CONT_NR,FILE_RECD_NR,CYCLE) VALUES
 ('LXGB','LX','RW09',36.15088056,-5.3581,11,40,'1',2,2610),('LXGB','LX','RW27',36.15146944,-5.34116944,11,40,'1',3,2610);
 INSERT INTO WAYPOINT (CUST_AREA,SECT_CODE,SUBS_CODE,REGION_CODE,REGION_ICAO_CODE,REGION_SUBS_CODE,WAYPOINT_IDENT,WAYPOINT_ICAO_CODE,CONT_NR,WAYPOINT_LAT,WAYPOINT_LON,FILE_RECD_NR,CYCLE) VALUES
 ('EUR','E','A','ENRT','  ',' ','PIMOS','LE','1',36.15036111,-4.89347222,4,2007),('EUR','P',' ','LXGB','LX','C','UPMUP','LX','1',36,-5,5,2607);
 CREATE INDEX idx_waypoint_ident ON WAYPOINT(WAYPOINT_IDENT);
 CREATE UNIQUE INDEX idx_waypoint_id ON WAYPOINT(FILE_RECD_NR);
 CREATE UNIQUE INDEX idx_procedure_id ON AIRPORT_PROCEDURE(FILE_RECD_NR);`);
 db.close();
 return {file,root,backups:path.join(root,'backups'),api:new NavDataService([data],[new FslabsAdapter()])};
}
const edit=(file,fn)=>{const db=new DatabaseSync(file);try{return fn(db);}finally{db.close();}};
const check=f=>f.api.inspect('fslabs',f.file)[0];
const install=f=>f.api.install('fslabs',f.file,'gibraltar',f.backups);

test('CSV conversion preserves content, normalizes units, and supplies missing arc centers',()=>{
 assert.equal(fslabsGibraltar.waypoints.length,20);
 assert.deepEqual(fslabsGibraltar.approaches.map(a=>a.ident),['R09','R27']);
 const source=JSON.stringify(fslabsGibraltar);
 assert.ok(!source.includes('FILE_RECD_NR'));
 for(const approach of fslabsGibraltar.approaches){
  const hold=approach.legs.find(l=>l.path==='HM');assert.equal(hold.distance,1);assert.equal(hold.distanceUnit,'minutes');
  for(const leg of approach.legs.filter(l=>l.path==='RF')){assert.ok(fslabsGibraltar.waypoints.some(w=>w.ident===leg.center));}
 }
 const rf=fslabsGibraltar.approaches[0].legs.find(l=>l.fix==='GB094');assert.equal(rf.rnp,0.3);assert.equal(rf.arcRadius,4.3);assert.equal(rf.distance,4.9);
 assert.ok(Math.abs(fslabsGibraltar.waypoints.find(w=>w.ident==='BUGOV').latitude-36.0809583333333)<1e-12);
 assert.ok(gibraltar.approaches.every(a=>a.legs.find(l=>l.path==='HM').distance===4));
 assert.ok(navDataService.adapters.some(a=>a.platformId==='fslabs'));
});

test('FSLabs install creates all records, continuations and timed holds with a consistent backup',async t=>{
 const f=await fixture(t);const before=await readFile(f.file);
 assert.equal(check(f).state,'missing');assert.deepEqual(await readFile(f.file),before);
 const result=await install(f);assert.equal(result.success,true,result.message);assert.ok(result.backupPath);
 assert.equal(check(f).state,'installed');
 edit(f.file,db=>{
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM WAYPOINT').get().n,22);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM WAYPOINT_FLIGHT_PLANNING_CONTINUATION').get().n,20);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM VHF_NAVAID').get().n,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM VHF_NAVAID_FLIGHT_PLANNING_CONTINUATION').get().n,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM AIRPORT_PROCEDURE').get().n,27);
  const holds=db.prepare("SELECT * FROM AIRPORT_PROCEDURE WHERE PATH_AND_TERMINATION='HM'").all();
  assert.equal(holds.length,2);assert.ok(holds.every(r=>r.ROUTE_DISTANCE_HOLDING_DISTANCE_OR_TIME==='T010'));
  assert.ok(holds.every(r=>r.MAG_COURSE===305));
  const arc=db.prepare("SELECT * FROM AIRPORT_PROCEDURE WHERE FIX_IDENT='GB094'").get();
  assert.equal(arc.ARC_RADIUS,4300);assert.equal(arc.RNP,0.3);assert.equal(arc.ROUTE_DISTANCE_HOLDING_DISTANCE_OR_TIME,'0049');
  const upmup=db.prepare("SELECT FIX_ICAO_CODE FROM AIRPORT_PROCEDURE WHERE FIX_IDENT='UPMUP' LIMIT 1").get();assert.equal(upmup.FIX_ICAO_CODE,'LX');
  const center=db.prepare("SELECT WAYPOINT_ICAO_CODE,CYCLE FROM WAYPOINT WHERE WAYPOINT_IDENT='GB403'").get();assert.equal(center.WAYPOINT_ICAO_CODE,'LX');assert.equal(center.CYCLE,2610);
  const ids=db.prepare(`SELECT FILE_RECD_NR FROM WAYPOINT UNION ALL SELECT FILE_RECD_NR FROM WAYPOINT_FLIGHT_PLANNING_CONTINUATION
    UNION ALL SELECT FILE_RECD_NR FROM VHF_NAVAID UNION ALL SELECT FILE_RECD_NR FROM VHF_NAVAID_FLIGHT_PLANNING_CONTINUATION UNION ALL SELECT FILE_RECD_NR FROM AIRPORT_PROCEDURE`).all().map(r=>r.FILE_RECD_NR);
  assert.equal(new Set(ids).size,ids.length);
 });
 edit(result.backupPath,db=>assert.equal(db.prepare('SELECT COUNT(*) AS n FROM AIRPORT_PROCEDURE').get().n,0));
 const installed=await readFile(f.file);assert.equal((await install(f)).success,true);
 assert.deepEqual(await readFile(f.file),installed);assert.equal((await readdir(f.backups)).length,1);
});

test('matching partial installs and missing continuations are completed without duplicates',async t=>{
 const f=await fixture(t);assert.equal((await install(f)).success,true);
 edit(f.file,db=>db.exec("DELETE FROM WAYPOINT_FLIGHT_PLANNING_CONTINUATION WHERE WAYPOINT_IDENT='BUGOV'; DELETE FROM VHF_NAVAID_FLIGHT_PLANNING_CONTINUATION; DELETE FROM AIRPORT_PROCEDURE WHERE PROC_IDENT='R09' AND SEQ_NR=25"));
 assert.equal(check(f).state,'missing');assert.equal((await install(f)).success,true);assert.equal(check(f).state,'installed');
 edit(f.file,db=>assert.equal(db.prepare('SELECT COUNT(*) AS n FROM WAYPOINT').get().n,22));
});

test('existing current-cycle GBR is reused, preserving its data and keeping other-region GBR untouched',async t=>{
 const f=await fixture(t);
 edit(f.file,db=>db.exec(`INSERT INTO VHF_NAVAID (CUST_AREA,SECT_CODE,SUBS_CODE,ARPT_IDENT,ARPT_ICAO_CODE,VOR_IDENT,VHF_ICAO_CODE,CONT_NR,VOR_FREQ,NAVAID_CLASS,DME_LAT,DME_LON,DME_ELEV,FILE_RECD_NR,CYCLE)
  VALUES ('EUR','D',' ','','  ','GBR','LX','1',113.6,' TH  ',36.14350833,-5.34263889,1364,100,2606),
  ('SAM','D',' ','','  ','GBR','SB','1',116.6,'VDH  ',-0.15,-66.99,301,101,2311);`));
 assert.equal((await install(f)).success,true);
 edit(f.file,db=>{const rows=db.prepare('SELECT * FROM VHF_NAVAID ORDER BY FILE_RECD_NR').all();assert.equal(rows.length,2);assert.equal(rows[0].DME_ELEV,1364);assert.equal(rows[0].CYCLE,2606);assert.equal(rows[1].VOR_FREQ,116.6);});
 assert.equal(check(f).state,'installed');
});

test('FSLabs fixed-width padding is handled without treating different data as equal',async t=>{
 const f=await fixture(t);assert.equal((await install(f)).success,true);
 edit(f.file,db=>db.exec("UPDATE AIRPORT_PROCEDURE SET TRANSITION_IDENT='     ' WHERE TRANSITION_IDENT=''; UPDATE WAYPOINT SET WAYPOINT_NAME_DESCR=RTRIM(WAYPOINT_NAME_DESCR)"));
 assert.equal(check(f).state,'installed');
 edit(f.file,db=>db.exec("UPDATE AIRPORT_PROCEDURE SET ROUTE_DISTANCE_HOLDING_DISTANCE_OR_TIME='0040' WHERE PATH_AND_TERMINATION='HM'"));
 assert.equal(check(f).state,'conflict');const before=await readFile(f.file);assert.equal((await install(f)).success,false);assert.deepEqual(await readFile(f.file),before);
});

test('mid-insert errors roll back FSLabs waypoints, navaids and continuations together',async t=>{
 const f=await fixture(t);
 edit(f.file,db=>db.exec("CREATE TRIGGER fail_hold BEFORE INSERT ON AIRPORT_PROCEDURE WHEN NEW.PATH_AND_TERMINATION='HM' BEGIN SELECT RAISE(ABORT,'Test failure'); END"));
 const result=await install(f);assert.equal(result.success,false);assert.ok(result.backupPath);
 edit(f.file,db=>{assert.equal(db.prepare('SELECT COUNT(*) AS n FROM WAYPOINT').get().n,2);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM WAYPOINT_FLIGHT_PLANNING_CONTINUATION').get().n,0);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM VHF_NAVAID').get().n,0);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM AIRPORT_PROCEDURE').get().n,0);});
});

test('missing references, unsupported layouts/cycles and conflicting fixes block FSLabs inserts',async t=>{
 const f=await fixture(t);
 edit(f.file,db=>db.exec("UPDATE CYCLE_INFO SET VALUE='1901' WHERE PARAMETER='CYCLE'"));assert.equal(check(f).state,'unsupported');
 edit(f.file,db=>db.exec("UPDATE CYCLE_INFO SET VALUE='2610' WHERE PARAMETER='CYCLE'; DELETE FROM WAYPOINT WHERE WAYPOINT_IDENT='PIMOS'"));assert.equal(check(f).state,'conflict');
 assert.equal((await install(f)).success,false);
 edit(f.file,db=>db.exec('DROP TABLE VHF_NAVAID_FLIGHT_PLANNING_CONTINUATION'));assert.equal(check(f).state,'unsupported');
});

test('unexpected FSLabs procedure legs and duplicate records are rejected',async t=>{
 const f=await fixture(t);assert.equal((await install(f)).success,true);
 edit(f.file,db=>db.exec("UPDATE AIRPORT_PROCEDURE SET SEQ_NR=999 WHERE PROC_IDENT='R09' AND SEQ_NR=25"));
 assert.equal(check(f).state,'conflict');assert.equal((await install(f)).success,false);
});
