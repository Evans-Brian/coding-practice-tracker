import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';

async function loadModule(entry){
  const result=buildSync({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const {supplementalPracticeQuestions}=await loadModule('app/supplemental-practice-data.ts');
const {studyQuestions,eligibleQuestions,allowedQuestionSlugs,neetcodeQuestions,dashboardQuestions,neetcodeTopics}=await loadModule('app/study-catalog.ts');
const {googleTop50Snapshot}=await loadModule('app/google-top50.ts');
const {googleLastMonthSnapshot}=await loadModule('app/google-last-month.ts');
const {blankProgress,isCompleted}=await loadModule('app/progress-state.ts');
const {buildPointsDashboard,difficultyPointUnits}=await loadModule('app/points-model.ts');

assert.deepEqual(supplementalPracticeQuestions.map(q=>[q.leetcodeId,q.name,q.slug,q.difficulty]),[
  [1937,'Maximum Number of Points with Cost','maximum-number-of-points-with-cost','Medium'],
  [975,'Odd Even Jump','odd-even-jump','Hard'],
]);
assert.equal(neetcodeQuestions.length,150);
assert.equal(dashboardQuestions.length,157);
assert.equal(googleTop50Snapshot.questions.length,50);
assert.equal(googleLastMonthSnapshot.questions.length,97);

const all=studyQuestions('all'),lookup=new Map(all.map(q=>[q.slug,q]));
assert.equal(lookup.size,all.length);
const mainSlugs=new Set(dashboardQuestions.map(q=>q.slug));
const uncompleted=eligibleQuestions('all',null);
const saved={};
for(const [index,entry] of supplementalPracticeQuestions.entries()){
  const q=lookup.get(entry.slug);
  assert(q,entry.slug);assert(allowedQuestionSlugs.has(entry.slug),entry.slug);
  assert.equal(all.filter(candidate=>candidate.slug===entry.slug).length,1,entry.slug);
  assert.equal(q.name,entry.name,entry.slug);
  assert.equal(q.difficulty,entry.difficulty,entry.slug);
  assert.equal(q.kind,'leetcode',entry.slug);
  assert.equal(q.theme,'Other practice',entry.slug);
  assert.equal(q.bucket,neetcodeTopics.length,entry.slug);
  assert.equal(q.order,261+index,entry.slug);
  assert.equal(all.indexOf(q),260+index,entry.slug);
  assert.equal(entry.sourceUrl,'https://leetcode.com/problems/'+entry.slug+'/');
  assert(!mainSlugs.has(entry.slug),entry.slug);
  assert(!uncompleted.some(candidate=>candidate.slug===entry.slug),entry.slug);
  assert(!googleTop50Snapshot.questions.some(candidate=>candidate.slug===entry.slug),entry.slug);
  assert(!googleLastMonthSnapshot.questions.some(candidate=>candidate.slug===entry.slug),entry.slug);
  saved[entry.slug]={...blankProgress,notes:'Existing notes',completions:1,tries:2,submitted:true,repeat:index===0,retained:true};
}
assert.equal(lookup.get('best-time-to-buy-and-sell-stock-iv').order,260);
const before=structuredClone(saved),eligible=eligibleQuestions('all',saved);
for(const entry of supplementalPracticeQuestions)assert(eligible.some(q=>q.slug===entry.slug),entry.slug);
const completed=eligible.filter(q=>isCompleted(saved[q.slug]??blankProgress));
assert.equal(completed.length,2);
assert.equal(completed.filter(q=>saved[q.slug].repeat).length,1);
assert.equal(completed.filter(q=>!saved[q.slug].repeat).length,1);
assert.deepEqual(saved,before);

// The completion API resolves difficulty from this same all-catalog lookup;
// each saved canonical key earns its normal score once per recorded day.
const day='2026-11-24',now=new Date(day+'T18:00:00Z');
const events=supplementalPracticeQuestions.map(entry=>({questionId:entry.slug,difficulty:lookup.get(entry.slug).difficulty,pointUnits:difficultyPointUnits[lookup.get(entry.slug).difficulty],completedDay:day,completedAt:now.toISOString()}));
const progress=Object.entries(saved).map(([id,value])=>({id,...value}));
const points=buildPointsDashboard([...events,...events],progress,all,now);
assert.equal(points.totalPoints,3);
assert.equal(points.todayQuestions,2);
assert.deepEqual(points.navigation,{neetcode:0,repeat:1,done:1});

console.log('Verified: two appended supplemental public definitions, stable prior orders, completion-API eligibility, normal difficulty points, shared Repeat/Done keys, and unchanged main/Google catalogs.');
