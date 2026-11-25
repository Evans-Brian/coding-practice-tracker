'use client';

import {useEffect,useState} from 'react';
import StudyHeader from '../study-header';
import Question,{QuestionProgressProvider} from '../question-card';
import {blankProgress,isCompleted,type Progress} from '../progress-state';
import {neetcodeQuestions,studyQuestions,type StudyQuestion} from '../study-catalog';
import {commonProgressAfterSave,commonQuestionVisible,type CommonPracticeView} from './common-practice-state';

type CommonSelection={questionIds:string[];solvedSlugs:string[];createdAt:string|null};
type CommonState={selection:CommonSelection;progress:Record<string,Progress>};
const catalog=studyQuestions('all');
const bySlug=new Map(catalog.map(question=>[question.slug,question]));

export default function CommonPractice({view='practice'}:{view?:CommonPracticeView}){
  const [state,setState]=useState<CommonState|null>(null);
  const [error,setError]=useState(false),[notice,setNotice]=useState('');
  const repeatView=view==='repeat';

  async function load(){
    setError(false);
    try{
      const [selectionResponse,progressResponse]=await Promise.all([
        fetch('/api/common-practice',{cache:'no-store'}),
        fetch('/api/progress',{cache:'no-store'}),
      ]);
      if(!selectionResponse.ok||!progressResponse.ok)throw Error();
      const [selection,progress]=await Promise.all([selectionResponse.json(),progressResponse.json()]) as [CommonSelection,Record<string,Progress>];
      if(!Array.isArray(selection.questionIds)||!Array.isArray(selection.solvedSlugs)
        ||selection.questionIds.some(slug=>typeof slug!=='string'||bySlug.get(slug)?.kind!=='leetcode')
        ||selection.solvedSlugs.some(slug=>typeof slug!=='string')
        ||new Set(selection.questionIds).size!==selection.questionIds.length)throw Error();
      setState({selection,progress});
    }catch{setError(true);}
  }
  useEffect(()=>{load();},[]);

  function updateProgress(slug:string,progress:Progress){
    setState(previous=>previous?{...previous,progress:{...previous.progress,[slug]:progress}}:previous);
  }
  function saveProgress(slug:string,value:Progress){
    setState(previous=>previous?{...previous,progress:commonProgressAfterSave(previous.progress,view,slug,value)}:previous);
  }
  const members:StudyQuestion[]=(state?.selection.questionIds??[]).map((slug,index)=>({...bySlug.get(slug)!,order:index+1}));
  const solved=new Set(state?.selection.solvedSlugs??[]);
  const progress=state?.progress;
  const completed=(question:StudyQuestion)=>isCompleted(progress?.[question.slug]??blankProgress);
  const finished=members.filter(question=>completed(question)||solved.has(question.slug));
  const repeats=members.filter(question=>commonQuestionVisible(question.slug,progress,solved,'repeat'));
  const unfinished=members.filter(question=>commonQuestionVisible(question.slug,progress,solved,'practice'));
  const visible=repeatView?repeats:unfinished;
  const allCompleted=catalog.filter(completed);
  const counts=state?{
    neetcode:neetcodeQuestions.filter(completed).length,
    repeat:allCompleted.filter(question=>progress?.[question.slug].repeat).length,
    done:allCompleted.filter(question=>!progress?.[question.slug].repeat).length,
  }:null;

  return <QuestionProgressProvider><div className="study-app common-practice-page" data-common-practice-view={view}>
    <StudyHeader active={repeatView?'common-repeat':'common'} counts={counts}/>
    <main className="common-practice-main">
      <aside className="edge-case-reminder" aria-label="Practice reminder">
        <strong>Always think about edge cases.</strong>
        <p>Read the question and examples carefully. Check especially for empty strings and empty inputs. Use any remaining time to test edge cases.</p>
      </aside>
      <header className="page-header common-practice-heading">
        <div className="page-heading">
          <h1>{repeatView?'Common 50 · Repeat':'Common 50'}</h1>
          <p className="intro">{repeatView?'Revisit completed questions from this set that you’ve marked Should repeat.':'Work through your fixed set of 50 common coding-interview questions. Completed questions leave this queue.'}</p>
          <p className="context">All difficulties, with the same notes, completions, tries, and repeat settings as the rest of your notebook.</p>
        </div>
        <div className="catalog-summary" aria-label="Common 50 progress">
          <span className="summary-label">Common 50 progress</span>
          <strong>{state&&members.length?finished.length+' / '+members.length:'50'}</strong>
          <span className="summary-caption">{state&&members.length?'Completed':'Questions'}</span>
          <div className="summary-difficulties">{members.length>0&&(['Easy','Medium','Hard'] as const).map(difficulty=><span key={difficulty} className={difficulty.toLowerCase()}>{members.filter(question=>question.difficulty===difficulty).length} {difficulty}</span>)}</div>
        </div>
      </header>

      <p className="common-practice-instructions">Selected from an established <a href="https://github.com/neetcode-gh/leetcode/blob/2736633bf3d8a81115b10f299306be91cf822f39/.problemSiteData.json" target="_blank" rel="noopener noreferrer">interview-practice catalog</a>. Your starting set excludes questions you had already completed.</p>

      <nav className="common-practice-nav" aria-label="Common practice pages">
        <a href="/common-50" aria-current={!repeatView?'page':undefined}>Common 50{state&&<span>{unfinished.length} to do</span>}</a>
        <a href="/common-50/repeat" aria-current={repeatView?'page':undefined}>Repeat this set{state&&<span>{repeats.length} to repeat</span>}</a>
      </nav>
      <p className="common-practice-instructions">{repeatView?'Submitting another attempt keeps the question here while Should repeat is checked. Uncheck it, then submit a completed attempt to move it to Done.':'Check Should repeat before submitting to add the question to this set’s Repeat page and your main Repeat list. Otherwise it goes to Done.'} Notes and tries save when you leave the field. Submitting keeps you on this page.</p>
      {notice&&<p className="common-practice-notice" role="status">{notice}</p>}

      {error?<div className="error" role="alert">Your common practice list couldn’t load. <button className="save" onClick={load}>Try again</button></div>:!state?<p role="status">Loading your practice set…</p>:members.length===0?<div className="empty common-practice-empty"><p>Your Common 50 set hasn’t been prepared yet. Your fixed questions will appear here once it’s ready.</p></div>:visible.length===0?<div className="empty common-practice-empty"><p>{repeatView?'No completed questions from this set are marked to repeat yet.':'You’ve completed every question in this set.'}</p><a href={repeatView?'/common-50':'/common-50/repeat'}>{repeatView?'Go to Common 50':'Review this set’s repeat questions'}</a></div>:<div className="question-list common-practice-questions">{visible.map(question=><Question key={question.slug} q={question} initial={progress?.[question.slug]??blankProgress} presentation="common"
        onSaved={value=>saveProgress(question.slug,value)}
        onSubmitted={value=>{updateProgress(question.slug,value);setNotice(question.name+' submitted to '+(value.repeat?'Common Repeat and Repeat':'Done')+'. You are still on this page.');}}/>)}</div>}
      <footer>Practice the explanation as well as the code. Write your own tests before submitting.</footer>
    </main>
  </div></QuestionProgressProvider>;
}
