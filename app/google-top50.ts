import snapshot from './google-top50-data.json' with {type:'json'};
import {studyQuestions,type StudyQuestion} from './study-catalog';

export type GoogleTop50Entry={rank:number;leetcodeId:number;slug:string;name:string;difficulty:'Easy'|'Medium'|'Hard';frequency:number};
export type GoogleTop50Snapshot={company:string;period:string;retrievedOn:string;sourceUrl:string;frequencyMeaning:string;questions:GoogleTop50Entry[]};

export const googleTop50Snapshot=snapshot as GoogleTop50Snapshot;
const catalog=new Map(studyQuestions('all').map(question=>[question.slug,question]));

// Rank is presentation order on this page. Progress uses the same canonical slug
// and catalog definition that the completion API, Repeat, Done, and points use.
export const googleTop50Questions:StudyQuestion[]=googleTop50Snapshot.questions.map(entry=>{
  const question=catalog.get(entry.slug);
  if(!question)throw Error('Google question missing from study catalog: '+entry.slug);
  return {...question,order:entry.rank};
});
