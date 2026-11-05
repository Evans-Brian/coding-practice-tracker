type HistoryEntry={questionId:string;name:string;difficulty:string;completedDay:string};
type HistoryImport={entries:HistoryEntry[];coverage:{firstDay:string;lastDay:string;reviewedProblems:number;expectedProblems:number;complete:boolean}};

export async function recordLeetcodeHistory(db:D1Database,input:HistoryImport,importedAt:string,sourceUrl:string,pointUnitsByDifficulty:Record<string,number>){
  const statements=input.entries.map(entry=>db.prepare(`INSERT INTO leetcode_daily_completions
    (question_id,completed_day,name,difficulty,point_units,imported_at) VALUES (?,?,?,?,?,?)
    ON CONFLICT(question_id,completed_day) DO UPDATE SET name=excluded.name,difficulty=excluded.difficulty,
      point_units=excluded.point_units,imported_at=excluded.imported_at`)
    .bind(entry.questionId,entry.completedDay,entry.name,entry.difficulty,pointUnitsByDifficulty[entry.difficulty],importedAt));
  const coverage=input.coverage;
  statements.push(db.prepare(`INSERT INTO leetcode_history_import
    (id,first_day,last_day,reviewed_problems,expected_problems,complete,imported_at,source_url) VALUES ('leetcode',?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET first_day=excluded.first_day,last_day=excluded.last_day,
      reviewed_problems=excluded.reviewed_problems,expected_problems=excluded.expected_problems,
      complete=excluded.complete,imported_at=excluded.imported_at,source_url=excluded.source_url`)
    .bind(coverage.firstDay,coverage.lastDay,coverage.reviewedProblems,coverage.expectedProblems,coverage.complete?1:0,importedAt,sourceUrl));
  // Bounded batches avoid oversized D1 transactions. Retrying a partially
  // completed request is safe; coverage advances only after all entries write.
  for(let index=0;index<statements.length;index+=100)await db.batch(statements.slice(index,index+100));
}
