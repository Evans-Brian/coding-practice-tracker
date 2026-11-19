import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildSync} from 'esbuild';

async function loadModule(entry){
  const result=buildSync({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const {googleLastMonthSnapshot:snapshot,googleLastMonthQuestions}=await loadModule('app/google-last-month.ts');
const {googleTop50Snapshot,googleTop50Questions}=await loadModule('app/google-top50.ts');
const {dashboardQuestions,neetcodeQuestions,neetcodeTopics,studyQuestions,allowedQuestionSlugs,eligibleQuestions}=await loadModule('app/study-catalog.ts');
const {questions:originalQuestions}=await loadModule('app/questions.ts');
const {retiredPracticeSlugs}=await loadModule('app/practice-exclusions.ts');
const {blankProgress,isCompleted}=await loadModule('app/progress-state.ts');
const historySource=JSON.parse(await readFile('app/history-practice-source.json','utf8'));

assert.equal(snapshot.company,'Google');
assert.equal(snapshot.period,'30 days');
assert.equal(snapshot.complete,true);
assert.equal(snapshot.totalQuestions,97);
assert.equal(snapshot.questions.length,97);
assert.equal(googleLastMonthQuestions.length,97);
assert.equal(snapshot.sourceUrl,'https://leetcode.com/company/google/?favoriteSlug=google-thirty-days');
assert.match(snapshot.retrievedOn,/^\d{4}-\d{2}-\d{2}$/);
assert.equal(new Set(snapshot.questions.map(q=>q.slug)).size,97);
assert.equal(new Set(snapshot.questions.map(q=>q.leetcodeId)).size,97);
assert.deepEqual(['Easy','Medium','Hard'].map(difficulty=>snapshot.questions.filter(q=>q.difficulty===difficulty).length),[37,47,13]);
assert.equal(neetcodeQuestions.length,150);
assert.equal(dashboardQuestions.length,157);
assert.equal(googleTop50Questions.length,50);

const all=studyQuestions('all'),lookup=new Map(all.map(q=>[q.slug,q]));
assert.equal(lookup.size,all.length);
for(const [index,entry] of snapshot.questions.entries()){
  assert.equal(entry.rank,index+1);
  assert(Number.isSafeInteger(entry.leetcodeId)&&entry.leetcodeId>0,entry.slug);
  assert.match(entry.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert(entry.name.trim().length>0,entry.slug);
  assert(Number.isFinite(entry.frequency)&&entry.frequency>=0&&entry.frequency<=100,entry.slug);
  if(index)assert(entry.frequency<=snapshot.questions[index-1].frequency,entry.slug);
  const stored=lookup.get(entry.slug),displayed=googleLastMonthQuestions[index];
  assert(stored,entry.slug);assert(allowedQuestionSlugs.has(entry.slug),entry.slug);
  assert.equal(stored.googleLastMonth,true,entry.slug);
  assert.equal(stored.difficulty,entry.difficulty,entry.slug);
  assert.deepEqual({...displayed,order:stored.order},stored,entry.slug);
  assert.equal(displayed.order,entry.rank);
  assert.equal(all.filter(q=>q.slug===entry.slug).length,1,entry.slug);
}

// Reconstruct the complete catalog before the 30-day addition, including all
// Top 50 questions and completed history-only metadata, to catch order shifts.
const dashboardSlugs=new Set(dashboardQuestions.map(q=>q.slug));
const existing=[
  ...dashboardQuestions.map(q=>retiredPracticeSlugs.has(q.slug)?{...q,bucket:neetcodeTopics.length}:q),
  ...originalQuestions.filter(q=>!dashboardSlugs.has(q.slug)).map((q,index)=>({...q,bucket:neetcodeTopics.length,order:dashboardQuestions.length+index+1})),
];
const existingSlugs=new Set(existing.map(q=>q.slug)),googleSlugs=new Set(googleTop50Snapshot.questions.map(q=>q.slug));
const googleOnly=googleTop50Snapshot.questions.filter(q=>!existingSlugs.has(q.slug));
const prior=[
  ...existing.map(q=>googleSlugs.has(q.slug)?{...q,googleTop50:true}:q),
  ...googleOnly.map((q,index)=>({name:q.name,slug:q.slug,difficulty:q.difficulty,theme:'Other practice',kind:'leetcode',grind75:false,googleTop50:true,bucket:neetcodeTopics.length,order:existing.length+index+1})),
  ...historySource.filter(q=>!existingSlugs.has(q.slug)&&!googleSlugs.has(q.slug)).map((q,index)=>({...q,theme:'Other practice',kind:'leetcode',grind75:false,bucket:neetcodeTopics.length,order:existing.length+googleOnly.length+index+1})),
];
for(const expected of prior){
  const {googleLastMonth,...actual}=lookup.get(expected.slug);
  assert.deepEqual(actual,expected,expected.slug);
}
const priorSlugs=new Set(prior.map(q=>q.slug));
const additions=snapshot.questions.filter(q=>!priorSlugs.has(q.slug));
assert.equal(all.length,prior.length+additions.length);
for(const [index,entry] of additions.entries()){
  const q=lookup.get(entry.slug);
  assert.equal(q.order,prior.length+index+1,entry.slug);
  assert.equal(q.theme,'Other practice',entry.slug);
  assert.equal(q.bucket,neetcodeTopics.length,entry.slug);
  assert(!q.neetcode150&&!q.dashboardExtra,entry.slug);
  assert(!dashboardSlugs.has(entry.slug),entry.slug);
}

const eligible=eligibleQuestions('all',null);
assert(snapshot.questions.every(q=>eligible.some(candidate=>candidate.slug===q.slug)));
assert.equal(eligibleQuestions('neetcode',null).length,157);
const target=googleLastMonthQuestions.at(-1);
const saved={...blankProgress,notes:'My shared notes',completions:2,tries:3,repeat:true,submitted:true,retained:true};
const progress={[target.slug]:saved},before=structuredClone(progress);
const repeated=eligibleQuestions('all',progress).filter(q=>isCompleted(progress[q.slug]??blankProgress)&&(progress[q.slug]??blankProgress).repeat);
assert.equal(repeated.filter(q=>q.slug===target.slug).length,1);
assert.deepEqual(progress,before);

console.log('Verified: all 97 Google 30-day questions, source difficulty totals, descending frequency, shared API/progress IDs, preserved Top 50/history display orders, and unchanged main/NeetCode catalogs.');
