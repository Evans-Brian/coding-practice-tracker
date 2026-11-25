export type CommonPracticeQueue={questionIds:string[];solvedSlugs:string[];createdAt:string|null};
type CommonPracticeQuestion={slug:string;difficulty:string;kind?:string};

// This is an explicit owner action. GET never constructs a personal queue or
// writes its selected membership into browser bundles or repository datasets.
export function parseCommonPracticeSeed(value:unknown):string[]|null{
  if(typeof value!=='object'||value===null||Array.isArray(value)||!('questionIds' in value)
    ||!Array.isArray(value.questionIds)||value.questionIds.length!==50)return null;
  const ids=value.questionIds;
  if(ids.some(id=>typeof id!=='string'||id.length>200||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
    ||new Set(ids).size!==50)return null;
  return [...ids] as string[];
}

export function validCommonPracticeCandidates(
  questionIds:readonly string[],
  candidateSlugs:ReadonlySet<string>,
  questions:readonly CommonPracticeQuestion[],
){
  const catalog=new Map(questions.map(question=>[question.slug,question])),difficulties=new Set<string>();
  if(questionIds.length!==50||new Set(questionIds).size!==50)return false;
  for(const id of questionIds){
    const question=catalog.get(id);
    if(!candidateSlugs.has(id)||!question||question.kind!=='leetcode'
      ||!['Easy','Medium','Hard'].includes(question.difficulty))return false;
    difficulties.add(question.difficulty);
  }
  return ['Easy','Medium','Hard'].every(difficulty=>difficulties.has(difficulty));
}
