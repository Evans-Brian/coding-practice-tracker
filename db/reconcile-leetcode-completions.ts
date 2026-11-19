import type {RecentCompletionEntry,RecentCompletionInput} from '../app/recent-completion-input';

export const leetcodeReconcilePrefix='leetcode-reconcile:';
export function reconciliationId(entry:Pick<RecentCompletionEntry,'questionId'|'completedDay'>){
  return leetcodeReconcilePrefix+entry.questionId+':'+entry.completedDay;
}
type Blocker={submissionId:string;completedDay:string};
type SkippedCompletion=RecentCompletionEntry&{reason:'already-reconciled'|'nearby-tracker-completion';matchedDay:string};

function blockerStatement(db:D1Database,entry:RecentCompletionEntry){
  const id=reconciliationId(entry);
  return db.prepare(`SELECT submission_id AS submissionId,completed_day AS completedDay FROM completion_events
    WHERE question_id=? AND (submission_id=? OR
      (submission_id NOT LIKE 'leetcode-reconcile:%' AND completed_day BETWEEN date(?,'-1 day') AND date(?,'+1 day')))
    ORDER BY CASE WHEN submission_id=? THEN 0 ELSE 1 END,completed_day LIMIT 1`)
    .bind(entry.questionId,id,entry.completedDay,entry.completedDay,id);
}
function skipped(entry:RecentCompletionEntry,blocker:Blocker):SkippedCompletion{
  return {...entry,reason:blocker.submissionId===reconciliationId(entry)?'already-reconciled':'nearby-tracker-completion',matchedDay:blocker.completedDay};
}

// A source problem-day is one historical completion. Reconciliation events do
// not suppress legitimate source repeats on adjacent days; only manual tracker
// events participate in the user's +/- one-day matching tolerance.
export async function reconcileLeetcodeCompletions(db:D1Database,input:RecentCompletionInput){
  const added:RecentCompletionEntry[]=[],wouldAdd:RecentCompletionEntry[]=[],skippedEntries:SkippedCompletion[]=[];
  if(input.dryRun){
    for(let offset=0;offset<input.entries.length;offset+=100){
      const entries=input.entries.slice(offset,offset+100);
      const results=await db.batch(entries.map(entry=>blockerStatement(db,entry)));
      for(const [index,entry] of entries.entries()){
        const blocker=results[index].results[0] as Blocker|undefined;
        if(blocker)skippedEntries.push(skipped(entry,blocker));else wouldAdd.push(entry);
      }
    }
  }else{
    // Keep every event/progress pair in the same atomic D1 batch. The INSERT's
    // authoritative guard also catches a manual completion added after dry-run.
    // A partial request can safely be replayed if a later bounded batch fails.
    for(let offset=0;offset<input.entries.length;offset+=50){
      const entries=input.entries.slice(offset,offset+50);
      const statements=entries.flatMap(entry=>{
        const id=reconciliationId(entry);
        return [
          db.prepare(`INSERT INTO completion_events
            (submission_id,question_id,difficulty,point_units,completed_at,completed_day)
            SELECT ?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM completion_events WHERE submission_id=?)
              AND NOT EXISTS (SELECT 1 FROM completion_events WHERE question_id=?
                AND submission_id NOT LIKE 'leetcode-reconcile:%'
                AND completed_day BETWEEN date(?,'-1 day') AND date(?,'+1 day'))
            ON CONFLICT(submission_id) DO NOTHING`)
            .bind(id,entry.questionId,entry.difficulty,entry.pointUnits,entry.completedAt,entry.completedDay,
              id,entry.questionId,entry.completedDay,entry.completedDay),
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
