import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {parseCommonPracticeSeed,validCommonPracticeCandidates} from '../app/common-practice-input.ts';
import {readCommonPracticeQueue,seedCommonPracticeQueue} from '../db/common-practice.ts';

const createdAt='2026-11-24T18:00:00.000Z';
const catalog=Array.from({length:54},(_,index)=>({slug:'common-question-'+String(index+1).padStart(3,'0'),kind:'leetcode',difficulty:['Easy','Medium','Hard'][index%3]}));
const pool=new Set(catalog.map(question=>question.slug)),selection=catalog.slice(0,50).map(question=>question.slug);

function setup(){
  const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
  for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(file=>file.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8').replaceAll('--> statement-breakpoint',''));
  const bindCounts=[];
  const execute=(sql,args)=>{
    const statement=sqlite.prepare(sql);
    if(/^\s*SELECT/i.test(sql))return {results:statement.all(...args),meta:{changes:0},success:true};
    const result=statement.run(...args);return {results:[],meta:{changes:Number(result.changes)},success:true};
  };
  const wrap=(sql,args=[])=>({sql,bind:(...values)=>{bindCounts.push(values.length);return wrap(sql,values);},execute:()=>execute(sql,args)});
  const batchSizes=[];
  const db={prepare:sql=>wrap(sql),batch:async statements=>{batchSizes.push(statements.length);sqlite.exec('BEGIN');try{const results=statements.map(statement=>statement.execute());sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
  return {sqlite,db,bindCounts,batchSizes};
}
function event(sqlite,questionId,submissionId='manual-attempt'){
  sqlite.prepare('INSERT INTO completion_events (submission_id,question_id,difficulty,point_units,completed_at,completed_day) VALUES (?,?,?,?,?,?)').run(submissionId,questionId,'Medium',2,'2026-11-20T18:00:00.000Z','2026-11-20');
}
function history(sqlite,questionId){
  sqlite.prepare('INSERT INTO leetcode_daily_completions (question_id,completed_day,name,difficulty,point_units,imported_at) VALUES (?,?,?,?,?,?)').run(questionId,'2026-11-20','Question','Medium',2,createdAt);
}

test('accepts exactly 50 distinct safe question IDs and validates public candidates and all three difficulties',()=>{
  const input={questionIds:selection},before=structuredClone(input),parsed=parseCommonPracticeSeed(input);
  assert.deepEqual(parsed,selection);assert.notEqual(parsed,selection);assert.deepEqual(input,before);
  assert(validCommonPracticeCandidates(parsed,pool,catalog));
  for(const value of [null,[],{},selection,{questionIds:selection.slice(0,49)},{questionIds:[...selection,catalog[50].slug]},{questionIds:[selection[0],...selection.slice(0,49)]},{questionIds:[null,...selection.slice(1)]},{questionIds:['../secret',...selection.slice(1)]},{questionIds:['Question',...selection.slice(1)]},{questionIds:['a'.repeat(201),...selection.slice(1)]}])assert.equal(parseCommonPracticeSeed(value),null);
  assert.equal(validCommonPracticeCandidates(selection,new Set(selection.slice(1)),catalog),false);
  assert.equal(validCommonPracticeCandidates(selection,pool,catalog.slice(1)),false);
  assert.equal(validCommonPracticeCandidates(selection,pool,catalog.map(q=>({...q,difficulty:'Medium'}))),false);
  assert.equal(validCommonPracticeCandidates(selection,pool,catalog.map((q,index)=>index===0?{...q,kind:'custom'}:q)),false);
  assert.equal(validCommonPracticeCandidates(selection,pool,catalog.map((q,index)=>index===0?{...q,difficulty:'Unknown'}:q)),false);
});

test('GET is read-only, remains empty before explicit seeding, and reports solved IDs from every source once',async()=>{
  const {sqlite,db}=setup();
  assert.deepEqual(await readCommonPracticeQueue(db),{questionIds:[],solvedSlugs:[],createdAt:null});
  sqlite.prepare('INSERT INTO progress (id,notes,completions,submitted) VALUES (?,?,?,?)').run('draft-only','My draft',0,0);
  sqlite.prepare('INSERT INTO progress (id,completions,submitted) VALUES (?,?,?)').run('count-complete',1,0);
  sqlite.prepare('INSERT INTO progress (id,completions,submitted) VALUES (?,?,?)').run('submitted-complete',0,1);
  sqlite.prepare('INSERT INTO progress (id,completions,submitted) VALUES (?,?,?)').run('shared-complete',1,1);
  event(sqlite,'event-complete');event(sqlite,'shared-complete','shared-event');
  history(sqlite,'history-complete');history(sqlite,'shared-complete');
  const progress=sqlite.prepare('SELECT * FROM progress ORDER BY id').all();
  const result=await readCommonPracticeQueue(db);
  assert.deepEqual(result,{questionIds:[],solvedSlugs:['count-complete','event-complete','history-complete','shared-complete','submitted-complete'],createdAt:null});
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM common_practice_queue').get().count,0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM common_practice_entries').get().count,0);
  assert.deepEqual(sqlite.prepare('SELECT * FROM progress ORDER BY id').all(),progress);sqlite.close();
});

test('an explicit seed stores the fixed 50 IDs and their order only in database records',async()=>{
  const {sqlite,db,bindCounts,batchSizes}=setup(),ordered=[...selection].reverse();
  const result=await seedCommonPracticeQueue(db,ordered,createdAt);
  assert.equal(result.status,'created');assert.deepEqual(result.queue,{questionIds:ordered,solvedSlugs:[],createdAt});
  assert.deepEqual(await readCommonPracticeQueue(db),result.queue);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM common_practice_queue').get().count,1);
  const rows=sqlite.prepare('SELECT position,question_id FROM common_practice_entries ORDER BY position').all();
  assert.equal(rows.length,50);assert.deepEqual(rows.map(row=>row.position),Array.from({length:50},(_,i)=>i+1));
  assert.deepEqual(rows.map(row=>row.question_id),ordered);
  for(const table of ['progress','completion_events','leetcode_daily_completions','study_credits'])assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM '+table).get().count,0,table);
  assert(bindCounts.every(count=>count<=100));assert(batchSizes.every(count=>count<=100));sqlite.close();
});

test('a completed queued question remains in membership and a retry is idempotent without modifying progress',async()=>{
  const {sqlite,db}=setup();await seedCommonPracticeQueue(db,selection,createdAt);
  sqlite.prepare('INSERT INTO progress (id,notes,completions,tries,repeat,submitted,retained,last_submission) VALUES (?,?,2,3,1,1,1,?)').run(selection[0],'My notes','manual-attempt');
  event(sqlite,selection[1]);history(sqlite,selection[2]);
  const before=sqlite.prepare('SELECT * FROM progress').all(),state=await readCommonPracticeQueue(db);
  assert.deepEqual(state.questionIds,selection);assert.deepEqual(state.solvedSlugs,[...selection.slice(0,3)].sort());
  const result=await seedCommonPracticeQueue(db,selection,'2026-11-25T18:00:00.000Z');
  assert.equal(result.status,'existing');assert.deepEqual(result.queue,state);
  assert.deepEqual(sqlite.prepare('SELECT * FROM progress').all(),before);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM completion_events').get().count,1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM leetcode_daily_completions').get().count,1);sqlite.close();
});

