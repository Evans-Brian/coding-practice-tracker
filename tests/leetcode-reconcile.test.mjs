import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {parseRecentCompletions} from '../app/recent-completion-input.ts';
import {localDay,difficultyPointUnits} from '../app/points-model.ts';
import {reconcileLeetcodeCompletions,reconciliationId} from '../db/reconcile-leetcode-completions.ts';

const now=new Date('2026-11-19T01:00:00.000Z');
const questions=[{slug:'question',difficulty:'Medium'},{slug:'easy-question',difficulty:'Easy'},{slug:'hard-question',difficulty:'Hard'}];
const row=(questionId='question',completedDay='2026-11-15',submissionId=1)=>({questionId,completedAt:completedDay+'T18:00:00.000Z',submissionId,status:'Accepted'});
const parse=(entries,dryRun=false,catalog=questions)=>parseRecentCompletions({entries,dryRun},catalog,now,localDay,difficultyPointUnits);

function setup(){
  const sqlite=new DatabaseSync(':memory:');
  for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(file=>file.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8').replaceAll('--> statement-breakpoint',''));
  const execute=(sql,args)=>{
    const statement=sqlite.prepare(sql);
    if(/^\s*SELECT/i.test(sql))return {results:statement.all(...args),meta:{changes:0},success:true};
    const result=statement.run(...args);return {results:[],meta:{changes:Number(result.changes)},success:true};
  };
  const wrap=(sql,args=[])=>({bind:(...values)=>wrap(sql,values),execute:()=>execute(sql,args)});
  const batchSizes=[];
  const db={prepare:sql=>wrap(sql),batch:async statements=>{batchSizes.push(statements.length);sqlite.exec('BEGIN');try{const results=statements.map(s=>s.execute());sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
  return {sqlite,db,batchSizes};
}
function manual(sqlite,questionId,day,submissionId='manual-'+day){
  sqlite.prepare('INSERT INTO completion_events (submission_id,question_id,difficulty,point_units,completed_at,completed_day) VALUES (?,?,?,?,?,?)').run(submissionId,questionId,'Medium',2,day+'T18:00:00.000Z',day);
}

test('normalizes accepted source records, deduplicates problem-days, and uses canonical difficulty units',()=>{
  const entries=[{...row('question','2026-11-15',3),difficulty:'Hard',pointUnits:999},row('question','2026-11-15',3),{...row('question','2026-11-15',2),completedAt:'2026-11-15T17:00:00.000Z'},row('easy-question','2026-11-16',4)];
  const before=structuredClone(entries),input=parse(entries);
  assert.equal(input.entries.length,2);assert.equal(input.receivedEntries,4);assert.equal(input.duplicateEntries,2);
  assert.equal(input.firstDay,'2026-11-12');assert.equal(input.lastDay,'2026-11-18');assert.equal(input.dryRun,false);
  assert.deepEqual(input.entries[0],{questionId:'question',completedAt:'2026-11-15T17:00:00.000Z',completedDay:'2026-11-15',submissionId:2,difficulty:'Medium',pointUnits:2});
  assert.equal(input.entries[1].pointUnits,1);assert.deepEqual(entries,before);
});

test('date-only accepted evidence retains its precision and does not invent a timestamp or source ID',()=>{
  const input=parse([{questionId:'question',completedDay:'2026-11-12',status:'Accepted'}]);
  assert.deepEqual(input.entries[0],{questionId:'question',completedAt:'2026-11-12',completedDay:'2026-11-12',difficulty:'Medium',pointUnits:2});
  assert(parse([{...input.entries[0],status:'Accepted'}]));
  assert.equal(parse([{questionId:'question',completedDay:'2026-11-31',status:'Accepted'}]),null);
  assert.equal(parse([{...row(),completedDay:'2026-11-14'}]),null);
  assert.equal(parse([{...row(),completedAt:'2026-11-15T18:00:00Z'}]),null);
  const aliased={questionId:'question',completedDay:'2026-11-12',status:'Accepted',sourceSubmissionId:123};
  assert.equal(parse([aliased]).entries[0].submissionId,123);
  assert.equal(parse([{...aliased,submissionId:124}]),null);
  const mixed=parse([{questionId:'question',completedDay:'2026-11-15',status:'Accepted'},row()]);
  assert.equal(mixed.entries[0].completedAt,'2026-11-15T18:00:00.000Z');
});

test('uses New York dates and rejects future times or submissions outside the exact seven-day window',()=>{
  assert.equal(parse([{...row(),completedAt:'2026-11-12T05:00:00.000Z'}]).entries[0].completedDay,'2026-11-12');
  assert.equal(parse([{...row(),completedAt:'2026-11-12T04:59:59.999Z'}]),null);
  assert.equal(parse([{...row(),completedAt:'2026-11-19T01:00:00.001Z'}]),null);
  assert.equal(parse([{...row(),completedAt:'2026-11-19T00:59:59.999Z'}]).entries[0].completedDay,'2026-11-18');
  assert.equal(parse([{...row(),completedAt:'2026-11-13T04:30:00.000Z',completedDay:'2026-11-12'}]).entries[0].completedDay,'2026-11-12');
  assert.equal(parse([{...row(),completedAt:'2026-11-13T04:30:00.000Z',completedDay:'2026-11-13'}]),null);
});

test('rejects unknown questions, failed submissions, conflicting source IDs, and malformed bounded input',()=>{
  for(const patch of [{questionId:'unknown'},{questionId:'../question'},{status:'Wrong Answer'},{status:'Time Limit Exceeded'},{status:undefined},{completedAt:'2026-11-31T18:00:00.000Z'},{completedAt:null},{submissionId:0},{submissionId:-1},{submissionId:1.5},{submissionId:'1'}])assert.equal(parse([{...row(),...patch}]),null,JSON.stringify(patch));
  assert.equal(parse([row(),row('hard-question','2026-11-15',1)]),null);
  assert.equal(parse(Array.from({length:251},()=>row())),null);
  assert.equal(parseRecentCompletions({entries:[],dryRun:'true'},questions,now,localDay,difficultyPointUnits),null);
  assert.equal(parseRecentCompletions(null,questions,now,localDay,difficultyPointUnits),null);
});

test('dry-run accounts for same/previous-day stored and planned completions without changing records',async()=>{
  const {sqlite,db}=setup();manual(sqlite,'question','2026-11-15');
  sqlite.prepare('INSERT INTO progress (id,notes,completions,tries,repeat,submitted,last_submission) VALUES (?,?,7,3,1,1,?)').run('question','Keep my notes','manual-attempt');
  const beforeEvents=sqlite.prepare('SELECT * FROM completion_events').all(),beforeProgress=sqlite.prepare('SELECT * FROM progress').all();
  const entries=['2026-11-13','2026-11-14','2026-11-15','2026-11-16','2026-11-17'].map((day,i)=>row('question',day,i+1));
  const result=await reconcileLeetcodeCompletions(db,parse(entries,true));
  assert.equal(result.dryRun,true);assert.deepEqual(result.added,[]);
  assert.deepEqual(result.wouldAdd.map(e=>e.completedDay),['2026-11-13','2026-11-17']);
  assert.deepEqual(result.skipped.map(e=>e.completedDay),['2026-11-14','2026-11-15','2026-11-16']);
  assert(result.skipped.every(e=>e.reason==='same-or-previous-day-completion'));
  assert.deepEqual(result.skipped.map(e=>[e.matchedDay,e.matchedSource]),[
    ['2026-11-13','reconciliation'],['2026-11-15','tracker'],['2026-11-15','tracker'],
  ]);
  assert.deepEqual(sqlite.prepare('SELECT * FROM completion_events').all(),beforeEvents);
  assert.deepEqual(sqlite.prepare('SELECT * FROM progress').all(),beforeProgress);sqlite.close();
});

test('the authoritative write guard catches a manual completion recorded after dry-run',async()=>{
  const {sqlite,db}=setup(),input=parse([row()]);
  assert.equal((await reconcileLeetcodeCompletions(db,{...input,dryRun:true})).wouldAdd.length,1);
  manual(sqlite,'question','2026-11-14');
  const result=await reconcileLeetcodeCompletions(db,input);
  assert.equal(result.added.length,0);assert.equal(result.skipped[0].reason,'same-or-previous-day-completion');
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM completion_events').get().count,1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM progress').get().count,0);sqlite.close();
});

test('adjacent candidates are not imported twice, and retries preserve the chronological same/previous-day plan',async()=>{
  const {sqlite,db}=setup(),input=parse([row('question','2026-11-16',4),row('question','2026-11-14',1),row('question','2026-11-15',2),{...row('question','2026-11-15',3),completedAt:'2026-11-15T19:00:00.000Z'}]);
  const dry=await reconcileLeetcodeCompletions(db,{...input,dryRun:true});
  assert.deepEqual(dry.wouldAdd.map(e=>e.completedDay),['2026-11-14','2026-11-16']);
  assert.deepEqual(dry.skipped.map(e=>e.completedDay),['2026-11-15']);
  const first=await reconcileLeetcodeCompletions(db,input);
  assert.deepEqual(first.added,dry.wouldAdd);assert.equal(first.duplicates,1);assert.deepEqual(first.skipped,dry.skipped);
  const retried=await reconcileLeetcodeCompletions(db,input);
  assert.equal(retried.added.length,0);assert.equal(retried.skipped.length,3);
  assert.equal(retried.skipped.filter(e=>e.reason==='already-reconciled').length,2);
  assert.equal(sqlite.prepare('SELECT completions FROM progress').get().completions,2);
  const events=sqlite.prepare('SELECT * FROM completion_events ORDER BY completed_day').all();assert.equal(events.length,2);
  assert.equal(events[0].completed_at,'2026-11-14T18:00:00.000Z');
  assert.equal(events[0].submission_id,'leetcode-reconcile:question:2026-11-14');
  assert.equal(events[1].completed_at,'2026-11-16T18:00:00.000Z');sqlite.close();
});

test('manual, reconciled, and imported history all block the same or previous day, while next-day-only records do not',async()=>{
  for(const source of ['tracker','reconciliation','leetcode-history']){
    for(const storedDay of ['2026-11-14','2026-11-15','2026-11-16']){
      const {sqlite,db}=setup(),input=parse([row()]);
      if(source==='leetcode-history')sqlite.prepare('INSERT INTO leetcode_daily_completions (question_id,completed_day,name,difficulty,point_units,imported_at) VALUES (?,?,?,?,?,?)').run('question',storedDay,'Question','Medium',2,now.toISOString());
      else manual(sqlite,'question',storedDay,source==='reconciliation'?reconciliationId({questionId:'question',completedDay:storedDay}):'manual-'+storedDay);
      const historyBefore=sqlite.prepare('SELECT * FROM leetcode_daily_completions').all();
      const dry=await reconcileLeetcodeCompletions(db,{...input,dryRun:true});
      const result=await reconcileLeetcodeCompletions(db,input),blocked=storedDay<='2026-11-15';
      assert.equal(dry.wouldAdd.length,blocked?0:1,source+' '+storedDay);
      assert.deepEqual(result.added,dry.wouldAdd,source+' '+storedDay);
      assert.deepEqual(result.skipped,dry.skipped,source+' '+storedDay);
      if(blocked){assert.equal(result.skipped[0].matchedDay,storedDay);assert.equal(result.skipped[0].matchedSource,source);}
      assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM completion_events').get().count,(source==='leetcode-history'?0:1)+(blocked?0:1));
      assert.deepEqual(sqlite.prepare('SELECT * FROM leetcode_daily_completions').all(),historyBefore);sqlite.close();
    }
  }
});

test('mixed UTC timestamps and date-only evidence are considered in New York calendar-day order',async()=>{
  const {sqlite,db}=setup(),input=parse([
    {questionId:'question',completedDay:'2026-11-18',status:'Accepted'},
    {...row(),completedAt:'2026-11-18T04:30:00.000Z'},
  ]);
  assert.deepEqual(input.entries.map(e=>e.completedDay),['2026-11-17','2026-11-18']);
  const dry=await reconcileLeetcodeCompletions(db,{...input,dryRun:true});
  const actual=await reconcileLeetcodeCompletions(db,input);
  assert.deepEqual(actual.added,dry.wouldAdd);assert.deepEqual(actual.skipped,dry.skipped);
  assert.equal(actual.added[0].completedDay,'2026-11-17');assert.equal(actual.skipped[0].completedDay,'2026-11-18');
  assert.equal(sqlite.prepare('SELECT completions FROM progress').get().completions,1);sqlite.close();
});

test('dry-run carries planned dates across its read batches and matches bounded sequential writes',async()=>{
  const {sqlite,db,batchSizes}=setup();
  const catalog=Array.from({length:100},(_,i)=>({slug:'question-'+String(i).padStart(3,'0'),difficulty:'Medium'}));
  const input=parse([
    row('question-000','2026-11-16',102),
    ...catalog.map((q,i)=>row(q.slug,'2026-11-14',i+1)),
    row('question-000','2026-11-15',101),
  ],false,catalog);
  const dry=await reconcileLeetcodeCompletions(db,{...input,dryRun:true});
  assert.equal(dry.wouldAdd.length,101);assert.equal(dry.skipped.length,1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM completion_events').get().count,0);
  const result=await reconcileLeetcodeCompletions(db,input);
  assert.deepEqual(result.added,dry.wouldAdd);assert.deepEqual(result.skipped,dry.skipped);
  assert.equal(sqlite.prepare('SELECT completions FROM progress WHERE id=?').get('question-000').completions,2);
  assert(batchSizes.every(size=>size<=100));sqlite.close();
});

test('preserves notes, tries, repeat selection and last manual submission while incrementing completion history',async()=>{
  const {sqlite,db}=setup();
  sqlite.prepare('INSERT INTO progress (id,notes,completions,tries,repeat,submitted,retained,last_submission) VALUES (?,?,7,3,1,0,0,?)').run('question','My explanation','last-manual-attempt');
  const result=await reconcileLeetcodeCompletions(db,parse([row(),row('easy-question','2026-11-16',2)]));
  assert.equal(result.added.length,2);
  const existing=sqlite.prepare('SELECT * FROM progress WHERE id=?').get('question');
  assert.deepEqual({...existing},{id:'question',notes:'My explanation',completions:8,tries:3,repeat:1,submitted:1,retained:1,last_submission:'last-manual-attempt'});
  const created=sqlite.prepare('SELECT * FROM progress WHERE id=?').get('easy-question');
  assert.equal(created.completions,1);assert.equal(created.repeat,0);assert.equal(created.notes,'');assert.equal(created.tries,null);
  assert.equal(created.submitted,1);assert.equal(created.retained,1);assert.equal(created.last_submission,reconciliationId({questionId:'easy-question',completedDay:'2026-11-16'}));sqlite.close();
});

test('date-only source dates are persisted as dates and a failed progress write rolls back its event',async()=>{
  const {sqlite,db}=setup(),input=parse([{questionId:'question',completedDay:'2026-11-12',status:'Accepted'}]);
  sqlite.exec('CREATE TRIGGER fail_reconciled_progress BEFORE INSERT ON progress BEGIN SELECT RAISE(ABORT, "test failure"); END;');
  await assert.rejects(reconcileLeetcodeCompletions(db,input));
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM completion_events').get().count,0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM progress').get().count,0);
  sqlite.exec('DROP TRIGGER fail_reconciled_progress');
  await reconcileLeetcodeCompletions(db,input);
  assert.equal(sqlite.prepare('SELECT completed_at,completed_day FROM completion_events').get().completed_at,'2026-11-12');sqlite.close();
});

test('bounded batches can safely replay an interrupted later batch without duplicating earlier completions',async()=>{
  const {sqlite,db,batchSizes}=setup();
  const catalog=Array.from({length:55},(_,i)=>({slug:'question-'+String(i).padStart(3,'0'),difficulty:'Medium'}));
  const input=parse(catalog.map((q,i)=>row(q.slug,'2026-11-15',i+1)),false,catalog);
  sqlite.exec("CREATE TRIGGER fail_later_reconciliation BEFORE INSERT ON progress WHEN NEW.id='question-052' BEGIN SELECT RAISE(ABORT, 'later failure'); END;");
  await assert.rejects(reconcileLeetcodeCompletions(db,input));
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM completion_events').get().count,50);
  assert.equal(sqlite.prepare('SELECT SUM(completions) AS count FROM progress').get().count,50);
  sqlite.exec('DROP TRIGGER fail_later_reconciliation');
  const result=await reconcileLeetcodeCompletions(db,input);
  assert.equal(result.added.length,5);assert.equal(result.skipped.length,50);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM completion_events').get().count,55);
  assert.equal(sqlite.prepare('SELECT SUM(completions) AS count FROM progress').get().count,55);
  assert(batchSizes.every(size=>size<=100));sqlite.close();
});
