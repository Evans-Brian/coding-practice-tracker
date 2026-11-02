import source from './neetcode150-source.json' with {type: 'json'};
import {questions, isCurrentQuestion} from './questions';
import {type Progress} from './progress-state';
import {retiredPracticeSlugs} from './practice-exclusions';

export type StudyCatalog = 'neetcode' | 'all';
export type StudyQuestion = typeof questions[number] & {neetcode150?: boolean;dashboardExtra?: boolean};

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
    neetcode150: true,
  }))
  .sort((a, b) => a.bucket - b.bucket)
  .map((question, index) => ({...question, order: index + 1}));

export const extraPracticeQuestions: StudyQuestion[] = [
  {name:'Find First and Last Position of Element in Sorted Array',slug:'find-first-and-last-position-of-element-in-sorted-array',difficulty:'Medium' as const,theme:'Binary Search'},
  {name:'Find Peak Element',slug:'find-peak-element',difficulty:'Medium' as const,theme:'Binary Search'},
  // Highest-frequency new matches in Google's three-month Greedy list, checked Nov 2, 2026.
  // Existing tracker questions were skipped; these appeared at ranks 2, 5, and 6.
  {name:'Split Array Largest Sum',slug:'split-array-largest-sum',difficulty:'Hard' as const,theme:'Greedy'},
  {name:'Minimum Sum of Squared Difference',slug:'minimum-sum-of-squared-difference',difficulty:'Medium' as const,theme:'Greedy'},
  {name:'Largest Number',slug:'largest-number',difficulty:'Medium' as const,theme:'Greedy'},
].map((question,index)=>({
  ...question,
  kind:'leetcode' as const,grind75:false,
  bucket:neetcodeTopics.indexOf(question.theme),order:neetcodeQuestions.length+index+1,
  dashboardExtra:true,
}));

export const dashboardQuestions:StudyQuestion[]=[...neetcodeQuestions,...extraPracticeQuestions]
  .sort((a,b)=>a.bucket-b.bucket);
const dashboardSlugs = new Set(dashboardQuestions.map(q => q.slug));
export const allowedQuestionSlugs = new Set([
  ...questions.map(q => q.slug), ...dashboardSlugs,
]);

const allQuestions: StudyQuestion[] = [
  ...dashboardQuestions.map(q=>retiredPracticeSlugs.has(q.slug)?{...q,bucket:neetcodeTopics.length}:q),
  ...questions.filter(q => !dashboardSlugs.has(q.slug)).map((q, index) => ({
    ...q, bucket: neetcodeTopics.length, order: dashboardQuestions.length + index + 1,
  })),
];

export function studyQuestions(catalog: StudyCatalog): StudyQuestion[] {
  return catalog === 'neetcode' ? dashboardQuestions : allQuestions;
}

export function studyGroups(catalog: StudyCatalog) {
  const topics = neetcodeTopics.map(title => ({title, description: ''}));
  return catalog === 'neetcode' ? topics : [...topics, {
    title: 'Other practice',
    description: 'Your custom drills and completed questions outside your active practice list.',
  }];
}

export function eligibleQuestions(catalog: StudyCatalog, data: Record<string, Progress> | null) {
  return studyQuestions(catalog).filter(q => q.neetcode150 || q.dashboardExtra || isCurrentQuestion(q.slug)
    || data?.[q.slug]?.retained || data?.[q.slug]?.submitted || (data?.[q.slug]?.completions ?? 0) > 0);
}
