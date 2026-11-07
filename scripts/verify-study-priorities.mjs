import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';

function loadModule(entry) {
  const result = buildSync({entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'esm'});
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const {dashboardQuestions, neetcodeTopics, studyQuestions, eligibleQuestions} = await loadModule('app/study-catalog.ts');
const {retiredPracticeSlugs} = await loadModule('app/practice-exclusions.ts');
const {studyTiers, neetcodeSections, sectionForQuestion, classifyQuestionTier} = await loadModule('app/study-priorities.ts');

assert.equal(dashboardQuestions.length, 157);
assert.equal(new Set(dashboardQuestions.map(question => question.slug)).size, 157);
assert.deepEqual(studyTiers.map(tier => tier.id), ['prioritized', 'medium', 'not-prioritized']);
assert.equal(neetcodeSections.length, 22);
assert.equal(new Set(neetcodeSections.map(section => section.id)).size, neetcodeSections.length);
assert(neetcodeSections.every(section => /^[a-z0-9-]+$/.test(section.id)));
assert(neetcodeSections.every(section => Number.isInteger(section.relevance) && section.relevance >= 0 && section.relevance <= 100));

// Active questions have exactly one section. Removed practice retains its history.
for (const question of dashboardQuestions) {
  const matches = neetcodeSections.filter(section => section.matches(question));
  if(retiredPracticeSlugs.has(question.slug)){
    assert.equal(matches.length, 0, question.slug);
    assert.equal(sectionForQuestion(question), undefined, question.slug);
    assert.equal(classifyQuestionTier(question), undefined, question.slug);
    const historical=studyQuestions('all').find(q=>q.slug===question.slug);
    assert.equal(historical.bucket, neetcodeTopics.length, question.slug);
    assert.equal(historical.neetcode150, true, question.slug);
    const saved={notes:'Keep my notes',completions:2,tries:1,repeat:true,submitted:true,retained:true};
    assert(eligibleQuestions('all', {[question.slug]:saved}).some(q=>q.slug===question.slug));
    continue;
  }
  assert.equal(matches.length, 1, question.slug);
  assert.equal(sectionForQuestion(question)?.id, matches[0].id, question.slug);
  assert.equal(classifyQuestionTier(question), matches[0].tier, question.slug);
  assert.equal(neetcodeTopics[question.bucket], question.theme, question.slug);
}

const expectedCounts = {
  prioritized: {total: 123, difficulties: [21, 87, 15]},
  medium: {total: 11, difficulties: [0, 7, 4]},
  'not-prioritized': {total: 20, difficulties: [7, 10, 3]},
};
for (const tier of studyTiers) {
  const questions = dashboardQuestions.filter(question => classifyQuestionTier(question) === tier.id);
  assert.equal(questions.length, expectedCounts[tier.id].total, tier.id);
  assert.deepEqual(['Easy', 'Medium', 'Hard'].map(difficulty => questions.filter(question => question.difficulty === difficulty).length), expectedCounts[tier.id].difficulties, tier.id);
}

assert.deepEqual(neetcodeSections.filter(section => section.tier === 'prioritized').map(section => section.title), [
  'Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Stack', 'Binary Search',
  'Trees', 'Graphs', 'Advanced Graphs', 'Heap / Priority Queue', 'Intervals', '1-D Dynamic Programming', '2-D Dynamic Programming',
  'Greedy', 'Linked List', 'Backtracking',
]);
assert.deepEqual(neetcodeSections.filter(section => section.tier === 'medium').map(section => section.title), [
  'LRU Cache', '2-D Dynamic Programming · More practice', 'Trees · Hard',
]);
assert.deepEqual(neetcodeSections.filter(section => section.tier === 'not-prioritized').map(section => section.title), [
  'Math & Geometry', 'Tries', 'Bit Manipulation', 'Linked List · Hard',
]);
assert.deepEqual(neetcodeSections.slice(0, 5).map(section => section.id), ['bucket-0', 'bucket-1', 'bucket-2', 'bucket-3', 'bucket-4']);
assert.deepEqual(neetcodeSections.map(section => section.tier), studyTiers.flatMap(tier => neetcodeSections.filter(section => section.tier === tier.id).map(section => section.tier)));

const lru = dashboardQuestions.find(question => question.slug === 'lru-cache');
assert(lru);
const firstMedium = neetcodeSections.find(section => section.tier === 'medium');
assert.equal(firstMedium.id, 'bucket-5-lru-cache');
assert.equal(firstMedium.relevance, 90);
assert.equal(sectionForQuestion(lru).id, firstMedium.id);
assert.deepEqual(dashboardQuestions.filter(question => firstMedium.matches(question)).map(question => question.slug), ['lru-cache']);

for (const question of dashboardQuestions.filter(question => question.theme === '1-D Dynamic Programming')) {
  assert.equal(classifyQuestionTier(question), 'prioritized', question.slug);
}
for (const question of dashboardQuestions.filter(question => question.theme === 'Trees' && question.difficulty === 'Hard')) {
  assert.equal(sectionForQuestion(question).id, 'bucket-6-medium-priority', question.slug);
}
for (const question of dashboardQuestions.filter(question => question.theme === 'Linked List' && question.difficulty === 'Hard')) {
  assert.equal(sectionForQuestion(question).id, 'bucket-5-not-prioritized', question.slug);
}

// A non-NeetCode custom drill should remain available to the normal catalog renderer.
const outsideCatalog = {...lru, slug: 'custom-drill', theme: 'Other practice'};
assert.equal(sectionForQuestion(outsideCatalog), undefined);
assert.equal(classifyQuestionTier(outsideCatalog), undefined);

for(const [slug,difficulty] of [['split-array-largest-sum','Hard'],['minimum-sum-of-squared-difference','Medium'],['largest-number','Medium']]){
  const question=dashboardQuestions.find(q=>q.slug===slug);
  assert.equal(question?.difficulty, difficulty, slug);
  assert.equal(question?.dashboardExtra, true, slug);
  assert.equal(sectionForQuestion(question).theme, 'Greedy', slug);
  assert.equal(classifyQuestionTier(question), 'prioritized', slug);
}

const shipping=dashboardQuestions.find(q=>q.slug==='capacity-to-ship-packages-within-d-days');
assert.equal(shipping?.difficulty, 'Medium');
assert.equal(shipping?.dashboardExtra, true);
assert.equal(sectionForQuestion(shipping).theme, 'Binary Search');
assert.equal(studyQuestions('all').filter(q=>q.slug===shipping.slug).length, 1);

const fourSum=dashboardQuestions.find(q=>q.slug==='4sum');
assert.equal(fourSum?.difficulty, 'Medium');
assert.equal(fourSum?.dashboardExtra, true);
assert.equal(fourSum?.order, 157);
assert.equal(!!fourSum?.neetcode150, false);
assert.equal(sectionForQuestion(fourSum).theme, 'Two Pointers');
assert.equal(classifyQuestionTier(fourSum), 'prioritized');
assert.equal(studyQuestions('all').filter(q=>q.slug==='4sum').length, 1);
for(const question of dashboardQuestions.filter(q=>q.theme==='Advanced Graphs')){
  assert.equal(classifyQuestionTier(question), 'prioritized', question.slug);
  assert.equal(sectionForQuestion(question).id, 'bucket-11');
}
const highDp=['unique-paths','distinct-subsequences','burst-balloons'];
for(const question of dashboardQuestions.filter(q=>q.theme==='2-D Dynamic Programming')){
  assert.equal(classifyQuestionTier(question), highDp.includes(question.slug)?'prioritized':'medium', question.slug);
  assert.equal(sectionForQuestion(question).relevance, 59);
}

console.log('Verified: 157 unique catalog questions, ordered tiers (123 / 11 / 20), 4Sum in Two Pointers, Advanced Graphs and three selected 2-D DP problems prioritized, preserved retired history, stable anchors, and LRU Cache first in Medium Priority.');
