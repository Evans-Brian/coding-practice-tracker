import type {RecentCompletionEntry,RecentCompletionInput} from '../app/recent-completion-input';

export const leetcodeReconcilePrefix='leetcode-reconcile:';
export function reconciliationId(entry:Pick<RecentCompletionEntry,'questionId'|'completedDay'>){
  return leetcodeReconcilePrefix+entry.questionId+':'+entry.completedDay;
}
type Blocker={submissionId:string|null;completedDay:string;source:'event'|'history'};
type SkippedCompletion=RecentCompletionEntry&{reason:'already-reconciled'|'same-or-previous-day-completion';matchedDay:string;matchedSource:'tracker'|'reconciliation'|'leetcode-history'};

function blockerStatement(db:D1Database,entry:RecentCompletionEntry){
  const id=reconciliationId(entry);
  return db.prepare(`SELECT submissionId,completedDay,source FROM (
      SELECT submission_id AS submissionId,completed_day AS completedDay,'event' AS source FROM completion_events
        WHERE question_id=? AND completed_day BETWEEN date(?,'-1 day') AND ?
      UNION ALL
      SELECT NULL AS submissionId,completed_day AS completedDay,'history' AS source FROM leetcode_daily_completions
        WHERE question_id=? AND completed_day BETWEEN date(?,'-1 day') AND ?
    ) ORDER BY CASE WHEN submissionId=? THEN 0 ELSE 1 END,completedDay DESC,source LIMIT 1`)
    .bind(entry.questionId,entry.completedDay,entry.completedDay,entry.questionId,entry.completedDay,entry.completedDay,id);
}
function skipped(entry:RecentCompletionEntry,blocker:Blocker):SkippedCompletion{
  return {...entry,reason:blocker.submissionId===reconciliationId(entry)?'already-reconciled':'same-or-previous-day-completion',matchedDay:blocker.completedDay,
    matchedSource:blocker.source==='history'?'leetcode-history':blocker.submissionId?.startsWith(leetcodeReconcilePrefix)?'reconciliation':'tracker'};
}
function previousDay(day:string){const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-1);return date.toISOString().slice(0,10);}
function preferBlocker(entry:RecentCompletionEntry,a:Blocker|undefined,b:Blocker|undefined){
  if(!a)return b;if(!b)return a;
  const id=reconciliationId(entry);
  if(a.submissionId===id)return a;if(b.submissionId===id)return b;
  return a.completedDay>b.completedDay?a:b;
}

// Import only missing work: any recorded completion on the same or previous
// New York day blocks another credit, whether manual, reconciled, or imported.
// Process oldest calendar days first so incoming adjacent dates follow the
// same rule and dry-run can simulate the writes without changing storage.
export async function reconcileLeetcodeCompletions(db:D1Database,input:RecentCompletionInput){
  const added:RecentCompletionEntry[]=[],wouldAdd:RecentCompletionEntry[]=[],skippedEntries:SkippedCompletion[]=[];
  const orderedEntries=[...input.entries].sort((a,b)=>a.completedDay.localeCompare(b.completedDay)||a.completedAt.localeCompare(b.completedAt)||a.questionId.localeCompare(b.questionId));
  if(input.dryRun){
    const planned=new Map<string,Blocker>();
    for(let offset=0;offset<orderedEntries.length;offset+=100){
      const entries=orderedEntries.slice(offset,offset+100);
      const results=await db.batch(entries.map(entry=>blockerStatement(db,entry)));
      for(const [index,entry] of entries.entries()){
        const existing=results[index].results[0] as Blocker|undefined;
        const simulated=planned.get(entry.questionId+'\0'+entry.completedDay)??planned.get(entry.questionId+'\0'+previousDay(entry.completedDay));
        const blocker=preferBlocker(entry,existing,simulated);
        if(blocker)skippedEntries.push(skipped(entry,blocker));else{
          wouldAdd.push(entry);
          planned.set(entry.questionId+'\0'+entry.completedDay,{submissionId:reconciliationId(entry),completedDay:entry.completedDay,source:'event'});
        }
      }
    }
  }else{
    // Keep every event/progress pair in the same atomic D1 batch. The INSERT's
    // authoritative guard also catches a completion added after dry-run.
    // A partial request can safely be replayed if a later bounded batch fails.
    for(let offset=0;offset<orderedEntries.length;offset+=50){
      const entries=orderedEntries.slice(offset,offset+50);
      const statements=entries.flatMap(entry=>{
        const id=reconciliationId(entry);
        return [
          db.prepare(`INSERT INTO completion_events
            (submission_id,question_id,difficulty,point_units,completed_at,completed_day)
            SELECT ?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM completion_events WHERE submission_id=?)
              AND NOT EXISTS (SELECT 1 FROM completion_events WHERE question_id=?
                AND completed_day BETWEEN date(?,'-1 day') AND ?)
              AND NOT EXISTS (SELECT 1 FROM leetcode_daily_completions WHERE question_id=?
                AND completed_day BETWEEN date(?,'-1 day') AND ?)
            ON CONFLICT(submission_id) DO NOTHING`)
            .bind(id,entry.questionId,entry.difficulty,entry.pointUnits,entry.completedAt,entry.completedDay,
              id,entry.questionId,entry.completedDay,entry.completedDay,entry.questionId,entry.completedDay,entry.completedDay),
          db.prepare(`INSERT INTO progress (id,notes,completions,tries,repeat,submitted,retained,last_submission)
            SELECT ?,'',1,NULL,0,1,1,? WHERE changes()=1
            ON CONFLICT(id) DO UPDATE SET completions=progress.completions+1,submitted=1,retained=1`)
            .bind(entry.questionId,id),
        ];
      });
      const results=await db.batch(statements);
      const blocked:RecentCompletionEntry[]=[];
      for(const [index,entry] of entries.entries()){
        if(Number(results[index*2].meta?.changes??0)===1)added.push(entry);else blocked.push(entry);
      }
      if(blocked.length){
        const blockers=await db.batch(blocked.map(entry=>blockerStatement(db,entry)));
        for(const [index,entry] of blocked.entries()){
          const blocker=blockers[index].results[0] as Blocker|undefined;
          if(!blocker)throw Error('Reconciliation was skipped without a matching completion.');
          skippedEntries.push(skipped(entry,blocker));
        }
      }
    }
  }
  return {dryRun:input.dryRun,window:{firstDay:input.firstDay,lastDay:input.lastDay},
    reviewed:input.receivedEntries,uniqueProblemDays:input.entries.length,duplicates:input.duplicateEntries,
    added,wouldAdd,skipped:skippedEntries};
}
