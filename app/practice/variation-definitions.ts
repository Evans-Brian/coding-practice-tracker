import catalog from './variation-catalog.json';
import {reportedVariations} from '../reported-variations';

export type PracticeCase={id:string;name:string;args:unknown[];expected:unknown;sample:boolean};
export const variationExercises=catalog.map(entry=>{
 const question=reportedVariations.find(q=>q.slug===entry.problemId);
 if(!question?.practicePrompt||!question.source)throw new Error('Missing variation prompt: '+entry.problemId);
 return {...entry,examples:entry.examples as PracticeCase[],question};
});
export type VariationExerciseDefinition=typeof variationExercises[number];
