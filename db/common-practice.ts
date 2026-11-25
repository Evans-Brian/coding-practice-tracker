import type {CommonPracticeQueue} from '../app/common-practice-input';

const queueId='common-50';
const sameOrder=(a:readonly string[],b:readonly string[])=>a.length===b.length&&a.every((id,index)=>id===b[index]);
type QueueResult={status:'created'|'existing'|'conflict'|'ineligible';queue:CommonPracticeQueue;completedQuestionIds?:string[]};

export async function readCommonPracticeQueue(db:D1Database):Promise<CommonPracticeQueue>{
  const [header,entries,solved]=await db.batch([
    db.prepare('SELECT created_at AS createdAt FROM common_practice_queue WHERE id=?').bind(queueId),
    db.prepare('SELECT question_id AS questionId FROM common_practice_entries WHERE queue_id=? ORDER BY position').bind(queueId),
    db.prepare(`SELECT id AS questionId FROM progress WHERE completions>0 OR submitted!=0
      UNION SELECT question_id AS questionId FROM completion_events
      UNION SELECT question_id AS questionId FROM leetcode_daily_completions
      ORDER BY questionId`),
  ]);
  const createdAt=(header.results[0] as {createdAt:string}|undefined)?.createdAt??null;
  const questionIds=(entries.results as {questionId:string}[]).map(row=>row.questionId);
  if(createdAt!==null&&questionIds.length!==50||createdAt===null&&questionIds.length!==0)throw Error('Common practice queue membership is incomplete.');
  return {questionIds,solvedSlugs:(solved.results as {questionId:string}[]).map(row=>row.questionId),createdAt};
}

// Header and all 50 private membership rows are created in one transaction. A
// racing completion is checked inside that transaction, while a racing seed
// cannot replace or append to the fixed membership chosen by the first seed.
export async function seedCommonPracticeQueue(db:D1Database,questionIds:readonly string[],createdAt:string):Promise<QueueResult>{
  if(questionIds.length!==50||new Set(questionIds).size!==50)throw Error('A common practice queue requires exactly 50 distinct questions.');
  const existing=await readCommonPracticeQueue(db);
  if(existing.createdAt!==null)return {status:sameOrder(existing.questionIds,questionIds)?'existing':'conflict',queue:existing};
  const candidates=questionIds.map(()=>'(?)').join(','),ordered=questionIds.map((_,index)=>'('+String(index+1)+',?)').join(',');
  const [header]=await db.batch([
    db.prepare(`WITH candidates(question_id) AS (VALUES ${candidates})
      INSERT INTO common_practice_queue (id,created_at)
      SELECT ?,? WHERE NOT EXISTS (SELECT 1 FROM common_practice_queue WHERE id=?)
        AND NOT EXISTS (SELECT 1 FROM candidates AS candidate WHERE
          EXISTS (SELECT 1 FROM progress WHERE id=candidate.question_id AND (completions>0 OR submitted!=0))
          OR EXISTS (SELECT 1 FROM completion_events WHERE question_id=candidate.question_id)
          OR EXISTS (SELECT 1 FROM leetcode_daily_completions WHERE question_id=candidate.question_id))`)
      .bind(...questionIds,queueId,createdAt,queueId),
    // changes() refers to the preceding header INSERT for the whole statement;
    // all 50 rows are inserted together only when this request created it.
    db.prepare(`WITH candidates(position,question_id) AS (VALUES ${ordered})
      INSERT INTO common_practice_entries (queue_id,position,question_id)
      SELECT ?,position,question_id FROM candidates WHERE changes()=1`)
      .bind(...questionIds,queueId),
  ]);
  const queue=await readCommonPracticeQueue(db);
  if(Number(header.meta?.changes??0)===1){
    if(!sameOrder(queue.questionIds,questionIds))throw Error('The common practice queue was not saved in its requested order.');
    return {status:'created',queue};
  }
  if(queue.createdAt!==null)return {status:sameOrder(queue.questionIds,questionIds)?'existing':'conflict',queue};
  const solved=new Set(queue.solvedSlugs);
  return {status:'ineligible',queue,completedQuestionIds:questionIds.filter(id=>solved.has(id))};
}
