export const leetcodeHistorySourceUrl='https://leetcode.com/progress/';
export type LeetcodeHistoryEntry={questionId:string;name:string;difficulty:'Easy'|'Medium'|'Hard';completedDay:string};
export type LeetcodeHistoryCoverage={firstDay:string;lastDay:string;reviewedProblems:number;expectedProblems:number;complete:boolean};
export type LeetcodeHistoryInput={entries:LeetcodeHistoryEntry[];coverage:LeetcodeHistoryCoverage};

function validDay(value:unknown,today:string):value is string {
  if(typeof value!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(value)||value>today)return false;
  const date=new Date(value+'T12:00:00Z');
  return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;
}
function object(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value);}

// Imports contain accepted problem-days, rather than invented submission times.
// A repeated import of the same problem and displayed calendar day is the same record.
export function parseLeetcodeHistory(value:unknown,today:string):LeetcodeHistoryInput|null {
  if(!object(value)||!Array.isArray(value.entries)||value.entries.length>250||!object(value.coverage))return null;
  const coverage=value.coverage;
  if(!validDay(coverage.firstDay,today)||!validDay(coverage.lastDay,today)||coverage.firstDay>coverage.lastDay
    ||!Number.isSafeInteger(coverage.reviewedProblems)||!Number.isSafeInteger(coverage.expectedProblems)
    ||(coverage.reviewedProblems as number)<0||(coverage.expectedProblems as number)<1
    ||(coverage.expectedProblems as number)>100000||(coverage.reviewedProblems as number)>(coverage.expectedProblems as number)
    ||typeof coverage.complete!=='boolean'||(coverage.complete&&coverage.reviewedProblems!==coverage.expectedProblems))return null;
  const entries:LeetcodeHistoryEntry[]=[],seen=new Map<string,LeetcodeHistoryEntry>();
  for(const row of value.entries){
    if(!object(row)||typeof row.questionId!=='string'||row.questionId.length>200||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.questionId)
      ||typeof row.name!=='string'||!row.name.trim()||row.name.trim().length>300
      ||(row.difficulty!=='Easy'&&row.difficulty!=='Medium'&&row.difficulty!=='Hard')
      ||!validDay(row.completedDay,today)||row.completedDay<coverage.firstDay||row.completedDay>coverage.lastDay
      ||('status' in row&&row.status!=='Accepted'))return null;
    const entry={questionId:row.questionId,name:row.name.trim(),difficulty:row.difficulty as LeetcodeHistoryEntry['difficulty'],completedDay:row.completedDay};
    const key=entry.questionId+'\0'+entry.completedDay,previous=seen.get(key);
    if(previous&&(previous.name!==entry.name||previous.difficulty!==entry.difficulty))return null;
    if(!previous){seen.set(key,entry);entries.push(entry);}
  }
  return {entries,coverage:coverage as LeetcodeHistoryCoverage};
}
