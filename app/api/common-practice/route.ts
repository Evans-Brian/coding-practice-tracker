import {storage} from '../../../db/storage';
import {readCommonPracticeQueue,seedCommonPracticeQueue} from '../../../db/common-practice';
import {parseCommonPracticeSeed,validCommonPracticeCandidates} from '../../common-practice-input';
import {commonPracticeCandidateSlugs} from '../../common-practice-candidates';
import {studyQuestions} from '../../study-catalog';

function response(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store'}});}

// The shared personal queue uses the existing owner-private Sites boundary.
// Reading it never selects questions, refills it, or changes completion records.
export async function GET(){
  try{return response(await readCommonPracticeQueue(storage()));}
  catch(error){console.error('Common practice queue load failed',error);return response({error:'Could not load your common practice queue.'},503);}
}

export async function POST(request:Request){
  const questionIds=parseCommonPracticeSeed(await request.json().catch(()=>null));
  if(!questionIds)return response({error:'Choose exactly 50 distinct question IDs in their desired order.'},400);
  try{
    const db=storage(),existing=await readCommonPracticeQueue(db);
    // A retry remains valid after its questions have been completed or the
    // public candidate pool changes. Existing membership is never replaced.
    if(existing.createdAt!==null){
      const same=existing.questionIds.every((id,index)=>id===questionIds[index]);
      return response({...existing,created:false,...(same?{}:{error:'Your fixed common practice queue already exists and cannot be replaced by this request.'})},same?200:409);
    }
    if(!validCommonPracticeCandidates(questionIds,commonPracticeCandidateSlugs,studyQuestions('all')))
      return response({error:'Select 50 known LeetCode questions from the common candidate pool, including Easy, Medium, and Hard.'},400);
    const result=await seedCommonPracticeQueue(db,questionIds,new Date().toISOString());
    if(result.status==='conflict')return response({...result.queue,created:false,error:'Your fixed common practice queue was created by another request and has been preserved.'},409);
    if(result.status==='ineligible')return response({...result.queue,created:false,completedQuestionIds:result.completedQuestionIds,error:'Some selected questions already have completed progress or accepted history. No queue was created.'},409);
    return response({...result.queue,created:result.status==='created'},result.status==='created'?201:200);
  }catch(error){
    console.error('Common practice queue save failed',error);
    return response({error:'Could not save your common practice queue. Retrying the same selection is safe.'},503);
  }
}
