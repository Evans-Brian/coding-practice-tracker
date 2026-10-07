import catalog from './variation-catalog.json';
import {reportedVariations} from '../reported-variations';
import {reportedPractice} from '../reported-practice';

export type PracticeCase={id:string;name:string;args:unknown[];expected:unknown;sample:boolean};
const reportedQuestions=[...reportedVariations,...reportedPractice];
for(const question of reportedQuestions.filter(q=>q.kind==='custom'&&q.slug!=='upstart-anagram-sentence')){
 if(!question.exercisePath||!catalog.some(entry=>entry.problemId===question.slug))throw new Error('Missing runnable reported task: '+question.slug);
}
export const variationExercises=catalog.map(entry=>{
 const question=reportedQuestions.find(q=>q.slug===entry.problemId);
 if(!question?.practicePrompt||!question.source)throw new Error('Missing variation prompt: '+entry.problemId);
 return {...entry,examples:entry.examples as PracticeCase[],question};
});
export type VariationExerciseDefinition=typeof variationExercises[number];
