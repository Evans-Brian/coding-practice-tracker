"use client";
import { useEffect, useState } from "react";
import { grind75Count, currentQuestionCount, customQuestionCount } from "./questions";
import {eligibleQuestions, studyGroups, neetcodeQuestions, type StudyQuestion, type StudyCatalog} from './study-catalog';
import {blankProgress as blank, isCompleted, type Progress} from './progress-state';
import Question, {QuestionProgressProvider} from './question-card';
import RandomQuestion from './random-question';
const notPrioritizedTopics=new Set(['1-D Dynamic Programming','2-D Dynamic Programming','Bit Manipulation']);
export default function Tracker({view='practice',catalog=view==='practice'?'neetcode':'all'}:{view?:'practice'|'repeat'|'done';catalog?:StudyCatalog}){
 const [data,setData]=useState<Record<string,Progress>|null>(null),[error,setError]=useState(false),[notice,setNotice]=useState('');
 async function load(){setError(false);try{const res=await fetch('/api/progress',{cache:'no-store'});if(!res.ok)throw Error();setData(await res.json());}catch{setError(true);}}
 useEffect(()=>{load();},[]);
 const isNeetcode=catalog==='neetcode',isUpstart=catalog==='upstart';
 const groups=studyGroups(catalog),eligible=eligibleQuestions(catalog,data);
 const allEligible=eligibleQuestions('all',data);
 const visible=eligible.filter(q=>{const p=data?.[q.slug]??blank;return view==='practice'?!isCompleted(p):isCompleted(p)&&p.repeat===(view==='repeat');});
 const count=(v:'repeat'|'done')=>allEligible.filter(q=>{const p=data?.[q.slug]??blank;return isCompleted(p)&&p.repeat===(v==='repeat');}).length;
 const completedCount=neetcodeQuestions.filter(q=>isCompleted(data?.[q.slug]??blank)).length;
 const questionHref=(slug:string)=>{const p=data?.[slug]??blank;return (isCompleted(p)?(p.repeat?'/repeat':'/done'):'/upstart')+'#question-'+slug;};
 const setProgress=(slug:string,progress:Progress)=>setData(previous=>({...previous,[slug]:progress}));
 const renderQuestion=(q:StudyQuestion,idPrefix='')=><Question key={q.slug} q={q} initial={data?.[q.slug]??blank} idPrefix={idPrefix} variationHref={q.reportedVariationSlug?questionHref(q.reportedVariationSlug):undefined}
   onSaved={progress=>{if(view==='practice')setProgress(q.slug,progress);}}
   onSubmitted={progress=>{setProgress(q.slug,progress);setNotice(q.name+' submitted to '+(progress.repeat?'Repeat':'Done')+'. You are still on this page.');}}/>;
 const priorityGroups=groups.map((_,i)=>i).filter(i=>!isNeetcode||!notPrioritizedTopics.has(groups[i].title));
 const laterGroups=isNeetcode?groups.map((_,i)=>i).filter(i=>notPrioritizedTopics.has(groups[i].title)):[];
 const groupOrder=[...priorityGroups,...laterGroups];
 const hasLaterQuestions=laterGroups.some(i=>visible.some(q=>q.bucket===i));
 const topicLinks=(indexes:number[])=>indexes.map(i=>(!data||visible.some(q=>q.bucket===i))&&<a key={i} href={'#bucket-'+i}><span>{String(groupOrder.indexOf(i)+1).padStart(2,'0')}</span>{groups[i].title}</a>);
 const renderGroups=(indexes:number[])=>indexes.map(i=>{
   if(!data)return null;
   const b=groups[i],groupQuestions=visible.filter(q=>q.bucket===i);
   if(!groupQuestions.length)return null;
   const allGroupQuestions=eligible.filter(q=>q.bucket===i);
   const groupCompleted=allGroupQuestions.filter(q=>isCompleted(data[q.slug]??blank)).length;
   const TopicHeading=isNeetcode&&notPrioritizedTopics.has(b.title)?'h3':'h2';
   return <section id={'bucket-'+i} key={i}>
     <div className="section-heading"><span className="bucket-no">{String(groupOrder.indexOf(i)+1).padStart(2,'0')}</span><div><TopicHeading>{b.title}</TopicHeading>{b.description&&<p>{b.description}</p>}</div><span className="total">{isNeetcode?groupCompleted+' / '+allGroupQuestions.length+' completed':groupQuestions.length+' questions'}</span></div>
     <div className="question-list">{groupQuestions.map(q=>renderQuestion(q))}</div>
   </section>;
 });
 return <QuestionProgressProvider><div className="study-app">
 <header className="study-topbar">
   <a className="brand" href="/"><span className="logo">N</span><span>Practice notebook</span></a>
   <nav className="pages" aria-label="Study pages">
     <a href="/" aria-current={isNeetcode?'page':undefined}>NeetCode 150{data&&<span>{completedCount}/150</span>}</a>
     <a href="/repeat" aria-current={view==='repeat'?'page':undefined}>Repeat{data&&<span>{count('repeat')}</span>}</a>
     <a href="/done" aria-current={view==='done'?'page':undefined}>Done{data&&<span>{count('done')}</span>}</a>
     <a href="/upstart" aria-current={isUpstart?'page':undefined}>Upstart Prep</a>
   </nav>
 </header>
 <div className="study-layout">
 <aside className="study-sidebar">
   <p className="sidebar-heading">{isUpstart?'Study priorities':'Topics'}</p>
   <nav className={isUpstart?'':'topic-nav'} aria-label={isUpstart?'Question buckets':'Question topics'}>{topicLinks(priorityGroups)}{laterGroups.length>0&&(!data||hasLaterQuestions)&&<span className="sidebar-divider">Not Prioritized</span>}{topicLinks(laterGroups)}</nav>
 </aside>
 <main className="study-main">
 {view!=='done'&&<aside className="edge-case-reminder" aria-label="Practice reminder">
   <strong>Always think about edge cases.</strong>
   <p>Read the question and examples carefully. Check especially for empty strings and empty inputs. Use any remaining time to test edge cases.</p>
 </aside>}
 <header className="page-header">
   <div className="page-heading">
   <h1>{view==='repeat'?'Questions to repeat':view==='done'?'Completed questions':isNeetcode?'NeetCode 150':'Upstart practice notebook'}</h1>
   <p className="intro">{data?visible.length+(view==='practice'?' questions to practice':' questions'):isNeetcode?'NeetCode 150':'Your questions'}, {isUpstart?'organized by relevance':'grouped by topic'}. {view==='repeat'?'Revisit, reflect, submit another attempt.':view==='done'?'Your completed attempts, with notes for later.':'Solve, reflect, repeat.'}</p>
   {isUpstart?<p className="context">Start with the <a href="https://leetcode.com/company/upstart/?favoriteSlug=upstart-all" target="_blank" rel="noopener noreferrer">six-question Upstart company list</a>, then recent reports and transferable techniques. These are study priorities, not predictions of your screen.</p>:<p className="context">{isNeetcode?'The complete NeetCode 150 list, organized into 18 topics.':'Your shared progress across NeetCode 150 and Upstart prep.'} Matching questions share notes, completions, tries, and repeat settings across every page.</p>}
   </div>
   {isUpstart?<p className="catalog-summary upstart-summary"><strong>{grind75Count} / 75 Grind 75 questions included</strong> · {data?eligible.length-grind75Count:currentQuestionCount-grind75Count} extras ({customQuestionCount} custom drills) · {data?eligible.length:currentQuestionCount} total in Upstart prep.</p>:<div className="catalog-summary" aria-label="NeetCode progress"><span className="summary-label">NeetCode 150</span><strong>{data?completedCount+' / 150':'150'}</strong><span className="summary-caption">{data?'Completed':'Questions'}</span><div className="summary-difficulties"><span className="easy">28 Easy</span><span className="medium">101 Medium</span><span className="hard">21 Hard</span></div></div>}
 </header>
 <div className="storage-note">{isUpstart?<>Includes the complete <a href="https://www.techinterviewhandbook.org/grind75/" target="_blank" rel="noopener noreferrer">default Grind 75</a>, all six company-list matches, and recent-report practice. LeetCode proxies link to their problems; custom drills include a prompt. Standalone reported variations have their own notes and progress. </>:<>List and topics follow <a href="https://neetcode.io/practice/practice/neetcode150" target="_blank" rel="noopener noreferrer">NeetCode 150</a>. Every question links to LeetCode and shows its difficulty. </>}Completed questions are in Repeat or Done. Notes and tries save when you leave the field. Submit adds one completion, updates Repeat or Done, and keeps you on this page.</div>
 {isUpstart&&<p className="date-guide">Asked dates describe a documented occurrence or an estimate from a dated report. They are not a last-asked date. Dates on proxy cards apply to the reported variation; unknown means no defensible interview date. Page updates are not treated as interview dates.</p>}
 {notice&&<p className="storage-note" role="status">{notice}</p>}
 {isNeetcode&&!error&&<RandomQuestion questions={data?visible:null} renderQuestion={q=>renderQuestion(q,'random-')}/>}
 {error?<div className="error" role="alert">Your progress couldn’t load. <button onClick={load}>Try again</button></div>:!data?<p role="status">Loading your notebook…</p>:visible.length===0?<p className="empty">{view==='practice'?'All questions are completed. Visit Repeat to practice again.':view==='repeat'?'No completed questions to repeat yet. Check Should repeat before submitting an attempt.':'No questions here yet. Uncheck Should repeat and submit a completed attempt.'}</p>:<>{renderGroups(priorityGroups)}{hasLaterQuestions&&<section className="not-prioritized" aria-labelledby="not-prioritized-heading"><h2 id="not-prioritized-heading">Not Prioritized</h2>{renderGroups(laterGroups)}</section>}</>}
 <footer>Practice the explanation as well as the code. Write your own tests before submitting.</footer></main></div></div></QuestionProgressProvider>;
}




