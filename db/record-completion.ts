type Attempt={id:string;notes:string;tries:number|null;repeat:boolean;submissionId:string};
type Score={difficulty:string;pointUnits:number;completedAt:string;completedDay:string};

export async function recordCompletion(db:D1Database,attempt:Attempt,score:Score) {
  // Both writes commit together. changes() only records an event when the
  // preceding upsert accepted a new attempt; retries never earn points twice.
  await db.batch([
    db.prepare(`INSERT INTO progress (id,notes,completions,tries,repeat,submitted,retained,last_submission)
      SELECT ?,?,1,?,?,1,1,?
      WHERE NOT EXISTS (SELECT 1 FROM completion_events WHERE submission_id=?)
      ON CONFLICT(id) DO UPDATE SET notes=excluded.notes,completions=progress.completions+1,
        tries=excluded.tries,repeat=excluded.repeat,submitted=1,retained=1,last_submission=excluded.last_submission
      WHERE progress.last_submission IS NULL OR progress.last_submission!=excluded.last_submission`)
      .bind(attempt.id,attempt.notes,attempt.tries,attempt.repeat?1:0,attempt.submissionId,attempt.submissionId),
    db.prepare(`INSERT INTO completion_events (submission_id,question_id,difficulty,point_units,completed_at,completed_day)
      SELECT ?,?,?,?,?,? WHERE changes()=1`)
      .bind(attempt.submissionId,attempt.id,score.difficulty,score.pointUnits,score.completedAt,score.completedDay),
  ]);
}
