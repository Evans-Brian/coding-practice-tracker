import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';

function loadModule(entry) {
  const result = buildSync({entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'esm'});
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const {dashboardQuestions, neetcodeTopics} = await loadModule('app/study-catalog.ts');
const {studyTiers, neetcodeSections, sectionForQuestion, classifyQuestionTier} = await loadModule('app/study-priorities.ts');

assert.equal(dashboardQuestions.length, 152);
assert.equal(new Set(dashboardQuestions.map(question => question.slug)).size, 152);
assert.deepEqual(studyTiers.map(tier => tier.id), ['prioritized', 'medium', 'not-prioritized']);
assert.equal(neetcodeSections.length, 21);
assert.equal(new Set(neetcodeSections.map(section => section.id)).size, neetcodeSections.length);
assert(neetcodeSections.every(section => /^[a-z0-9-]+$/.test(section.id)));
assert(neetcodeSections.every(section => Number.isInteger(section.relevance) && section.relevance >= 0 && section.relevance <= 100));

// Every question has exactly one section, even where a topic is split by difficulty.
for (const question of dashboardQuestions) {
  const matches = neetcodeSections.filter(section => section.matches(question));
  assert.equal(matches.length, 1, question.slug);
  assert.equal(sectionForQuestion(question)?.id, matches[0].id, question.slug);
  assert.equal(classifyQuestionTier(question), matches[0].tier, question.slug);
  assert.equal(neetcodeTopics[question.bucket], question.theme, question.slug);
}

const expectedCounts = {
  prioritized: {total: 112, difficulties: [21, 82, 9]},
  medium: {total: 20, difficulties: [0, 11, 9]},
  'not-prioritized': {total: 20, difficulties: [7, 10, 3]},
};
for (const tier of studyTiers) {
  const questions = dashboardQuestions.filter(question => classifyQuestionTier(question) === tier.id);
  assert.equal(questions.length, expectedCounts[tier.id].total, tier.id);
  assert.deepEqual(['Easy', 'Medium', 'Hard'].map(difficulty => questions.filter(question => question.difficulty === difficulty).length), expectedCounts[tier.id].difficulties, tier.id);
}

assert.deepEqual(neetcodeSections.filter(section => section.tier === 'prioritized').map(section => section.title), [
  'Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Stack', 'Binary Search',
  'Trees', 'Graphs', 'Heap / Priority Queue', 'Intervals', '1-D Dynamic Programming',
  'Greedy', 'Linked List', 'Backtracking',
]);
assert.deepEqual(neetcodeSections.filter(section => section.tier === 'medium').map(section => section.title), [
  'LRU Cache', '2-D Dynamic Programming', 'Trees · Hard', 'Advanced Graphs',
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

console.log('Verified: 152 unique questions in three ordered tiers (112 / 20 / 20), stable topic buckets and anchors, split hard sections, and LRU Cache first in Medium Priority.');
