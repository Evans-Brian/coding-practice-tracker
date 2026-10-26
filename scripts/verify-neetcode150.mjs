import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';

function loadModule(entry) {
  const result = buildSync({entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'esm'});
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const catalog = await loadModule('app/study-catalog.ts');
const {questions: originalQuestions, isCurrentQuestion} = await loadModule('app/questions.ts');
const {blankProgress, isCompleted} = await loadModule('app/progress-state.ts');
const {neetcodeQuestions, neetcodeTopics, dashboardQuestions, extraPracticeQuestions, allowedQuestionSlugs, studyQuestions, studyGroups, eligibleQuestions} = catalog;

assert.equal(neetcodeQuestions.length, 150);
assert.equal(new Set(neetcodeQuestions.map(q => q.slug)).size, 150);
assert.equal(neetcodeTopics.length, 18);
const expectedGroupSizes = [9, 5, 6, 7, 7, 11, 15, 7, 9, 3, 13, 6, 12, 11, 8, 6, 8, 7];
for (const [index, title] of neetcodeTopics.entries()) {
  const group = neetcodeQuestions.filter(q => q.bucket === index);
  assert.equal(group.length, expectedGroupSizes[index], title);
  assert(group.every(q => q.theme === title));
}
assert.deepEqual(['Easy', 'Medium', 'Hard'].map(level => neetcodeQuestions.filter(q => q.difficulty === level).length), [28, 101, 21]);
assert(neetcodeQuestions.every(q => /^[a-z0-9-]+$/.test(q.slug) && q.kind === 'leetcode'));
assert(neetcodeQuestions.every((q, index) => q.order === index + 1 && allowedQuestionSlugs.has(q.slug)));

// Every historical ID remains accepted by the progress API, including retained questions.
assert(originalQuestions.every(q => allowedQuestionSlugs.has(q.slug)));
const all = studyQuestions('all');
assert.equal(new Set(all.map(q => q.slug)).size, all.length);
assert.equal(studyGroups('all').length, 19);
assert(originalQuestions.every(q=>all.some(candidate=>candidate.slug===q.slug)));
assert.equal(dashboardQuestions.length,150+extraPracticeQuestions.length);

const saved = {...blankProgress, notes: 'Existing notes', completions: 3, tries: 2, repeat: true, submitted: true, retained: true};
const data = {'group-anagrams': saved};
assert.equal(eligibleQuestions('neetcode', data).length, dashboardQuestions.length);
assert.equal(eligibleQuestions('neetcode', data).filter(q => isCompleted(data[q.slug] ?? blankProgress)).length, 1);
assert.equal(studyQuestions('all').filter(q => q.slug === 'group-anagrams').length, 1);
assert(isCompleted({...blankProgress, completions: 1}));
assert(isCompleted({...blankProgress, submitted: true}));
assert(!isCompleted(blankProgress));

const archived = originalQuestions.find(q => !isCurrentQuestion(q.slug));
if (archived) {
  const historical = {[archived.slug]: saved};
  assert(eligibleQuestions('all', historical).some(q => q.slug === archived.slug));
}

console.log('Verified: 150 unique questions, 18 topic groups, all difficulties, shared progress IDs, and retained history.');
