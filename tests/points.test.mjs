import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPointsDashboard,localDay} from '../app/points-model.ts';

const questions=[{slug:'easy',name:'Easy question',difficulty:'Easy',neetcode150:true},{slug:'medium',name:'Medium question',difficulty:'Medium',neetcode150:true},{slug:'hard',name:'Hard question',difficulty:'Hard',neetcode150:true}];
const event=(questionId,difficulty,pointUnits,completedDay,hour=12)=>({questionId,difficulty,pointUnits,completedDay,completedAt:completedDay+`T${hour}:00:00Z`});
test('scores each difficulty and credits a problem only once per day, but again on another day',()=>{
  const events=[event('easy','Easy',1,'2026-10-24'),event('medium','Medium',2,'2026-10-24'),event('hard','Hard',4,'2026-10-24'),event('hard','Hard',4,'2026-10-24',15),event('hard','Hard',4,'2026-10-25')];
  const data=buildPointsDashboard(events,[],questions,new Date('2026-10-25T20:00:00Z'));
  assert.equal(data.days[1].points,3.5);assert.equal(data.days[1].questions,3);assert.equal(data.days[1].attempts,4);
  assert.equal(data.days[1].hard,1);assert.equal(data.todayPoints,2);assert.equal(data.totalPoints,5.5);assert.equal(data.weekPoints,5.5);
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