test('different membership or order cannot replace an existing queue',async()=>{
  const {sqlite,db}=setup();await seedCommonPracticeQueue(db,selection,createdAt);
  for(const other of [[...selection].reverse(),[...selection.slice(0,49),catalog[50].slug]]){
    const result=await seedCommonPracticeQueue(db,other,'2026-11-25T18:00:00.000Z');
    assert.equal(result.status,'conflict');assert.deepEqual(result.queue.questionIds,selection);assert.equal(result.queue.createdAt,createdAt);
  }
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM common_practice_entries').get().count,50);sqlite.close();
});

test('completed progress, completion events, and imported history all reject a new seed without partial membership',async()=>{
  for(const source of ['count','submitted','event','reconciliation','history']){
    const {sqlite,db}=setup(),id=selection[7];
    if(source==='count'||source==='submitted')sqlite.prepare('INSERT INTO progress (id,notes,completions,submitted) VALUES (?,?,?,?)').run(id,'Keep my note',source==='count'?1:0,source==='submitted'?1:0);
    else if(source==='history')history(sqlite,id);
    else event(sqlite,id,source==='reconciliation'?'leetcode-reconcile:'+id+':2026-11-20':'manual-attempt');
    const beforeProgress=sqlite.prepare('SELECT * FROM progress').all(),beforeHistory=sqlite.prepare('SELECT * FROM leetcode_daily_completions').all(),beforeEvents=sqlite.prepare('SELECT * FROM completion_events').all();
    const result=await seedCommonPracticeQueue(db,selection,createdAt);
    assert.equal(result.status,'ineligible',source);assert.deepEqual(result.completedQuestionIds,[id]);assert.equal(result.queue.createdAt,null);
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM common_practice_queue').get().count,0);
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM common_practice_entries').get().count,0);
    assert.deepEqual(sqlite.prepare('SELECT * FROM progress').all(),beforeProgress);
    assert.deepEqual(sqlite.prepare('SELECT * FROM leetcode_daily_completions').all(),beforeHistory);
    assert.deepEqual(sqlite.prepare('SELECT * FROM completion_events').all(),beforeEvents);sqlite.close();
  }
});

