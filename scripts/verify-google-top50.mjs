import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';

async function loadModule(entry){
  const result=buildSync({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const {googleTop50Snapshot:snapshot,googleTop50Questions}=await loadModule('app/google-top50.ts');
const {dashboardQuestions,neetcodeQuestions,neetcodeTopics,studyQuestions,allowedQuestionSlugs,eligibleQuestions}=await loadModule('app/study-catalog.ts');
const {questions:originalQuestions}=await loadModule('app/questions.ts');
const {retiredPracticeSlugs}=await loadModule('app/practice-exclusions.ts');
const {blankProgress,isCompleted}=await loadModule('app/progress-state.ts');

assert.equal(snapshot.company,'Google');
assert.equal(snapshot.period,'3 months');
assert.match(snapshot.retrievedOn,/^\d{4}-\d{2}-\d{2}$/);
assert.equal(snapshot.sourceUrl,'https://leetcode.com/company/google/?favoriteSlug=google-three-months');
assert.equal(snapshot.questions.length,50);
assert.equal(googleTop50Questions.length,50);
assert.equal(new Set(snapshot.questions.map(q=>q.slug)).size,50);
assert.equal(new Set(snapshot.questions.map(q=>q.leetcodeId)).size,50);
assert.deepEqual(snapshot.questions.slice(0,5).map(q=>q.slug),[
  'two-sum','add-two-numbers','palindrome-number','median-of-two-sorted-arrays','longest-substring-without-repeating-characters',
]);

const all=studyQuestions('all'),lookup=new Map(all.map(q=>[q.slug,q]));
assert.equal(lookup.size,all.length);
for(const [index,entry] of snapshot.questions.entries()){
  assert.equal(entry.rank,index+1);
  assert(Number.isSafeInteger(entry.leetcodeId)&&entry.leetcodeId>0,entry.slug);
  assert.match(entry.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert(entry.name.trim().length>0,entry.slug);
  assert(['Easy','Medium','Hard'].includes(entry.difficulty),entry.slug);
  assert(Number.isFinite(entry.frequency)&&entry.frequency>=0&&entry.frequency<=100,entry.slug);
  if(index)assert(entry.frequency<=snapshot.questions[index-1].frequency,entry.slug);
  const stored=lookup.get(entry.slug),displayed=googleTop50Questions[index];
  assert(stored,entry.slug);assert(allowedQuestionSlugs.has(entry.slug),entry.slug);
  assert.equal(stored.googleTop50,true,entry.slug);
  assert.equal(stored.difficulty,entry.difficulty,entry.slug);
  assert.equal(displayed.slug,stored.slug,entry.slug);
  assert.deepEqual({...displayed,order:stored.order},stored,entry.slug);
  assert.equal(displayed.order,entry.rank);
  assert.equal(all.filter(q=>q.slug===entry.slug).length,1,entry.slug);
}

// The API's all-catalog lookup accepts new Google questions, while the main
// NeetCode catalog and every older question's metadata/order stay stable.
assert.equal(neetcodeQuestions.length,150);
assert.equal(dashboardQuestions.length,157);
const dashboardSlugs=new Set(dashboardQuestions.map(q=>q.slug));
const priorAll=[
  ...dashboardQuestions.map(q=>retiredPracticeSlugs.has(q.slug)?{...q,bucket:neetcodeTopics.length}:q),
  ...originalQuestions.filter(q=>!dashboardSlugs.has(q.slug)).map((q,index)=>({...q,bucket:neetcodeTopics.length,order:dashboardQuestions.length+index+1})),
];
for(const expected of priorAll){
  const {googleTop50,googleLastMonth,...actual}=lookup.get(expected.slug);
  assert.deepEqual(actual,expected,expected.slug);
}
for(const entry of snapshot.questions.filter(q=>!priorAll.some(prior=>prior.slug===q.slug))){
  const q=lookup.get(entry.slug);
  assert.equal(q.bucket,neetcodeTopics.length,entry.slug);
  assert.equal(q.theme,'Other practice',entry.slug);
  assert(!q.neetcode150&&!q.dashboardExtra,entry.slug);
  assert(!dashboardSlugs.has(entry.slug),entry.slug);
}

const eligible=eligibleQuestions('all',null);
assert(snapshot.questions.every(q=>eligible.some(candidate=>candidate.slug===q.slug)));
const saved={...blankProgress,notes:'Existing shared notes',completions:2,tries:3,repeat:true,submitted:true,retained:true};
const progress={'two-sum':saved},before=structuredClone(progress);
const repeated=eligibleQuestions('all',progress).filter(q=>isCompleted(progress[q.slug]??blankProgress)&&(progress[q.slug]??blankProgress).repeat);
assert.equal(repeated.filter(q=>q.slug==='two-sum').length,1);
assert.equal(googleTop50Questions.find(q=>q.slug==='two-sum').slug,repeated[0].slug);
assert.deepEqual(progress,before);

console.log('Verified: 50 unique Google questions, descending source frequency, visible difficulties, shared API/progress IDs, stable existing catalog metadata, and unchanged NeetCode 150/main practice.');
