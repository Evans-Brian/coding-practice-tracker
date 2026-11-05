import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPointsDashboard,localDay} from '../app/points-model.ts';
import {parseStudyCredit,validCreditId} from '../app/study-credit-input.ts';

const questions=[{slug:'easy',name:'Easy question',difficulty:'Easy',neetcode150:true},{slug:'medium',name:'Medium question',difficulty:'Medium',neetcode150:true},{slug:'hard',name:'Hard question',difficulty:'Hard',neetcode150:true}];
const event=(questionId,difficulty,pointUnits,completedDay,hour=12)=>({questionId,difficulty,pointUnits,completedDay,completedAt:completedDay+`T${hour}:00:00Z`});
test('scores each difficulty and credits a problem only once per day, but again on another day',()=>{
  const events=[event('easy','Easy',1,'2026-10-24'),event('medium','Medium',2,'2026-10-24'),event('hard','Hard',4,'2026-10-24'),event('hard','Hard',4,'2026-10-24',15),event('hard','Hard',4,'2026-10-25')];
  const data=buildPointsDashboard(events,[],questions,new Date('2026-10-25T20:00:00Z'));
  assert.equal(data.days[1].points,3.5);assert.equal(data.days[1].questions,3);assert.equal(data.days[1].attempts,4);
  assert.equal(data.days[1].hard,1);assert.equal(data.todayPoints,2);assert.equal(data.totalPoints,5.5);assert.equal(data.weekPoints,5.5);
});

test('SQL earns half at every difficulty while algorithm questions and extra study keep their full value',()=>{
  const day='2026-10-25',now=new Date(day+'T20:00:00Z');
  const events=[event('combine-two-tables','Easy',1,day),event('second-highest-salary','Medium',2,day),event('department-top-three-salaries','Hard',4,day),event('easy','Easy',1,day),event('medium','Medium',2,day),event('hard','Hard',4,day)];
  const original=structuredClone(events);
  const data=buildPointsDashboard(events,[],questions,now,[credit('study',1,day)]);
  assert.deepEqual(data.days[0].problems.map(p=>p.points),[.25,.5,1,.5,1,2]);
  assert.equal(data.todayPoints,5.75);assert.equal(data.weekPoints,5.75);assert.equal(data.totalPoints,5.75);
  assert.deepEqual([data.days[0].easy,data.days[0].medium,data.days[0].hard],[2,2,2]);
  assert.equal(data.days[0].extraPoints,.5);assert.deepEqual(events,original);
});

test('SQL is halved once across tracker/import overlap, once per day, and again on a later day',()=>{
  const questionId='combine-two-tables',day='2026-10-24';
  const events=[event(questionId,'Easy',1,day),event(questionId,'Easy',1,day,15)];
  const history={entries:[day,day,'2026-10-25'].map(completedDay=>({questionId,name:'Combine Two Tables',difficulty:'Easy',pointUnits:1,completedDay,importedAt:'2026-10-25T20:00:00Z'}))};
  const progress=[{id:questionId,completions:3,submitted:1,repeat:1}];
  const data=buildPointsDashboard(events,progress,[],new Date('2026-10-25T20:00:00Z'),[],history);
  assert.equal(data.totalPoints,.5);assert.equal(data.todayPoints,.25);
  assert.equal(data.days[1].points,.25);assert.equal(data.days[1].attempts,2);assert.equal(data.days[1].questions,1);
  assert.deepEqual(data.days[1].problems[0].sources,['tracker','leetcode']);
  assert.equal(data.history.overlapProblemDays,1);assert.deepEqual(data.undated,{attempts:1,questions:1});
  assert.deepEqual(data.navigation,{neetcode:0,repeat:1,done:0});
});

