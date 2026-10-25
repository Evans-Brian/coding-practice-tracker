import {storage} from '../../../db/storage';
import {studyQuestions} from '../../study-catalog';
import {buildPointsDashboard,type CompletionEvent,type PointProgress} from '../../points-model';

export async function GET() {
  try {
    const db=storage();
    const [events,progress]=await db.batch([
      db.prepare('SELECT question_id AS questionId,difficulty,point_units AS pointUnits,completed_at AS completedAt,completed_day AS completedDay FROM completion_events ORDER BY completed_at'),
      db.prepare('SELECT id,completions,submitted,repeat FROM progress'),
    ]);
    return Response.json(buildPointsDashboard(events.results as CompletionEvent[],progress.results as PointProgress[],studyQuestions('all')),{headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    console.error('Points load failed',error);return Response.json({error:'Could not load your daily points'},{status:503});
  }
}
