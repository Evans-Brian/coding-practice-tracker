import snapshot from './google-last-month-data.json' with {type:'json'};
import {studyQuestions,type StudyQuestion} from './study-catalog';
import type {GoogleTop50Entry} from './google-top50';

export type GoogleLastMonthSnapshot={company:string;period:string;retrievedOn:string;sourceUrl:string;frequencyMeaning:string;totalQuestions:number;complete:boolean;questions:GoogleTop50Entry[]};
export const googleLastMonthSnapshot=snapshot as GoogleLastMonthSnapshot;
const catalog=new Map(studyQuestions('all').map(question=>[question.slug,question]));

// Only the page's display rank changes. Every source retains its canonical slug
// so notes, Repeat/Done, completion counts, and points remain shared.
export const googleLastMonthQuestions:StudyQuestion[]=googleLastMonthSnapshot.questions.map(entry=>{
  const question=catalog.get(entry.slug);
  if(!question)throw Error('Google 30-day question missing from study catalog: '+entry.slug);
  return {...question,order:entry.rank};
});
