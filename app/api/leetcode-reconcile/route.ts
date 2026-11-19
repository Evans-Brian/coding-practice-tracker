import {storage} from '../../../db/storage';
import {studyQuestions} from '../../study-catalog';
import {difficultyPointUnits,localDay} from '../../points-model';
import {parseRecentCompletions} from '../../recent-completion-input';
import {reconcileLeetcodeCompletions} from '../../../db/reconcile-leetcode-completions';

// The existing owner-private Sites access boundary protects this shared updater,
// as it does the progress and historical-points import endpoints. Reconciliation
// is explicit: it never runs automatically when a visitor opens a practice page.
export async function POST(request:Request){
  const input=parseRecentCompletions(await request.json().catch(()=>null),studyQuestions('all'),new Date(),localDay,difficultyPointUnits);
  if(!input)return Response.json({error:'Provide up to 250 accepted submissions from the past seven New York calendar days, with known question IDs and exact completion dates or actual UTC timestamps. Source submission IDs, when supplied, must be positive integers.'},{status:400});
  try{
    return Response.json(await reconcileLeetcodeCompletions(storage(),input),{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    console.error('LeetCode completion reconciliation failed',error);
    return Response.json({error:'Could not reconcile LeetCode completions. Retrying the same accepted submissions is safe.'},{status:503});
  }
}
