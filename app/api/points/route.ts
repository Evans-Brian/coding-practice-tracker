import {storage} from '../../../db/storage';
import {studyQuestions} from '../../study-catalog';
import {buildPointsDashboard,localDay,type CompletionEvent,type PointProgress,type StudyCredit} from '../../points-model';
import {parseStudyCredit,validCreditId} from '../../study-credit-input';

async function dashboard(){
  const db=storage();
  const [events,progress,credits]=await db.batch([
    db.prepare('SELECT question_id AS questionId,difficulty,point_units AS pointUnits,completed_at AS completedAt,completed_day AS completedDay FROM completion_events ORDER BY completed_at'),
    db.prepare('SELECT id,completions,submitted,repeat FROM progress'),
    db.prepare('SELECT id,point_units AS pointUnits,note,earned_day AS earnedDay,created_at AS createdAt FROM study_credits ORDER BY created_at'),
  ]);
  return Response.json(buildPointsDashboard(events.results as CompletionEvent[],progress.results as PointProgress[],studyQuestions('all'),new Date(),credits.results as StudyCredit[]),{headers:{'Cache-Control':'no-store'}});
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
