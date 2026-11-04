import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { NavDataService } from '../dist/navdata/service.js';
import { FenixDfdAdapter } from '../dist/navdata/adapters/fenix-dfd.js';
import { salzburg } from '../dist/navdata/packages/salzburg.js';

const schema = await readFile(new URL('./fixtures/fenix-dfd-schema.sql', import.meta.url), 'utf8');

async function fixture(t) {
    const root = await mkdtemp(path.join(tmpdir(), 'bav-salzburg-test-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const file = path.join(root, 'navdata-active.db3');
    const db = new DatabaseSync(file);
    db.exec(schema);
    db.exec(`
      INSERT INTO ps_runtime_metadata VALUES (9);
      INSERT INTO tbl_pa_airports (airport_identifier,airport_name,airport_ref_latitude,airport_ref_longitude,airport_type,area_code,icao_code,longest_runway_surface_code,id)
        VALUES ('LOWS','SALZBURG',47.79,13,'M','EUR','LO','H','PA:1');
      INSERT INTO tbl_pg_runways (airport_identifier,runway_identifier,runway_latitude,runway_longitude,runway_length,runway_width,landing_threshold_elevation,threshold_crossing_height,id)
        VALUES ('LOWS','RW33',47.78404722,13.00981667,9350,148,1411,50,'PG:26338');
    `);
    db.close();
    return { file, backupDir: path.join(root, 'backups'), api: new NavDataService([salzburg], [new FenixDfdAdapter()]) };
}
const edit = (file, action) => { const db = new DatabaseSync(file); try { return action(db); } finally { db.close(); } };

test('Salzburg R33-C is inserted with legs, waypoints and runtime head', async t => {
    const f = await fixture(t);
    assert.equal(f.api.inspect('fenix', f.file)[0].state, 'missing');
    const result = await f.api.install('fenix', f.file, 'salzburg', f.backupDir);
    assert.equal(result.success, true, result.message);
    assert.equal(f.api.inspect('fenix', f.file)[0].state, 'installed');
    edit(f.file, db => {
        const legs = db.prepare("SELECT * FROM tbl_pf_iaps WHERE procedure_identifier='R33-C' ORDER BY route_type DESC, seqno").all();
        assert.deepEqual(legs.map(l => [l.route_type, l.seqno, l.path_termination, l.waypoint_identifier]),
            [['Z', 10, 'CA', null], ['R', 10, 'IF', 'WPSI'], ['R', 20, 'TF', 'WS900'], ['R', 30, 'RF', 'WS903'], ['R', 40, 'TF', 'RW33']]);
        assert.ok(legs.every(l => l.transition_identifier === 'FINAL' && l.airport_identifier === 'LOWS'));
        const ids = db.prepare("SELECT waypoint_identifier AS ident, id FROM tbl_pc_terminal_waypoints WHERE region_code='LOWS'").all();
        assert.equal(ids.length, 4);
        const idOf = ident => ids.find(i => i.ident === ident).id;
        const arc = legs.find(l => l.path_termination === 'RF');
        assert.equal(arc.waypoint_identifier_id, idOf('WS903'));
        assert.equal(arc.center_waypoint_id, idOf('WS33C'));
        assert.equal(arc.turn_direction, 'R');
        assert.ok(Math.abs(arc.arc_radius - 1) < 0.15);
        assert.equal(legs.find(l => l.waypoint_identifier === 'RW33').waypoint_identifier_id, 'PG:26338');
        const missed = legs.find(l => l.path_termination === 'CA');
        assert.equal(missed.course, 333);
        assert.equal(missed.altitude1, 4000);
        assert.equal(missed.waypoint_identifier_id, null);
        const head = db.prepare("SELECT * FROM ps_runtime_procedures WHERE procedure_identifier='R33-C'").all();
        assert.equal(head.length, 1);
        assert.equal(head[0].runway_identifier, 'RW33');
        assert.equal(head[0].route_type, 'R');
        assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ps_runtime_waypoints').get().n, 4);
    });
});

test('Salzburg install is idempotent', async t => {
    const f = await fixture(t);
    assert.equal((await f.api.install('fenix', f.file, 'salzburg', f.backupDir)).success, true);
    const before = await readFile(f.file);
    const again = await f.api.install('fenix', f.file, 'salzburg', f.backupDir);
    assert.equal(again.success, true);
    assert.deepEqual(await readFile(f.file), before);
});

test('Fenix schema 11 supports Salzburg without unused enroute-waypoint table', async t => {
    const f = await fixture(t);
    edit(f.file, db => db.exec('UPDATE ps_runtime_metadata SET schema_version=11; DROP TABLE tbl_ea_enroute_waypoints;'));
    assert.equal(f.api.inspect('fenix', f.file)[0].state, 'missing');
    const result = await f.api.install('fenix', f.file, 'salzburg', f.backupDir);
    assert.equal(result.success, true, result.message);
    assert.equal(f.api.inspect('fenix', f.file)[0].state, 'installed');
});
