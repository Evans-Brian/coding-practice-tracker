import source from './common-practice-candidates-data.json' with {type:'json'};

export type CommonPracticeCandidate={
  frontendId:number;
  slug:string;
  name:string;
  difficulty:'Easy'|'Medium'|'Hard';
  neetcode150:boolean;
  blind75:boolean;
  premium:boolean;
};

// A broad public interview-practice catalog, not this user's personal queue.
// The selected 50 IDs and all solve history are kept in private D1 storage.
export const commonPracticeCandidates=source.questions as CommonPracticeCandidate[];
export const commonPracticeCandidateSlugs:ReadonlySet<string>=new Set(commonPracticeCandidates.map(question=>question.slug));
export const commonPracticeSources=source.sources;
