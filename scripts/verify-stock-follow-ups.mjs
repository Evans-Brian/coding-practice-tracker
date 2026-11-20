import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildSync} from 'esbuild';

async function loadModule(entry){
  const result=buildSync({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const {stockFollowUps}=await loadModule('app/stock-follow-ups-data.ts');
const {studyQuestions,neetcodeQuestions,dashboardQuestions,neetcodeTopics,allowedQuestionSlugs,eligibleQuestions}=await loadModule('app/study-catalog.ts');
const {questions:originalQuestions}=await loadModule('app/questions.ts');
const {retiredPracticeSlugs}=await loadModule('app/practice-exclusions.ts');
const {googleTop50Snapshot,googleTop50Questions}=await loadModule('app/google-top50.ts');
const {googleLastMonthSnapshot,googleLastMonthQuestions}=await loadModule('app/google-last-month.ts');
const {buildPointsDashboard,difficultyPointUnits,questionPoints}=await loadModule('app/points-model.ts');
const {blankProgress,isCompleted}=await loadModule('app/progress-state.ts');
const historySource=JSON.parse(await readFile('app/history-practice-source.json','utf8'));

assert.deepEqual(stockFollowUps.map(q=>[q.id,q.difficulty]),[[122,'Medium'],[309,'Medium'],[714,'Medium'],[123,'Hard'],[188,'Hard']]);
assert.equal(new Set(stockFollowUps.map(q=>q.slug)).size,5);
assert.equal(neetcodeQuestions.length,150);
assert.equal(dashboardQuestions.length,157);
assert.equal(googleTop50Questions.length,50);
assert.equal(googleLastMonthQuestions.length,97);

// Reconstruct the pre-follow-up catalog to ensure this addition cannot move,
// replace, or relabel an existing question or its canonical progress key.
const mainSlugs=new Set(dashboardQuestions.map(q=>q.slug));
const existing=[
  ...dashboardQuestions.map(q=>retiredPracticeSlugs.has(q.slug)?{...q,bucket:neetcodeTopics.length}:q),
  ...originalQuestions.filter(q=>!mainSlugs.has(q.slug)).map((q,index)=>({...q,bucket:neetcodeTopics.length,order:dashboardQuestions.length+index+1})),
];
const existingSlugs=new Set(existing.map(q=>q.slug));
const googleSlugs=new Set(googleTop50Snapshot.questions.map(q=>q.slug));
const googleOnly=googleTop50Snapshot.questions.filter(q=>!existingSlugs.has(q.slug));
const prior=[
  ...existing.map(q=>googleSlugs.has(q.slug)?{...q,googleTop50:true}:q),
  ...googleOnly.map((q,index)=>({name:q.name,slug:q.slug,difficulty:q.difficulty,theme:'Other practice',kind:'leetcode',grind75:false,googleTop50:true,bucket:neetcodeTopics.length,order:existing.length+index+1})),
  ...historySource.filter(q=>!existingSlugs.has(q.slug)&&!googleSlugs.has(q.slug)).map((q,index)=>({...q,theme:'Other practice',kind:'leetcode',grind75:false,bucket:neetcodeTopics.length,order:existing.length+googleOnly.length+index+1})),
];
const priorSlugs=new Set(prior.map(q=>q.slug));
const monthSlugs=new Set(googleLastMonthSnapshot.questions.map(q=>q.slug));
const before=[
  ...prior.map(q=>monthSlugs.has(q.slug)?{...q,googleLastMonth:true}:q),
  ...googleLastMonthSnapshot.questions.filter(q=>!priorSlugs.has(q.slug)).map((q,index)=>({name:q.name,slug:q.slug,difficulty:q.difficulty,theme:'Other practice',kind:'leetcode',grind75:false,googleLastMonth:true,bucket:neetcodeTopics.length,order:prior.length+index+1})),
];
const all=studyQuestions('all'),lookup=new Map(all.map(q=>[q.slug,q]));
assert.equal(lookup.size,all.length);
for(const expected of before)assert.deepEqual(lookup.get(expected.slug),expected,expected.slug);
const beforeSlugs=new Set(before.map(q=>q.slug));
const additions=stockFollowUps.filter(q=>!beforeSlugs.has(q.slug));
assert.equal(additions.length,4);
assert.equal(all.length,before.length+additions.length);
for(const [index,entry] of additions.entries()){
  const q=lookup.get(entry.slug);
  assert.equal(q.order,before.length+index+1,entry.slug);
  assert.equal(q.stockFollowUp,true,entry.slug);
  assert.equal(q.theme,'Other practice',entry.slug);
  assert(!q.neetcode150&&!q.dashboardExtra,entry.slug);
}

const eligible=eligibleQuestions('all',null);
for(const entry of stockFollowUps){
  const canonical=lookup.get(entry.slug);
  assert(canonical,entry.slug);
  assert.equal(canonical.kind,'leetcode',entry.slug);
  assert.equal(canonical.difficulty,entry.difficulty,entry.slug);
  assert(allowedQuestionSlugs.has(entry.slug),entry.slug);
  assert.equal(all.filter(q=>q.slug===entry.slug).length,1,entry.slug);
  assert(eligible.some(q=>q.slug===entry.slug),entry.slug);
  assert.equal(questionPoints(entry.slug,difficultyPointUnits[canonical.difficulty]),entry.difficulty==='Hard'?2:1,entry.slug);
  assert(!googleTop50Snapshot.questions.some(q=>q.slug===entry.slug),entry.slug);
  assert(!googleLastMonthSnapshot.questions.some(q=>q.slug===entry.slug),entry.slug);
}
const cooldown=lookup.get('best-time-to-buy-and-sell-stock-with-cooldown');
assert.equal(cooldown.neetcode150,true);
assert.equal(cooldown.order,113);
assert.equal(cooldown.stockFollowUp,undefined);

// Both nested renderers and Repeat/Done use these same five canonical keys;
// submitting them earns normal difficulty points with no same-day duplication.
const day='2026-11-19',now=new Date(day+'T18:00:00.000Z');
const events=stockFollowUps.map(entry=>({questionId:entry.slug,difficulty:lookup.get(entry.slug).difficulty,pointUnits:difficultyPointUnits[entry.difficulty],completedAt:now.toISOString(),completedDay:day}));
const progress=stockFollowUps.map(entry=>({id:entry.slug,completions:1,submitted:true,repeat:true}));
const points=buildPointsDashboard([...events,...events],progress,all,now);
assert.equal(points.totalPoints,7);
assert.equal(points.todayPoints,7);
assert.equal(points.todayQuestions,5);
assert.equal(points.navigation.neetcode,1);
assert.equal(points.navigation.repeat,5);
const saved=Object.fromEntries(stockFollowUps.map(entry=>[entry.slug,{...blankProgress,completions:1,submitted:true,repeat:true}]));
const repeated=eligibleQuestions('all',saved).filter(q=>isCompleted(saved[q.slug]??blankProgress)&&(saved[q.slug]??blankProgress).repeat);
assert.equal(repeated.length,5);

console.log('Verified: five trackable Stock follow-ups, four appended canonical entries, unchanged older metadata/orders and ranked catalogs, shared progress/API keys, and normal deduplicated difficulty points.');
