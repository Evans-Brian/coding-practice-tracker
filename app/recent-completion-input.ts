export type RecentCompletionEntry={
  questionId:string;
  completedAt:string;
  completedDay:string;
  submissionId?:number;
  difficulty:'Easy'|'Medium'|'Hard';
  pointUnits:number;
};
export type RecentCompletionInput={
  entries:RecentCompletionEntry[];
  dryRun:boolean;
  receivedEntries:number;
  duplicateEntries:number;
  firstDay:string;
  lastDay:string;
};
type CatalogQuestion={slug:string;difficulty:string;kind?:string};

function object(value:unknown):value is Record<string,unknown>{
  return typeof value==='object'&&value!==null&&!Array.isArray(value);
}
function validDay(value:unknown):value is string{
  if(typeof value!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(value+'T12:00:00Z');
  return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;
}

// The caller supplies the same New York calendar conversion and canonical
// difficulty units used by the existing completion endpoint. Source dates and
// scores are never taken from a client's pointUnits field. Date-only evidence
// retains its precision instead of inventing an accepted-submission timestamp.
export function parseRecentCompletions(
  value:unknown,
  questions:readonly CatalogQuestion[],
  now:Date,
  dayForDate:(date:Date)=>string,
  unitsByDifficulty:Record<string,number>,
):RecentCompletionInput|null{
  if(!object(value)||!Array.isArray(value.entries)||value.entries.length>250
    ||('dryRun' in value&&typeof value.dryRun!=='boolean'))return null;
  const lastDay=dayForDate(now),first=new Date(lastDay+'T12:00:00Z');
  first.setUTCDate(first.getUTCDate()-6);
  const firstDay=first.toISOString().slice(0,10),catalog=new Map(questions.map(question=>[question.slug,question]));
  const byProblemDay=new Map<string,RecentCompletionEntry>(),sourceIds=new Map<number,string>();
  for(const row of value.entries){
    if(!object(row)||typeof row.questionId!=='string'||row.questionId.length>200
      ||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.questionId)
      ||row.status!=='Accepted')return null;
    for(const field of ['submissionId','sourceSubmissionId']){
      if(field in row&&(!Number.isSafeInteger(row[field])||(row[field] as number)<=0))return null;
    }
    if('submissionId' in row&&'sourceSubmissionId' in row&&row.submissionId!==row.sourceSubmissionId)return null;
    const question=catalog.get(row.questionId);
    if(!question||question.kind==='custom'||(question.difficulty!=='Easy'&&question.difficulty!=='Medium'&&question.difficulty!=='Hard'))return null;
    let completedDay:string,completedAt:string;
    if(typeof row.completedAt==='string'&&/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(row.completedAt)){
      const date=new Date(row.completedAt);
      if(Number.isNaN(date.getTime())||date.toISOString()!==row.completedAt||date.getTime()>now.getTime())return null;
      completedDay=dayForDate(date);completedAt=row.completedAt;
      if('completedDay' in row&&row.completedDay!==completedDay)return null;
    }else{
      if(!validDay(row.completedDay)||('completedAt' in row&&row.completedAt!==row.completedDay))return null;
      completedDay=row.completedDay;completedAt=completedDay;
    }
    const pointUnits=unitsByDifficulty[question.difficulty];
    if(completedDay<firstDay||completedDay>lastDay||!Number.isSafeInteger(pointUnits)||pointUnits<=0)return null;
    const submissionId=(row.submissionId??row.sourceSubmissionId) as number|undefined,identity=row.questionId+'\0'+completedAt;
    if(submissionId!==undefined){
      if(sourceIds.has(submissionId)&&sourceIds.get(submissionId)!==identity)return null;
      sourceIds.set(submissionId,identity);
    }
    const entry:RecentCompletionEntry={questionId:row.questionId,completedAt,completedDay,...(submissionId===undefined?{}:{submissionId}),difficulty:question.difficulty,pointUnits};
    const key=row.questionId+'\0'+completedDay,previous=byProblemDay.get(key);
    // Prefer an actual timestamp over date-only evidence for the same day;
    // among records with equal precision keep the earliest known acceptance.
    const timed=completedAt.includes('T'),previousTimed=previous?.completedAt.includes('T');
    if(!previous||timed&&!previousTimed||timed===previousTimed&&(entry.completedAt<previous.completedAt
      ||entry.completedAt===previous.completedAt&&(entry.submissionId??Infinity)<(previous.submissionId??Infinity)))byProblemDay.set(key,entry);
  }
  const entries=[...byProblemDay.values()].sort((a,b)=>a.completedAt.localeCompare(b.completedAt)||a.questionId.localeCompare(b.questionId));
  return {entries,dryRun:value.dryRun===true,receivedEntries:value.entries.length,duplicateEntries:value.entries.length-entries.length,firstDay,lastDay};
}
