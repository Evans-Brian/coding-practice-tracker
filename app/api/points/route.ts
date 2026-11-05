import {storage} from '../../../db/storage';
import {studyQuestions} from '../../study-catalog';
import {buildPointsDashboard,localDay,type CompletionEvent,type PointProgress,type StudyCredit,type LeetcodeDailyCompletion,type LeetcodeImportMetadata} from '../../points-model';
import {parseStudyCredit,validCreditId} from '../../study-credit-input';

async function dashboard(){
  const db=storage();
  const [events,progress,credits,history,historyImport]=await db.batch([
    db.prepare('SELECT question_id AS questionId,difficulty,point_units AS pointUnits,completed_at AS completedAt,completed_day AS completedDay FROM completion_events ORDER BY completed_at'),
    db.prepare('SELECT id,completions,submitted,repeat FROM progress'),
    db.prepare('SELECT id,point_units AS pointUnits,note,earned_day AS earnedDay,created_at AS createdAt FROM study_credits ORDER BY created_at'),
    db.prepare('SELECT question_id AS questionId,name,difficulty,point_units AS pointUnits,completed_day AS completedDay,imported_at AS importedAt FROM leetcode_daily_completions ORDER BY completed_day,question_id'),
    db.prepare("SELECT first_day AS firstDay,last_day AS lastDay,reviewed_problems AS reviewedProblems,expected_problems AS expectedProblems,complete,imported_at AS importedAt,source_url AS sourceUrl FROM leetcode_history_import WHERE id='leetcode'"),
  ]);
  return Response.json(buildPointsDashboard(events.results as CompletionEvent[],progress.results as PointProgress[],studyQuestions('all'),new Date(),credits.results as StudyCredit[],
    {entries:history.results as LeetcodeDailyCompletion[],import:(historyImport.results[0] as LeetcodeImportMetadata|undefined)??null}),{headers:{'Cache-Control':'no-store'}});
}

export async function GET() {
  try {
    return await dashboard();
  } catch(error) {
    console.error('Points load failed',error);return Response.json({error:'Could not load your daily points'},{status:503});
  }
}

export async function POST(request:Request){
  const input=parseStudyCredit(await request.json().catch(()=>null));
  if(!input)return Response.json({error:'Choose 0.5 or 1 point and keep the note under 500 characters.'},{status:400});
  try{
    const now=new Date();
    await storage().prepare('INSERT INTO study_credits (id,point_units,note,earned_day,created_at) VALUES (?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(input.id,input.pointUnits,input.note,localDay(now),now.toISOString()).run();
    return await dashboard();
  }catch(error){console.error('Extra points save failed',error);return Response.json({error:'Could not save extra points. Try again.'},{status:503});}
}

export async function DELETE(request:Request){
  const input=await request.json().catch(()=>null);
  const id=input&&typeof input==='object'&&'id' in input?input.id:null;
  if(!validCreditId(id))return Response.json({error:'Invalid extra points entry.'},{status:400});
  try{
    await storage().prepare('DELETE FROM study_credits WHERE id=?').bind(id).run();
    return await dashboard();
  }catch(error){console.error('Extra points removal failed',error);return Response.json({error:'Could not remove extra points. Try again.'},{status:503});}
}
