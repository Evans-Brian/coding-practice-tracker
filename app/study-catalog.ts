import source from './neetcode150-source.json' with {type: 'json'};
import {questions, buckets, isCurrentQuestion} from './questions';
import {type Progress} from './progress-state';

export type StudyCatalog = 'neetcode' | 'upstart' | 'all';
export type StudyQuestion = typeof questions[number] & {neetcode150?: boolean};

// Membership, titles, difficulty and within-topic order come from NeetCode's
// official neetcode-gh/leetcode .problemSiteData.json (retrieved Oct 13, 2026).
// Topic order follows the NeetCode 150 practice page.
export const neetcodeTopics = [
  'Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Stack',
  'Binary Search', 'Linked List', 'Trees', 'Heap / Priority Queue',
  'Backtracking', 'Tries', 'Graphs', 'Advanced Graphs',
  '1-D Dynamic Programming', '2-D Dynamic Programming', 'Greedy',
  'Intervals', 'Math & Geometry', 'Bit Manipulation',
];

export const neetcodeQuestions: StudyQuestion[] = source
  .map(entry => ({
    ...entry,
    grind75: questions.find(q => q.slug === entry.slug)?.grind75 ?? false,
    kind: 'leetcode' as const,
    bucket: neetcodeTopics.indexOf(entry.theme),
    upstartTagged: false,
    relevance: '',
    neetcode150: true,
  }))
  .sort((a, b) => a.bucket - b.bucket)
  .map((question, index) => ({...question, order: index + 1}));

const neetcodeSlugs = new Set(neetcodeQuestions.map(q => q.slug));
export const allowedQuestionSlugs = new Set([
  ...questions.map(q => q.slug), ...neetcodeSlugs,
]);

const allQuestions: StudyQuestion[] = [
  ...neetcodeQuestions,
  ...questions.filter(q => !neetcodeSlugs.has(q.slug)).map((q, index) => ({
    ...q, bucket: neetcodeTopics.length, order: neetcodeQuestions.length + index + 1,
  })),
];

export function studyQuestions(catalog: StudyCatalog): StudyQuestion[] {
  return catalog === 'neetcode' ? neetcodeQuestions : catalog === 'upstart' ? questions : allQuestions;
}

export function studyGroups(catalog: StudyCatalog) {
  if (catalog === 'upstart') return buckets;
  const topics = neetcodeTopics.map(title => ({title, description: ''}));
  return catalog === 'neetcode' ? topics : [...topics, {
    title: 'Upstart & other practice',
    description: 'Your additional company preparation, custom drills, and completed questions outside NeetCode 150.',
  }];
}

export function eligibleQuestions(catalog: StudyCatalog, data: Record<string, Progress> | null) {
  return studyQuestions(catalog).filter(q => q.neetcode150 || isCurrentQuestion(q.slug)
    || data?.[q.slug]?.retained || data?.[q.slug]?.submitted || (data?.[q.slug]?.completions ?? 0) > 0);
}
