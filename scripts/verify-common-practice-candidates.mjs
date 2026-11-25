import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildSync} from 'esbuild';

async function load(entry){const built=buildSync({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm'});return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));}
const {commonPracticeCandidates:pool,commonPracticeCandidateSlugs,commonPracticeSources}=await load('app/common-practice-candidates.ts');
const {studyQuestions,allowedQuestionSlugs,eligibleQuestions,neetcodeQuestions,dashboardQuestions}=await load('app/study-catalog.ts');
const {blankProgress,isCompleted}=await load('app/progress-state.ts');
const {difficultyPointUnits,questionPoints}=await load('app/points-model.ts');
const source=JSON.parse(await readFile('app/common-practice-candidates-data.json','utf8'));
assert.equal(pool.length,450);
assert.equal(commonPracticeCandidateSlugs.size,pool.length);
assert.equal(new Set(pool.map(q=>q.frontendId)).size,pool.length);
assert.equal(commonPracticeSources[0].commit,'2736633bf3d8a81115b10f299306be91cf822f39');
assert.equal(neetcodeQuestions.length,150);assert.equal(dashboardQuestions.length,157);
const all=studyQuestions('all'),lookup=new Map(all.map(q=>[q.slug,q]));
assert.equal(lookup.size,all.length);
assert.equal(lookup.get('maximum-number-of-points-with-cost').order,261);
assert.equal(lookup.get('odd-even-jump').order,262);
assert.equal(lookup.get('best-time-to-buy-and-sell-stock-iv').order,260);
const untouched=eligibleQuestions('all',null),saved={};
let appended=0;
for(const [index,entry] of pool.entries()){
  assert.deepEqual(Object.keys(source.questions[index]).sort(),['frontendId','slug','name','difficulty','neetcode150','blind75','premium'].sort());
  assert.match(entry.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert(Number.isSafeInteger(entry.frontendId)&&entry.frontendId>0);
  if(index)assert(entry.frontendId>pool[index-1].frontendId);
  const canonical=lookup.get(entry.slug);assert(canonical,entry.slug);
  assert(allowedQuestionSlugs.has(entry.slug),entry.slug);
  assert.equal(canonical.kind,'leetcode',entry.slug);
  assert.equal(canonical.difficulty,entry.difficulty,entry.slug);
  assert.equal(questionPoints(entry.slug,difficultyPointUnits[canonical.difficulty]),{Easy:.5,Medium:1,Hard:2}[canonical.difficulty],entry.slug);
  if(canonical.commonPractice){
    appended++;assert.equal(canonical.order,262+appended,entry.slug);
    assert(!canonical.neetcode150&&!canonical.dashboardExtra,entry.slug);
    assert(!untouched.some(q=>q.slug===entry.slug),entry.slug);
    saved[entry.slug]={...blankProgress,completions:1,submitted:true,repeat:appended%2===0};
  }
}
assert(appended>0);
assert.equal(all.length,262+appended);
const completed=eligibleQuestions('all',saved).filter(q=>isCompleted(saved[q.slug]??blankProgress));
assert.equal(completed.length,appended);
assert(completed.some(q=>saved[q.slug].repeat));assert(completed.some(q=>!saved[q.slug].repeat));
assert.equal(eligibleQuestions('neetcode',null).length,157);
console.log('Verified: public candidate provenance, canonical progress/API IDs, difficulty points, private-membership separation, Repeat/Done eligibility, and stable prior/main catalog orders.');