const credit=(id,pointUnits,earnedDay,note='Watched a video')=>({id,pointUnits,earnedDay,note,createdAt:earnedDay+'T18:00:00Z'});
test('extra study credits add to daily, weekly and all-time totals without changing problem history',()=>{
  const progress=[{id:'medium',completions:2,submitted:1,repeat:1}];
  const events=[event('medium','Medium',2,'2026-10-26'),event('medium','Medium',2,'2026-10-26',15)];
  const now=new Date('2026-10-26T20:00:00Z'),base=buildPointsDashboard(events,progress,questions,now);
  const data=buildPointsDashboard(events,progress,questions,now,[credit('old',2,'2026-10-01'),credit('half',1,'2026-10-26'),credit('whole',2,'2026-10-26')]);
  assert.equal(data.todayPoints,2.5);assert.equal(data.weekPoints,2.5);assert.equal(data.totalPoints,3.5);
  assert.equal(data.days[0].extraPoints,1.5);assert.equal(data.days[0].extras.length,2);
  assert.equal(data.days[0].questions,1);assert.equal(data.days[0].attempts,2);assert.equal(data.days[0].medium,1);
  assert.deepEqual(data.navigation,base.navigation);assert.deepEqual(data.undated,base.undated);
});

test('study-only days show up in the chart, and removing all credits restores the empty dashboard',()=>{
  const now=new Date('2026-10-26T20:00:00Z');
  const data=buildPointsDashboard([],[],questions,now,[credit('half',1,'2026-10-24')]);
  assert.equal(data.firstDay,'2026-10-24');assert.deepEqual(data.chart.map(day=>day.points),[.5,0,0]);
  assert.equal(data.days[2].questions,0);assert.equal(data.days[2].attempts,0);assert.equal(data.days[2].extraPoints,.5);
  const removed=buildPointsDashboard([],[],questions,now,[]);
  assert.equal(removed.totalPoints,0);assert.equal(removed.firstDay,null);assert.deepEqual(removed.days,[]);
});

test('accepts only half-point or one-point entries with valid identifiers and bounded notes',()=>{
  const id='fa85c3b1-faa2-4be6-b7ce-fb4cb539fd79';
  assert.deepEqual(parseStudyCredit({id,pointUnits:1,note:'  Video  '}),{id,pointUnits:1,note:'Video'});
  assert(parseStudyCredit({id,pointUnits:2,note:''}));
  for(const pointUnits of [0,-1,.5,3,'1',null])assert.equal(parseStudyCredit({id,pointUnits,note:''}),null);
  assert.equal(parseStudyCredit({id,pointUnits:1,note:'x'.repeat(501)}),null);
  assert.equal(parseStudyCredit({id:'bad',pointUnits:1,note:''}),null);
  assert.equal(parseStudyCredit(null),null);assert.equal(validCreditId(null),false);
});
test('uses New York calendar days around midnight and daylight-saving changes',()=>{
  assert.equal(localDay(new Date('2026-10-26T03:59:59Z')),'2026-10-25');
  assert.equal(localDay(new Date('2026-10-26T04:00:00Z')),'2026-10-26');
  assert.equal(localDay(new Date('2026-11-01T05:30:00Z')),'2026-11-01');
  assert.equal(localDay(new Date('2026-11-01T06:30:00Z')),'2026-11-01');
});
test('keeps old completions undated and excludes them from daily scores',()=>{
  const progress=[{id:'easy',completions:4,submitted:1,repeat:1},{id:'hard',completions:2,submitted:1,repeat:0}];
  const data=buildPointsDashboard([event('easy','Easy',1,'2026-10-25'),event('easy','Easy',1,'2026-10-25',15)],progress,questions,new Date('2026-10-25T20:00:00Z'));
  assert.deepEqual(data.undated,{attempts:4,questions:2});assert.equal(data.totalPoints,.5);
  assert.deepEqual(data.navigation,{neetcode:2,repeat:1,done:1});
});
test('fills chart gaps after the first recorded day without inventing earlier history',()=>{
  const data=buildPointsDashboard([event('medium','Medium',2,'2026-10-23')],[],questions,new Date('2026-10-25T20:00:00Z'));
  assert.deepEqual(data.chart.map(d=>d.points),[1,0,0]);assert.equal(data.chart[0].day,'2026-10-23');
  assert.deepEqual(data.days.map(d=>[d.day,d.points]),[['2026-10-25',0],['2026-10-24',0],['2026-10-23',1]]);
  const empty=buildPointsDashboard([],[],questions,new Date('2026-10-25T20:00:00Z'));assert.deepEqual(empty.chart,[]);assert.equal(empty.firstDay,null);
});
