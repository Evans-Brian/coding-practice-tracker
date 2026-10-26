import type {StudyQuestion} from './study-catalog';

export type StudyTier = 'prioritized' | 'medium' | 'not-prioritized';

export const studyTiers = [
  {id: 'prioritized', title: 'Prioritized', description: 'Build fluency in these core topics first.'},
  {id: 'medium', title: 'Medium Priority', description: 'Add these after the core patterns are comfortable.'},
  {id: 'not-prioritized', title: 'Not Prioritized', description: 'Later practice after the higher-priority topics are solid.'},
] as const satisfies readonly {id: StudyTier; title: string; description: string}[];

export type NeetcodeSection = {
  id: string;
  title: string;
  theme: string;
  tier: StudyTier;
  relevance: number;
  matches: (question: StudyQuestion) => boolean;
};

function section(
  id: string,
  theme: string,
  tier: StudyTier,
  relevance: number,
  options: {title?: string; matches?: NeetcodeSection['matches']} = {},
): NeetcodeSection {
  return {
    id,
    title: options.title ?? theme,
    theme,
    tier,
    relevance,
    matches: options.matches ?? (question => question.theme === theme),
  };
}

// Section relevance is an interview-preparation judgment, not an observed
// percentage of interviews. Display order is independent of catalog buckets,
// so question IDs, saved progress and the official NeetCode membership stay stable.
export const neetcodeSections: readonly NeetcodeSection[] = [
  section('bucket-0', 'Arrays & Hashing', 'prioritized', 95),
  section('bucket-1', 'Two Pointers', 'prioritized', 90),
  section('bucket-2', 'Sliding Window', 'prioritized', 90),
  section('bucket-3', 'Stack', 'prioritized', 85),
  section('bucket-4', 'Binary Search', 'prioritized', 90),
  section('bucket-6', 'Trees', 'prioritized', 95, {
    matches: question => question.theme === 'Trees' && question.difficulty !== 'Hard',
  }),
  section('bucket-10', 'Graphs', 'prioritized', 94),
  section('bucket-7', 'Heap / Priority Queue', 'prioritized', 89),
  section('bucket-15', 'Intervals', 'prioritized', 88),
  section('bucket-12', '1-D Dynamic Programming', 'prioritized', 78),
  section('bucket-14', 'Greedy', 'prioritized', 77),
  section('bucket-5', 'Linked List', 'prioritized', 75, {
    matches: question => question.theme === 'Linked List'
      && question.difficulty !== 'Hard' && question.slug !== 'lru-cache',
  }),
  section('bucket-8', 'Backtracking', 'prioritized', 72),

  // LRU Cache is intentionally first in this tier at the user's request.
  section('bucket-5-lru-cache', 'Linked List', 'medium', 90, {
    title: 'LRU Cache',
    matches: question => question.slug === 'lru-cache',
  }),
  section('bucket-13', '2-D Dynamic Programming', 'medium', 59),
  section('bucket-6-medium-priority', 'Trees', 'medium', 54, {
    title: 'Trees · Hard',
    matches: question => question.theme === 'Trees' && question.difficulty === 'Hard',
  }),
  section('bucket-11', 'Advanced Graphs', 'medium', 52),

  section('bucket-16', 'Math & Geometry', 'not-prioritized', 49),
  section('bucket-9', 'Tries', 'not-prioritized', 40),
  section('bucket-17', 'Bit Manipulation', 'not-prioritized', 35),
  section('bucket-5-not-prioritized', 'Linked List', 'not-prioritized', 30, {
    title: 'Linked List · Hard',
    matches: question => question.theme === 'Linked List' && question.difficulty === 'Hard',
  }),
];

export function sectionForQuestion(question: StudyQuestion): NeetcodeSection | undefined {
  return neetcodeSections.find(candidate => candidate.matches(question));
}

export function classifyQuestionTier(question: StudyQuestion): StudyTier | undefined {
  return sectionForQuestion(question)?.tier;
}

export type PracticePage='main'|'not-prioritized';
export function sectionsForPracticePage(page:PracticePage):readonly NeetcodeSection[]{
  return neetcodeSections.filter(section=>page==='not-prioritized'?section.tier==='not-prioritized':section.tier!=='not-prioritized');
}
