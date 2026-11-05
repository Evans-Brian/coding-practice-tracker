import {storage} from '../../../db/storage';
import {difficultyPointUnits,localDay} from '../../points-model';
import {parseLeetcodeHistory,leetcodeHistorySourceUrl} from '../../leetcode-history-input';
import {recordLeetcodeHistory} from '../../../db/record-leetcode-history';

async function summary(){
  const [totals,coverage]=await storage().batch([
    storage().prepare('SELECT COUNT(*) AS problemDays,COUNT(DISTINCT question_id) AS problems,COUNT(DISTINCT completed_day) AS days,MIN(completed_day) AS firstDay,MAX(completed_day) AS lastDay FROM leetcode_daily_completions'),
    storage().prepare("SELECT first_day AS firstDay,last_day AS lastDay,reviewed_problems AS reviewedProblems,expected_problems AS expectedProblems,complete,imported_at AS importedAt,source_url AS sourceUrl FROM leetcode_history_import WHERE id='leetcode'"),
  ]);
  return Response.json({totals:totals.results[0],coverage:coverage.results[0]??null},{headers:{'Cache-Control':'no-store'}});
}

export async function GET(){
  try{return await summary();}
  catch(error){console.error('LeetCode history load failed',error);return Response.json({error:'Could not load imported LeetCode history.'},{status:503});}
}

// Sites protects this shared import endpoint with the existing owner-private
// access boundary, just like the progress and extra-study endpoints.
export async function POST(request:Request){
  const now=new Date(),input=parseLeetcodeHistory(await request.json().catch(()=>null),localDay(now));
  if(!input)return Response.json({error:'Provide up to 250 accepted problem-days with valid names, difficulties, dates, and review coverage.'},{status:400});
  try{
    await recordLeetcodeHistory(storage(),input,now.toISOString(),leetcodeHistorySourceUrl,difficultyPointUnits);
    return await summary();
  }catch(error){console.error('LeetCode history import failed',error);return Response.json({error:'Could not import LeetCode history. Retrying this import is safe.'},{status:503});}
}
