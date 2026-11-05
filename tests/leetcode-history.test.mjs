import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {buildPointsDashboard,difficultyPointUnits,localDay} from '../app/points-model.ts';
import {parseLeetcodeHistory,leetcodeHistorySourceUrl} from '../app/leetcode-history-input.ts';
import {recordLeetcodeHistory} from '../db/record-leetcode-history.ts';

const now=new Date('2026-11-04T20:00:00Z');
const entry=(questionId='example-question',completedDay='2026-10-25',difficulty='Medium',name='Example question')=>({questionId,completedDay,difficulty,name});
const coverage={firstDay:'2020-01-01',lastDay:'2026-11-04',reviewedProblems:2,expectedProblems:3,complete:false};
const input=(entries=[entry()],review=coverage)=>({entries,coverage:review});
const stored=row=>({...row,pointUnits:difficultyPointUnits[row.difficulty],importedAt:now.toISOString()});
const tracker=(questionId,completedDay,difficulty='Medium')=>({questionId,completedDay,difficulty,pointUnits:difficultyPointUnits[difficulty],completedAt:completedDay+'T18:00:00Z'});

function setup(){
  const sqlite=new DatabaseSync(':memory:');
  for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(file=>file.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8').replaceAll('--> statement-breakpoint',''));
  const wrap=(sql,args=[])=>({bind:(...values)=>wrap(sql,values),run:()=>sqlite.prepare(sql).run(...args)});
  const batchSizes=[];
  const db={prepare:sql=>wrap(sql),batch:async statements=>{batchSizes.push(statements.length);sqlite.exec('BEGIN');try{const results=statements.map(s=>s.run());sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
  return {sqlite,db,batchSizes};
}

test('merges the same problem-day across sources once, preserving tracker attempts and scores',()=>{
  const events=[tracker('example-question','2026-10-25'),tracker('example-question','2026-10-25')];
  const history={entries:[stored(entry()),stored(entry()),stored(entry('example-question','2026-10-26'))]};
  const data=buildPointsDashboard(events,[],[],now,[],history);
  assert.equal(data.totalPoints,2);
  const overlap=data.days.find(day=>day.day==='2026-10-25');
  assert.equal(overlap.questions,1);assert.equal(overlap.attempts,2);assert.equal(overlap.leetcodeQuestions,1);assert.equal(overlap.trackerQuestions,1);assert.equal(overlap.overlapQuestions,1);
  assert.deepEqual(overlap.problems[0].sources,['tracker','leetcode']);
  assert.equal(data.days.find(day=>day.day==='2026-10-26').attempts,0);
  assert.equal(data.history.creditedProblemDays,2);assert.equal(data.history.overlapProblemDays,1);assert.equal(data.history.importedProblems,1);assert.equal(data.history.importedDays,2);
});

test('history fills earlier daily points without changing progress, navigation, or undated tracker attempts',()=>{
  const progress=[{id:'example-question',completions:3,submitted:true,repeat:true}];
  const questions=[{slug:'example-question',name:'Catalog title',difficulty:'Medium',neetcode150:true}];
  const events=[tracker('example-question','2026-10-25')];
  const base=buildPointsDashboard(events,progress,questions,now);
  const data=buildPointsDashboard(events,progress,questions,now,[],{entries:[stored(entry('example-question','2020-01-02')),stored(entry('example-question','2020-01-03'))]});
  assert.equal(data.firstDay,'2020-01-02');assert.equal(data.totalPoints,3);
  assert.deepEqual(data.undated,base.undated);assert.deepEqual(data.navigation,base.navigation);
  assert.deepEqual(data.undated,{attempts:2,questions:1});
  assert.equal(data.days.find(day=>day.day==='2020-01-02').problems[0].name,'Catalog title');
  assert.equal(progress[0].completions,3);
});

test('unknown historical questions keep their titles, difficulty, links, and date-only provenance',()=>{
  const credits=[{id:'credit',pointUnits:1,note:'Study',earnedDay:'2026-10-25',createdAt:'2026-10-25T19:00:00Z'}];
  const data=buildPointsDashboard([],[],[],now,credits,{entries:[stored(entry('outside-the-tracker','2026-10-25','Hard','Outside the tracker'))],import:{...coverage,importedAt:now.toISOString(),sourceUrl:leetcodeHistorySourceUrl}});
  const day=data.days.find(day=>day.day==='2026-10-25');
  assert.equal(day.points,2.5);assert.equal(day.hard,1);assert.equal(day.extraPoints,.5);assert.equal(day.attempts,0);
  assert.deepEqual(day.problems[0],{id:'outside-the-tracker',name:'Outside the tracker',difficulty:'Hard',points:2,attempts:0,href:'https://leetcode.com/problems/outside-the-tracker/',sources:['leetcode']});
  assert.equal(data.history.complete,false);assert.equal(data.history.reviewedProblems,2);assert.equal(data.history.expectedProblems,3);
  assert.equal(data.history.firstDay,'2020-01-01');assert.equal(data.history.sourceUrl,leetcodeHistorySourceUrl);
  assert.equal(buildPointsDashboard([],[],[],now).history,null);
});

test('accepts bounded accepted problem-days, normalizes titles, and removes exact duplicates',()=>{
  const row={...entry(),name:'  Example question  ',status:'Accepted',pointUnits:999};
  const parsed=parseLeetcodeHistory(input([row,row]),localDay(now));
  assert.deepEqual(parsed,{entries:[entry()],coverage});
  assert(parseLeetcodeHistory(input([],{...coverage,reviewedProblems:3,complete:true}),localDay(now)));
  assert.equal(parseLeetcodeHistory(input([entry(),entry('example-question','2026-10-25','Hard')]),localDay(now)),null);
  assert.equal(parseLeetcodeHistory(input(Array.from({length:251},()=>entry())),localDay(now)),null);
});

test('rejects failed submissions, invalid dates, unsafe slugs, missing difficulties, and false complete coverage',()=>{
  for(const patch of [{status:'Wrong Answer'},{status:'Time Limit Exceeded'},{completedDay:'2026-02-29'},{completedDay:'2026-13-01'},{completedDay:'2026.10.25'},{completedDay:'2026-11-05'},{questionId:'../secret'},{questionId:'Example-Question'},{questionId:'https://leetcode.com/problems/test/'},{difficulty:'Unknown'},{name:' '},{name:'x'.repeat(301)}]){
    assert.equal(parseLeetcodeHistory(input([{...entry(),...patch}]),localDay(now)),null,JSON.stringify(patch));
  }
  for(const patch of [{complete:true},{reviewedProblems:4},{reviewedProblems:-1},{expectedProblems:0},{firstDay:'2026-11-04',lastDay:'2026-10-25'},{firstDay:'2026-10-26'},{complete:'true'}]){
    assert.equal(parseLeetcodeHistory(input([entry()],{...coverage,...patch}),localDay(now)),null,JSON.stringify(patch));
  }
  assert.equal(parseLeetcodeHistory(null,localDay(now)),null);
});

test('future-day validation uses New York midnight and daylight-saving boundaries',()=>{
  const beforeMidnight=localDay(new Date('2026-11-05T04:59:59Z'));
  const afterMidnight=localDay(new Date('2026-11-05T05:00:00Z'));
  const nextDay=input([entry('example-question','2026-11-05')],{...coverage,lastDay:'2026-11-05'});
  assert.equal(beforeMidnight,'2026-11-04');assert.equal(parseLeetcodeHistory(nextDay,beforeMidnight),null);assert(parseLeetcodeHistory(nextDay,afterMidnight));
  assert.equal(localDay(new Date('2026-11-01T05:30:00Z')),'2026-11-01');assert.equal(localDay(new Date('2026-11-01T06:30:00Z')),'2026-11-01');
});

test('re-importing is idempotent, batches are bounded, and tracker records remain untouched',async()=>{
  const {sqlite,db,batchSizes}=setup();
  sqlite.prepare('INSERT INTO progress (id,notes,completions,repeat) VALUES (?,?,?,?)').run('example-question','My notes',4,1);
  const before=sqlite.prepare('SELECT * FROM progress').all();
  const entries=Array.from({length:250},(_,index)=>entry('question-'+index));
  const parsed=parseLeetcodeHistory(input(entries),localDay(now));
  await recordLeetcodeHistory(db,parsed,now.toISOString(),leetcodeHistorySourceUrl,difficultyPointUnits);
  await recordLeetcodeHistory(db,parsed,now.toISOString(),leetcodeHistorySourceUrl,difficultyPointUnits);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM leetcode_daily_completions').get().count,250);
  assert.deepEqual(batchSizes,[100,100,51,100,100,51]);
  assert.deepEqual(sqlite.prepare('SELECT * FROM progress').all(),before);assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM completion_events').get().count,0);
  const audit=sqlite.prepare('SELECT * FROM leetcode_history_import').get();assert.equal(audit.complete,0);assert.equal(audit.reviewed_problems,2);assert.equal(audit.expected_problems,3);
  const row=sqlite.prepare('SELECT * FROM leetcode_daily_completions WHERE question_id=?').get('question-0');assert.equal(row.point_units,2);assert.equal(row.completed_day,'2026-10-25');
  sqlite.close();
});

test('a failed first batch rolls back rows and coverage, and a safe retry succeeds',async()=>{
  const {sqlite,db}=setup();
  sqlite.exec('CREATE TRIGGER fail_history BEFORE INSERT ON leetcode_daily_completions BEGIN SELECT RAISE(ABORT, "test failure"); END;');
  const parsed=parseLeetcodeHistory(input(),localDay(now));
  await assert.rejects(recordLeetcodeHistory(db,parsed,now.toISOString(),leetcodeHistorySourceUrl,difficultyPointUnits));
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM leetcode_daily_completions').get().count,0);assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM leetcode_history_import').get().count,0);
  sqlite.exec('DROP TRIGGER fail_history');
  await recordLeetcodeHistory(db,parsed,now.toISOString(),leetcodeHistorySourceUrl,difficultyPointUnits);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM leetcode_daily_completions').get().count,1);sqlite.close();
});

test('an interrupted later batch leaves coverage unadvanced and can be replayed without duplicate scores',async()=>{
  const {sqlite,db}=setup();
  sqlite.exec("CREATE TRIGGER fail_later_history BEFORE INSERT ON leetcode_daily_completions WHEN NEW.question_id='question-100' BEGIN SELECT RAISE(ABORT, 'test failure'); END;");
  const parsed=parseLeetcodeHistory(input(Array.from({length:150},(_,index)=>entry('question-'+index))),localDay(now));
  await assert.rejects(recordLeetcodeHistory(db,parsed,now.toISOString(),leetcodeHistorySourceUrl,difficultyPointUnits));
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM leetcode_daily_completions').get().count,100);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM leetcode_history_import').get().count,0);
  sqlite.exec('DROP TRIGGER fail_later_history');
  await recordLeetcodeHistory(db,parsed,now.toISOString(),leetcodeHistorySourceUrl,difficultyPointUnits);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM leetcode_daily_completions').get().count,150);
  const rows=sqlite.prepare('SELECT question_id AS questionId,name,difficulty,point_units AS pointUnits,completed_day AS completedDay,imported_at AS importedAt FROM leetcode_daily_completions').all();
  assert.equal(buildPointsDashboard([],[],[],now,[],{entries:rows}).totalPoints,150);sqlite.close();
});