test('notes-only drafts are eligible and remain unchanged when the queue is seeded',async()=>{
  const {sqlite,db}=setup();sqlite.prepare('INSERT INTO progress (id,notes,completions,tries,repeat,submitted) VALUES (?,?,0,2,1,0)').run(selection[0],'Unfinished draft');
  const before=sqlite.prepare('SELECT * FROM progress').all();
  assert.equal((await seedCommonPracticeQueue(db,selection,createdAt)).status,'created');
  assert.deepEqual(sqlite.prepare('SELECT * FROM progress').all(),before);sqlite.close();
});

test('the authoritative seed guard catches a completion arriving after the initial read',async()=>{
  const {sqlite,db}=setup();let injected=false;
  const racing={...db,batch:async statements=>{
    if(!injected&&statements.some(statement=>statement.sql.includes('INSERT INTO common_practice_queue'))){event(sqlite,selection[0]);injected=true;}
    return db.batch(statements);
  }};
  const result=await seedCommonPracticeQueue(racing,selection,createdAt);
  assert.equal(result.status,'ineligible');assert.deepEqual(result.completedQuestionIds,[selection[0]]);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM common_practice_queue').get().count,0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM common_practice_entries').get().count,0);sqlite.close();
});

test('a concurrent different seed wins intact without merging or replacing either ordered list',async()=>{
  const {sqlite,db}=setup(),other=[...selection].reverse();let injected=false;
  const racing={...db,batch:async statements=>{
    if(!injected&&statements.some(statement=>statement.sql.includes('INSERT INTO common_practice_queue'))){injected=true;await seedCommonPracticeQueue(db,other,'2026-11-24T17:59:59.000Z');}
    return db.batch(statements);
  }};
  const result=await seedCommonPracticeQueue(racing,selection,createdAt);
  assert.equal(result.status,'conflict');assert.deepEqual(result.queue.questionIds,other);
  assert.equal(result.queue.createdAt,'2026-11-24T17:59:59.000Z');
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM common_practice_entries').get().count,50);sqlite.close();
});

test('a failed membership insert rolls back the header and all entries, and retrying can create the full queue',async()=>{
  const {sqlite,db}=setup();
  sqlite.exec('CREATE TRIGGER fail_common_entry BEFORE INSERT ON common_practice_entries WHEN NEW.position=25 BEGIN SELECT RAISE(ABORT, "test failure"); END;');
  await assert.rejects(seedCommonPracticeQueue(db,selection,createdAt));
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM common_practice_queue').get().count,0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM common_practice_entries').get().count,0);
  sqlite.exec('DROP TRIGGER fail_common_entry');
  assert.equal((await seedCommonPracticeQueue(db,selection,createdAt)).status,'created');
  assert.deepEqual((await readCommonPracticeQueue(db)).questionIds,selection);sqlite.close();
});
