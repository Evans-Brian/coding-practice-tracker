'use client';

import {useEffect,useState} from 'react';
import StudyHeader from '../study-header';
import Question,{QuestionProgressProvider} from '../question-card';
import {blankProgress,isCompleted,type Progress} from '../progress-state';
import {neetcodeQuestions,studyQuestions} from '../study-catalog';
import {googleTop50Questions,googleTop50Snapshot} from '../google-top50';

const allQuestions=studyQuestions('all');
const frequencyLabel=(frequency:number)=>frequency.toFixed(1)+'%';
const checkedOn=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'})
  .format(new Date(googleTop50Snapshot.retrievedOn+'T12:00:00Z'));

export default function GoogleTop50Dashboard(){
  const [data,setData]=useState<Record<string,Progress>|null>(null);
  const [error,setError]=useState(false),[notice,setNotice]=useState('');

  async function load(){
    setError(false);
    try{
      const response=await fetch('/api/progress',{cache:'no-store'});
      if(!response.ok)throw Error();
      setData(await response.json());
    }catch{setError(true);}
  }
  useEffect(()=>{load();},[]);

  function updateProgress(slug:string,progress:Progress){
    setData(previous=>({...previous,[slug]:progress}));
  }
  const completed=allQuestions.filter(question=>isCompleted(data?.[question.slug]??blankProgress));
  const counts=data?{
    neetcode:neetcodeQuestions.filter(question=>isCompleted(data[question.slug]??blankProgress)).length,
    repeat:completed.filter(question=>data[question.slug].repeat).length,
    done:completed.filter(question=>!data[question.slug].repeat).length,
  }:null;
  const listCompleted=googleTop50Questions.filter(question=>isCompleted(data?.[question.slug]??blankProgress)).length;

  return <QuestionProgressProvider><div className="study-app google-top50-page">
    <StudyHeader active="google" counts={counts}/>
    <main className="google-top50-main">
      <aside className="edge-case-reminder" aria-label="Practice reminder">
        <strong>Always think about edge cases.</strong>
        <p>Read the question and examples carefully. Check especially for empty strings and empty inputs. Use any remaining time to test edge cases.</p>
      </aside>

      <header className="page-header google-top50-heading">
        <div className="page-heading">
          <p className="google-top50-eyebrow">{googleTop50Snapshot.company} · {googleTop50Snapshot.period}</p>
          <h1>Google Top 50</h1>
          <p className="intro">The 50 highest-frequency problems in Google’s three-month LeetCode list, kept in frequency order.</p>
          <p className="context">Your notes, completions, tries, and repeat settings are shared with the rest of your notebook.</p>
        </div>
        <div className="catalog-summary" aria-label="Google Top 50 progress">
          <span className="summary-label">Google Top 50</span>
          <strong>{data?listCompleted+' / '+googleTop50Questions.length:googleTop50Questions.length}</strong>
          <span className="summary-caption">{data?'Completed':'Questions'}</span>
          <div className="summary-difficulties">{(['Easy','Medium','Hard'] as const).map(difficulty=><span key={difficulty} className={difficulty.toLowerCase()}>{googleTop50Questions.filter(question=>question.difficulty===difficulty).length} {difficulty}</span>)}</div>
        </div>
      </header>

      <aside className="google-top50-source" aria-label="Frequency source and meaning">
        <div><strong>LeetCode frequency</strong><p>The percentages are LeetCode’s relative frequency scores. They are not interview counts or the percentage of Google interviews that ask a problem.</p></div>
        <div className="google-top50-source-meta"><a href={googleTop50Snapshot.sourceUrl} target="_blank" rel="noopener noreferrer">View the three-month source</a><span>Snapshot: {checkedOn}</span></div>
      </aside>
      <p className="google-top50-instructions">All 50 problems stay in this list so you can review their frequency and completion status. Notes and tries save when you leave the field. Submit adds one completion, updates Repeat or Done, and keeps you on this page.</p>
      {notice&&<p className="google-top50-notice" role="status">{notice}</p>}

      {error?<div className="error" role="alert">Your progress couldn’t load. <button className="save" onClick={load}>Try again</button></div>:!data?<p role="status">Loading your notebook…</p>:<ol className="google-top50-list" aria-label="Google problems ranked by LeetCode frequency">{googleTop50Questions.map((question,index)=>{
        const source=googleTop50Snapshot.questions[index];
        return <li key={question.slug} className="google-top50-entry">
          <div className="google-top50-frequency">
            <span>LeetCode frequency</span>
            <div className="google-top50-meter" role="meter" aria-label={'Relative frequency for '+question.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={source.frequency} aria-valuetext={frequencyLabel(source.frequency)+' LeetCode relative frequency score'}><span style={{width:source.frequency+'%'}}/></div>
            <strong>{frequencyLabel(source.frequency)}</strong>
          </div>
          <div className="question-list"><Question q={{...question,order:source.rank}} initial={data[question.slug]??blankProgress} showTopic={false} showRelevance={false} showBinarySearchTips={false}
            onSaved={progress=>updateProgress(question.slug,progress)}
            onSubmitted={progress=>{updateProgress(question.slug,progress);setNotice(question.name+' submitted to '+(progress.repeat?'Repeat':'Done')+'. You are still on this page.');}}/></div>
        </li>;
      })}</ol>}
      <footer>Practice the explanation as well as the code. Write your own tests before submitting.</footer>
    </main>
  </div></QuestionProgressProvider>;
}
