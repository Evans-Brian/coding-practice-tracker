import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {buildSync} from 'esbuild';

function loadModule(entry) {
  const result = buildSync({entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'esm'});
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const data = JSON.parse(await readFile('app/question-relevance-data.json', 'utf8'));
const {dashboardQuestions} = await loadModule('app/study-catalog.ts');
const {neetcodeSections, sectionForQuestion, classifyQuestionTier} = await loadModule('app/study-priorities.ts');
const {questionRelevance, relevanceMetadata, relevanceCompanies} = await loadModule('app/question-relevance.ts');
const {default: QuestionRelevanceLabel, RelevanceGuide} = await loadModule('app/question-relevance-label.tsx');

const inRange = (value, label, minimum = 0, maximum = 100) => {
  assert(Number.isFinite(value) && value >= minimum && value <= maximum, `${label}: ${value}`);
};

assert.equal(dashboardQuestions.length, 152);
assert.equal(relevanceMetadata.trackedQuestionCount, 152);
assert.deepEqual(relevanceMetadata, data.metadata);
assert.deepEqual(relevanceCompanies, data.companies);
assert.deepEqual(Object.keys(data.questions).sort(), dashboardQuestions.map(question => question.slug).sort());
assert.equal(relevanceCompanies.length, 25);
assert.equal(relevanceMetadata.sampleCompanyCount, 25);
const companyNames = new Set(relevanceCompanies.map(company => company.name));
assert.equal(companyNames.size, 25);
assert.equal(new Date(relevanceMetadata.approximateWindowStart) < new Date(relevanceMetadata.approximateWindowEnd), true);
assert.equal(new Date(relevanceMetadata.approximateWindowEnd) <= new Date(relevanceMetadata.retrievedOn), true);
assert(relevanceMetadata.commitUrl.endsWith('/' + relevanceMetadata.commit));

let withEvidence = 0;
let withoutEvidence = 0;
for (const question of dashboardQuestions) {
  const evidence = data.questions[question.slug];
  const result = questionRelevance(question);
  assert(result, question.slug);
  inRange(result.score, question.slug);
  assert(Number.isInteger(result.score), question.slug);
  assert(result.score > 0, `Missing or sparse evidence must not erase study value: ${question.slug}`);
  assert(Number.isInteger(evidence.companyCount) && evidence.companyCount >= 0 && evidence.companyCount <= 25, question.slug);
  assert.equal(evidence.companyCount, evidence.companies.length, question.slug);
  assert.equal(new Set(evidence.companies.map(company => company.name)).size, evidence.companyCount, question.slug);
  assert.equal(result.companyCount, evidence.companyCount, question.slug);
  inRange(result.recentWeight, `${question.slug} recent weight`, 0, 0.35);

  const validPercentiles = [];
  for (const company of evidence.companies) {
    assert(companyNames.has(company.name), `${question.slug}: unknown company ${company.name}`);
    if (company.rawFrequency !== null) inRange(company.rawFrequency, `${question.slug}/${company.name} source frequency`);
    if (company.withinCompanyPercentile !== null) {
      inRange(company.withinCompanyPercentile, `${question.slug}/${company.name} percentile`);
      validPercentiles.push(company.withinCompanyPercentile);
    }
  }
  if (validPercentiles.length > 0) {
    inRange(evidence.meanWithinCompanyPercentile, `${question.slug} mean percentile`);
    const expectedMean = validPercentiles.reduce((sum, value) => sum + value, 0) / validPercentiles.length;
    assert(Math.abs(evidence.meanWithinCompanyPercentile - expectedMean) <= 0.011, `${question.slug}: mean percentile`);
  } else {
    assert.equal(evidence.meanWithinCompanyPercentile, null, question.slug);
  }

  if (evidence.companyCount === 0) {
    withoutEvidence++;
    assert.equal(result.recentWeight, 0, question.slug);
    assert.equal(result.recentScore, null, question.slug);
    assert.equal(result.coverage, 'unlisted', question.slug);
    assert.deepEqual(result.companies, [], question.slug);
  } else {
    withEvidence++;
    inRange(result.recentScore, `${question.slug} recent component`);
    if (evidence.companyCount >= 4) {
      assert.equal(result.recentWeight, 0.35, question.slug);
      assert.equal(result.coverage, 'broader', question.slug);
    } else {
      assert(result.recentWeight > 0 && result.recentWeight < 0.35, question.slug);
      assert.equal(result.coverage, 'limited', question.slug);
    }
  }
}
assert.equal(withEvidence, 147);
assert.equal(withoutEvidence, 5);
assert.equal(relevanceMetadata.trackedQuestionsWithEvidence, withEvidence);

const lru = dashboardQuestions.find(question => question.slug === 'lru-cache');
assert(lru);
assert.equal(classifyQuestionTier(lru), 'medium');
assert.equal(sectionForQuestion(lru).id, neetcodeSections.find(section => section.tier === 'medium').id);
assert.equal(questionRelevance(lru).topicScore, 90);
inRange(questionRelevance(lru).score, 'LRU Cache score');

// A hard subsection describes extra study depth; a question keeps its parent topic baseline.
for (const theme of ['Trees', 'Linked List']) {
  const parent = neetcodeSections.find(section => section.theme === theme && section.tier === 'prioritized');
  const hardQuestions = dashboardQuestions.filter(question => question.theme === theme && question.difficulty === 'Hard');
  assert(hardQuestions.length > 0);
  for (const question of hardQuestions) {
    assert.notEqual(sectionForQuestion(question).relevance, parent.relevance, question.slug);
    assert.equal(questionRelevance(question).topicScore, parent.relevance, question.slug);
  }
}

const template = dashboardQuestions.find(question => question.theme === 'Arrays & Hashing');
assert(template);
const absent = {...template, slug: 'question-absent-from-company-sample'};
const fallback = questionRelevance(absent);
assert(fallback.score > 0);
assert.equal(fallback.companyCount, 0);
assert.equal(fallback.recentWeight, 0);
assert.equal(fallback.recentScore, null);
assert.equal(questionRelevance({...absent, kind: 'custom'}), null);
assert.equal(questionRelevance({...absent, theme: 'Other practice'}), null);

// More curated coverage cannot lower an otherwise identical question's score.
for (const question of dashboardQuestions) {
  const withoutGrind = questionRelevance({...question, grind75: false});
  const withGrind = questionRelevance({...question, grind75: true});
  assert(withGrind.score >= withoutGrind.score, `${question.slug}: curation monotonicity`);
}
assert(questionRelevance({...absent, grind75: true}).score > questionRelevance({...absent, grind75: false}).score);
assert(questionRelevance({...absent, grind75: false, neetcode150: true}).score >= questionRelevance({...absent, grind75: false, neetcode150: false}).score);

// Hold topic, curation and breadth constant while varying real source percentiles.
const byCompanyCount = new Map();
for (const [slug, evidence] of Object.entries(data.questions)) {
  if (slug === 'lru-cache' || evidence.companyCount === 0 || evidence.meanWithinCompanyPercentile === null) continue;
  const comparable = byCompanyCount.get(evidence.companyCount) ?? [];
  comparable.push({slug, percentile: evidence.meanWithinCompanyPercentile});
  byCompanyCount.set(evidence.companyCount, comparable);
}
let observedStrictIncrease = false;
for (const comparable of byCompanyCount.values()) {
  comparable.sort((a, b) => a.percentile - b.percentile);
  let previous;
  for (const item of comparable) {
    const score = questionRelevance({...template, slug: item.slug, grind75: false, neetcode150: true}).score;
    if (previous !== undefined) {
      assert(score >= previous, `${item.slug}: recent frequency monotonicity`);
      if (score > previous) observedStrictIncrease = true;
    }
    previous = score;
  }
}
assert(observedStrictIncrease, 'Recent evidence should have an observable effect on scores.');

// Check the delivered explanatory copy and evidence links, not just implementation comments.
const questionMarkup = renderToStaticMarkup(createElement(QuestionRelevanceLabel, {question: lru}));
const fallbackMarkup = renderToStaticMarkup(createElement(QuestionRelevanceLabel, {question: absent}));
const guideMarkup = renderToStaticMarkup(createElement(RelevanceGuide));
assert.match(questionMarkup, /not a percentage chance of being asked/);
assert.match(guideMarkup, /not probabilities/);
assert.match(guideMarkup, /community-reported/);
assert.match(guideMarkup, /Role, level, and location are unavailable/);
assert(guideMarkup.includes(relevanceMetadata.commitUrl));
assert.match(fallbackMarkup, /missing data does not mean the question is never asked/);
for (const company of questionRelevance(lru).companies) {
  const source = relevanceCompanies.find(candidate => candidate.name === company.name);
  assert(source?.sourceUrl, company.name);
  assert(questionMarkup.includes(source.sourceUrl), company.name);
}
assert.match(relevanceMetadata.sourceFrequencyMeaning, /not an interview probability/);
assert.match(relevanceMetadata.coverageMeaning, /neither a count of interview reports/);

console.log('Verified: 152 bounded question scores, 147 recent matches and 5 positive fallbacks, 25 unique company lists, sparse-evidence weighting, parent-topic hard baselines, LRU placement, monotonic inputs, and non-probability explanations with source links.');
