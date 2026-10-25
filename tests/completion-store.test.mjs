import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {recordCompletion} from '../db/record-completion.ts';

function setup(){
  const sqlite=new DatabaseSync(':memory:');
  for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(file=>file.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8').replaceAll('--> statement-breakpoint',''));
  const wrap=(sql,args=[])=>({bind:(...values)=>wrap(sql,values),run:()=>sqlite.prepare(sql).run(...args)});
  const db={prepare:sql=>wrap(sql),batch:async statements=>{sqlite.exec('BEGIN');try{const results=statements.map(s=>s.run());sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
  return {sqlite,db};
}
const score={difficulty:'Medium',pointUnits:2,completedAt:'2026-10-25T20:00:00Z',completedDay:'2026-10-25'};
const attempt=submissionId=>({id:'question',notes:'Notes',tries:2,repeat:true,submissionId});
test('records new submissions atomically and ignores both immediate and older retries',async()=>{
  const {sqlite,db}=setup();
  await recordCompletion(db,attempt('attempt-a'),score);await recordCompletion(db,attempt('attempt-a'),score);
  await recordCompletion(db,attempt('attempt-b'),score);await recordCompletion(db,attempt('attempt-a'),score);
  assert.equal(sqlite.prepare('SELECT completions FROM progress').get().completions,2);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM completion_events').get().count,2);sqlite.close();
});
test('retrying a pre-tracking submission does not assign it a new date or score',async()=>{
  const {sqlite,db}=setup();sqlite.prepare('INSERT INTO progress (id,notes,completions,submitted,last_submission) VALUES (?,?,5,1,?)').run('question','Existing notes','old-attempt');
  await recordCompletion(db,attempt('old-attempt'),score);
  assert.equal(sqlite.prepare('SELECT completions FROM progress').get().completions,5);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM completion_events').get().count,0);
  await recordCompletion(db,attempt('new-attempt'),score);
  assert.equal(sqlite.prepare('SELECT completions FROM progress').get().completions,6);sqlite.close();
});
test('a failed event write rolls back the completion count too',async()=>{
  const {sqlite,db}=setup();sqlite.exec('CREATE TRIGGER fail_event BEFORE INSERT ON completion_events BEGIN SELECT RAISE(ABORT, "test failure"); END;');
  await assert.rejects(recordCompletion(db,attempt('failure'),score));
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM progress').get().count,0);sqlite.close();
});
