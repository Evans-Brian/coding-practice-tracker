"use client";
import { useEffect, useState } from "react";
import {eligibleQuestions, studyGroups, neetcodeQuestions, dashboardQuestions, extraPracticeQuestions, type StudyQuestion, type StudyCatalog} from './study-catalog';
import {blankProgress as blank, isCompleted, type Progress} from './progress-state';
import Question, {QuestionProgressProvider} from './question-card';
import RandomQuestion from './random-question';
import BinarySearchGuide from './binary-search-guide';
import StudyHeader from './study-header';
const notPrioritizedTopics=new Set(['1-D Dynamic Programming','2-D Dynamic Programming','Bit Manipulation','Math & Geometry']);
const isNotPrioritized=(q:StudyQuestion)=>notPrioritizedTopics.has(q.theme)
  || (q.difficulty==='Hard'&&(q.theme==='Linked List'||q.theme==='Trees'));
const prioritizedQuestions=dashboardQuestions.filter(q=>!isNotPrioritized(q));
const prioritizedDifficulties=(['Easy','Medium','Hard'] as const).map(name=>({name,total:prioritizedQuestions.filter(q=>q.difficulty===name).length}));
export default function Tracker({view='practice',catalog=view==='practice'?'neetcode':'all'}:{view?:'practice'|'repeat'|'done';catalog?:StudyCatalog}){
 const [data,setData]=useState<Record<string,Progress>|null>(null),[error,setError]=useState(false),[notice,setNotice]=useState('');
 async function load(){setError(false);try{const res=await fetch('/api/progress',{cache:'no-store'});if(!res.ok)throw Error();setData(await res.json());}catch{setError(true);}}
 useEffect(()=>{load();},[]);
 const isNeetcode=catalog==='neetcode';
 const groups=studyGroups(catalog),eligible=eligibleQuestions(catalog,data);
 const allEligible=eligibleQuestions('all',data);
 const visible=eligible.filter(q=>{const p=data?.[q.slug]??blank;return view==='practice'?!isCompleted(p):isCompleted(p)&&p.repeat===(view==='repeat');});
 const count=(v:'repeat'|'done')=>allEligible.filter(q=>{const p=data?.[q.slug]??blank;return isCompleted(p)&&p.repeat===(v==='repeat');}).length;
 const completedCount=neetcodeQuestions.filter(q=>isCompleted(data?.[q.slug]??blank)).length;
 const prioritizedCompletedCount=prioritizedQuestions.filter(q=>isCompleted(data?.[q.slug]??blank)).length;
 const questionHref=(slug:string)=>{const p=data?.[slug]??blank;if(isCompleted(p))return (p.repeat?'/repeat':'/done')+'#question-'+slug;return allEligible.find(q=>q.slug===slug)?.exercisePath??(slug==='upstart-anagram-sentence'?'/practice/anagram-sentence':'/#question-'+slug);};
 const setProgress=(slug:string,progress:Progress)=>setData(previous=>({...previous,[slug]:progress}));
 const renderQuestion=(q:StudyQuestion,options:{idPrefix?:string;showTopic?:boolean}={})=><Question key={q.slug} q={q} initial={data?.[q.slug]??blank} {...options} showBinarySearchTips={q.theme==='Binary Search'&&groups[q.bucket]?.title!=='Binary Search'} variationHref={q.reportedVariationSlug?questionHref(q.reportedVariationSlug):undefined}
   onSaved={progress=>{if(view==='practice')setProgress(q.slug,progress);}}
   onSubmitted={progress=>{setProgress(q.slug,progress);setNotice(q.name+' submitted to '+(progress.repeat?'Repeat':'Done')+'. You are still on this page.');}}/>;
 const priorityGroups=groups.map((_,i)=>i).filter(i=>!isNeetcode||eligible.some(q=>q.bucket===i&&!isNotPrioritized(q)));
 const laterGroups=isNeetcode?groups.map((_,i)=>i).filter(i=>eligible.some(q=>q.bucket===i&&isNotPrioritized(q))):[];
 const inGroup=(q:StudyQuestion,i:number,later:boolean)=>q.bucket===i&&(!isNeetcode||isNotPrioritized(q)===later);
 const groupId=(i:number,later:boolean)=>'bucket-'+i+(later&&priorityGroups.includes(i)?'-not-prioritized':'');
 const groupTitle=(i:number,later:boolean)=>groups[i].title+(later&&priorityGroups.includes(i)?' · Hard':'');
 const groupNumber=(i:number,later:boolean)=>String((later?priorityGroups.length+laterGroups.indexOf(i):priorityGroups.indexOf(i))+1).padStart(2,'0');
 const hasLaterQuestions=visible.some(q=>isNeetcode&&isNotPrioritized(q));
 const topicLinks=(indexes:number[],later=false)=>indexes.map(i=>(!data||visible.some(q=>inGroup(q,i,later)))&&<a key={i} href={'#'+groupId(i,later)}><span>{groupNumber(i,later)}</span>{groupTitle(i,later)}</a>);
 const renderGroups=(indexes:number[],later=false)=>indexes.map(i=>{
   if(!data)return null;
   const b=groups[i],groupQuestions=visible.filter(q=>inGroup(q,i,later));
   if(!groupQuestions.length)return null;
   const allGroupQuestions=eligible.filter(q=>inGroup(q,i,later));
   const groupCompleted=allGroupQuestions.filter(q=>isCompleted(data[q.slug]??blank)).length;
   const TopicHeading=isNeetcode&&later?'h3':'h2';
   return <section id={groupId(i,later)} key={i}>
     <div className="section-heading"><span className="bucket-no">{groupNumber(i,later)}</span><div><TopicHeading>{groupTitle(i,later)}</TopicHeading>{b.description&&<p>{b.description}</p>}</div><span className="total">{isNeetcode?groupCompleted+' / '+allGroupQuestions.length+' completed':groupQuestions.length+' questions'}</span></div>
     {b.title==='Binary Search'&&<BinarySearchGuide/>}
     <div className="question-list">{groupQuestions.map(q=>renderQuestion(q))}</div>
   </section>;
 });
 return <QuestionProgressProvider><div className="study-app">
 <StudyHeader active={isNeetcode?'neetcode':view==='repeat'?'repeat':view==='done'?'done':undefined} counts={data?{neetcode:completedCount,repeat:count('repeat'),done:count('done')}:null}/>
 <div className="study-layout">
 <aside className="study-sidebar">
   <p className="sidebar-heading">Topics</p>
   <nav className="topic-nav" aria-label="Question topics">{topicLinks(priorityGroups)}{laterGroups.length>0&&(!data||hasLaterQuestions)&&<span className="sidebar-divider">Not Prioritized</span>}{topicLinks(laterGroups,true)}</nav>
 </aside>
 <main className="study-main">
 {view!=='done'&&<aside className="edge-case-reminder" aria-label="Practice reminder">
   <strong>Always think about edge cases.</strong>
   <p>Read the question and examples carefully. Check especially for empty strings and empty inputs. Use any remaining time to test edge cases.</p>
 </aside>}
 <header className="page-header">
   <div className="page-heading">
   <h1>{view==='repeat'?'Questions to repeat':view==='done'?'Completed questions':isNeetcode?'NeetCode 150':'Coding practice'}</h1>
   <p className="intro">{data?visible.length+(view==='practice'?' questions to practice':' questions'):isNeetcode?'NeetCode 150':'Your questions'}, grouped by topic. {view==='repeat'?'Revisit, reflect, submit another attempt.':view==='done'?'Your completed attempts, with notes for later.':'Solve, reflect, repeat.'}</p>
   <p className="context">{isNeetcode?'The complete NeetCode 150 list plus '+extraPracticeQuestions.length+' extra practice questions, organized into 18 topics.':'Your shared progress across NeetCode 150 and additional practice.'} Matching questions share notes, completions, tries, and repeat settings across every page.</p>
   </div>
   <div className="catalog-summary" aria-label="Prioritized practice progress"><span className="summary-label">Prioritized progress</span><strong>{data?prioritizedCompletedCount+' / '+prioritizedQuestions.length:prioritizedQuestions.length}</strong><span className="summary-caption">{data?'Completed':'Questions'}</span><div className="summary-difficulties">{prioritizedDifficulties.map(({name,total})=><span key={name} className={name.toLowerCase()}>{total} {name}</span>)}</div></div>
 </header>
 <div className="storage-note">List and topics follow <a href="https://neetcode.io/practice/practice/neetcode150" target="_blank" rel="noopener noreferrer">NeetCode 150</a>. LeetCode questions link to their problems; custom drills include a practice prompt. Completed questions are in Repeat or Done. Notes and tries save when you leave the field. Submit adds one completion, updates Repeat or Done, and keeps you on this page.</div>
 {notice&&<p className="storage-note" role="status">{notice}</p>}
 {isNeetcode&&!error&&<RandomQuestion questions={data?visible.filter(q=>!isNotPrioritized(q)):null} renderQuestion={q=>renderQuestion(q,{idPrefix:'random-',showTopic:false})}/>}
 {error?<div className="error" role="alert">Your progress couldn’t load. <button onClick={load}>Try again</button></div>:!data?<p role="status">Loading your notebook…</p>:visible.length===0?<p className="empty">{view==='practice'?'All questions are completed. Visit Repeat to practice again.':view==='repeat'?'No completed questions to repeat yet. Check Should repeat before submitting an attempt.':'No questions here yet. Uncheck Should repeat and submit a completed attempt.'}</p>:<>{renderGroups(priorityGroups)}{hasLaterQuestions&&<section className="not-prioritized" aria-labelledby="not-prioritized-heading"><h2 id="not-prioritized-heading">Not Prioritized</h2>{renderGroups(laterGroups,true)}</section>}</>}
 <footer>Practice the explanation as well as the code. Write your own tests before submitting.</footer></main></div></div></QuestionProgressProvider>;
}




