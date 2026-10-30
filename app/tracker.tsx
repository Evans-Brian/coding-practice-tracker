"use client";
import { useEffect, useState } from "react";
import {eligibleQuestions, studyGroups, neetcodeQuestions, dashboardQuestions, extraPracticeQuestions, type StudyQuestion, type StudyCatalog} from './study-catalog';
import {blankProgress as blank, isCompleted, type Progress} from './progress-state';
import Question, {QuestionProgressProvider} from './question-card';
import RandomQuestion from './random-question';
import BinarySearchGuide from './binary-search-guide';
import StudyHeader from './study-header';
import {classifyQuestionTier,sectionsForPracticePage,studyTiers,type StudyTier,type PracticePage} from './study-priorities';
import {RelevanceGuide} from './question-relevance-label';
type DisplaySection={id:string;title:string;theme:string;tier:StudyTier;relevance?:number;description?:string;matches:(question:StudyQuestion)=>boolean};
const prioritizedQuestions=dashboardQuestions.filter(q=>classifyQuestionTier(q)==='prioritized');
const notPrioritizedQuestions=dashboardQuestions.filter(q=>classifyQuestionTier(q)==='not-prioritized');
export default function Tracker({view='practice',catalog=view==='practice'?'neetcode':'all',practicePage='main'}:{view?:'practice'|'repeat'|'done';catalog?:StudyCatalog;practicePage?:PracticePage}){
 const [data,setData]=useState<Record<string,Progress>|null>(null),[error,setError]=useState(false),[notice,setNotice]=useState('');
 async function load(){setError(false);try{const res=await fetch('/api/progress',{cache:'no-store'});if(!res.ok)throw Error();setData(await res.json());}catch{setError(true);}}
 useEffect(()=>{load();},[]);
 const isNeetcode=catalog==='neetcode';
 const isNotPrioritizedPage=isNeetcode&&practicePage==='not-prioritized';
 const groups=studyGroups(catalog),eligible=eligibleQuestions(catalog,data);
 const sections:readonly DisplaySection[]=isNeetcode?sectionsForPracticePage(practicePage):groups.map((group,i)=>({id:'bucket-'+i,title:group.title,theme:group.title,tier:'prioritized',description:group.description,matches:(q:StudyQuestion)=>q.bucket===i}));
 const allEligible=eligibleQuestions('all',data);
 const visible=eligible.filter(q=>!isNeetcode||sections.some(section=>section.matches(q))).filter(q=>{const p=data?.[q.slug]??blank;return view==='practice'?!isCompleted(p):isCompleted(p)&&p.repeat===(view==='repeat');});
 const count=(v:'repeat'|'done')=>allEligible.filter(q=>{const p=data?.[q.slug]??blank;return isCompleted(p)&&p.repeat===(v==='repeat');}).length;
 const completedCount=neetcodeQuestions.filter(q=>isCompleted(data?.[q.slug]??blank)).length;
 const summaryQuestions=isNotPrioritizedPage?notPrioritizedQuestions:prioritizedQuestions;
 const summaryCompletedCount=summaryQuestions.filter(q=>isCompleted(data?.[q.slug]??blank)).length;
 const summaryDifficulties=(['Easy','Medium','Hard'] as const).map(name=>({name,total:summaryQuestions.filter(q=>q.difficulty===name).length}));
 const summaryLabel=isNotPrioritizedPage?'Not Prioritized progress':'Prioritized progress';
 const questionHref=(slug:string)=>{const p=data?.[slug]??blank;if(isCompleted(p))return (p.repeat?'/repeat':'/done')+'#question-'+slug;const question=allEligible.find(q=>q.slug===slug);return question?.exercisePath??(slug==='upstart-anagram-sentence'?'/practice/anagram-sentence':(question&&classifyQuestionTier(question)==='not-prioritized'?'/not-prioritized':'/')+'#question-'+slug);};
 const setProgress=(slug:string,progress:Progress)=>setData(previous=>({...previous,[slug]:progress}));
 const renderQuestion=(q:StudyQuestion,options:{idPrefix?:string;showTopic?:boolean}={})=><Question key={q.slug} q={q} initial={data?.[q.slug]??blank} {...options} showBinarySearchTips={q.theme==='Binary Search'&&groups[q.bucket]?.title!=='Binary Search'} variationHref={q.reportedVariationSlug?questionHref(q.reportedVariationSlug):undefined}
   onSaved={progress=>{if(view==='practice')setProgress(q.slug,progress);}}
   onSubmitted={progress=>{setProgress(q.slug,progress);setNotice(q.name+' submitted to '+(progress.repeat?'Repeat':'Done')+'. You are still on this page.');}}/>;
 const shownSections=sections.filter(section=>!data||visible.some(section.matches));
 const groupNumber=(section:DisplaySection)=>String(sections.indexOf(section)+1).padStart(2,'0');
 const topicLinks=(list:DisplaySection[])=>list.map(section=><a key={section.id} href={'#'+section.id}><span className="topic-number">{groupNumber(section)}</span><span className="topic-name">{section.title}</span>{section.relevance!==undefined&&<span className="topic-relevance" aria-label={'Relevance '+section.relevance+' out of 100'}>{section.relevance}</span>}</a>);
 const renderGroup=(section:DisplaySection)=>{
   if(!data)return null;
   const groupQuestions=visible.filter(section.matches);
   if(!groupQuestions.length)return null;
   const allGroupQuestions=eligible.filter(section.matches);
   const groupCompleted=allGroupQuestions.filter(q=>isCompleted(data[q.slug]??blank)).length;
   const TopicHeading=isNeetcode?'h3':'h2';
   return <section id={section.id} key={section.id} data-study-tier={section.tier}>
     <div className="section-heading"><span className="bucket-no">{groupNumber(section)}</span><div className="section-title"><TopicHeading>{section.title}</TopicHeading>{section.description&&<p>{section.description}</p>}</div>{section.relevance!==undefined&&<span className="section-relevance">Relevance <strong>{section.relevance}/100</strong></span>}<span className="total">{isNeetcode?groupCompleted+' / '+allGroupQuestions.length+' completed':groupQuestions.length+' questions'}</span></div>
     {section.theme==='Binary Search'&&<BinarySearchGuide/>}
     {section.theme==='Trees'&&<p className="tree-traversal-reference">Study reference: <a href="https://www.geeksforgeeks.org/dsa/tree-traversals-inorder-preorder-and-postorder/" target="_blank" rel="noopener noreferrer">Tree traversals: inorder, preorder &amp; postorder</a></p>}
     {section.theme==='Intervals'&&<p className="topic-study-note"><strong>Tip:</strong> Interval problems can often be combined with heaps as they get more complex.</p>}
     <div className="question-list">{groupQuestions.map(q=>renderQuestion(q))}</div>
   </section>;
 };
 return <QuestionProgressProvider><div className="study-app">
 <StudyHeader active={isNotPrioritizedPage?'not-prioritized':isNeetcode?'neetcode':view==='repeat'?'repeat':view==='done'?'done':undefined} counts={data?{neetcode:completedCount,repeat:count('repeat'),done:count('done')}:null}/>
 <div className="study-layout">
 <aside className="study-sidebar">
   <p className="sidebar-heading">Topics</p>
   <nav className="topic-nav" aria-label="Question topics">{isNeetcode?studyTiers.map(tier=>{const list=shownSections.filter(section=>section.tier===tier.id);return list.length>0&&<div className="sidebar-tier" key={tier.id}><span className="sidebar-divider">{tier.title}</span>{topicLinks(list)}</div>;}):topicLinks(shownSections)}</nav>
 </aside>
 <main className="study-main">
 {view!=='done'&&<aside className="edge-case-reminder" aria-label="Practice reminder">
   <strong>Always think about edge cases.</strong>
   <p>Read the question and examples carefully. Check especially for empty strings and empty inputs. Use any remaining time to test edge cases.</p>
 </aside>}
 <header className="page-header">
   <div className="page-heading">
   <h1>{view==='repeat'?'Questions to repeat':view==='done'?'Completed questions':isNotPrioritizedPage?'Not Prioritized':isNeetcode?'NeetCode 150':'Coding practice'}</h1>
   <p className="intro">{data?visible.length+(view==='practice'?' questions to practice':' questions'):isNeetcode?'NeetCode 150':'Your questions'}, grouped by topic. {view==='repeat'?'Revisit, reflect, submit another attempt.':view==='done'?'Your completed attempts, with notes for later.':'Solve, reflect, repeat.'}</p>
   <p className="context">{isNotPrioritizedPage?<>Later practice from NeetCode 150. <a href="/">Prioritized and Medium Priority topics</a> are on the main page.</>:isNeetcode?<>NeetCode 150 plus {extraPracticeQuestions.length} extra practice questions. Later topics are on the <a href="/not-prioritized">Not Prioritized page</a>.</>:'Your shared progress across NeetCode 150 and additional practice.'} Matching questions share notes, completions, tries, and repeat settings across every page.</p>
   </div>
   <div className="catalog-summary" aria-label={summaryLabel}><span className="summary-label">{summaryLabel}</span><strong>{data?summaryCompletedCount+' / '+summaryQuestions.length:summaryQuestions.length}</strong><span className="summary-caption">{data?'Completed':'Questions'}</span><div className="summary-difficulties">{summaryDifficulties.map(({name,total})=><span key={name} className={name.toLowerCase()}>{total} {name}</span>)}</div></div>
 </header>
 <div className="storage-note">List and topics follow <a href="https://neetcode.io/practice/practice/neetcode150" target="_blank" rel="noopener noreferrer">NeetCode 150</a>. LeetCode questions link to their problems; custom drills include a practice prompt. Completed questions are in Repeat or Done. Notes and tries save when you leave the field. Submit adds one completion, updates Repeat or Done, and keeps you on this page.</div>
 {isNeetcode&&<RelevanceGuide/>}
 {notice&&<p className="storage-note" role="status">{notice}</p>}
 {isNeetcode&&!isNotPrioritizedPage&&!error&&<RandomQuestion questions={data?visible.filter(q=>classifyQuestionTier(q)==='prioritized'):null} renderQuestion={q=>renderQuestion(q,{idPrefix:'random-',showTopic:false})}/>}
 {error?<div className="error" role="alert">Your progress couldn’t load. <button onClick={load}>Try again</button></div>:!data?<p role="status">Loading your notebook…</p>:visible.length===0?<p className="empty">{view==='practice'?'All questions on this page are completed. Visit Repeat to practice again.':view==='repeat'?'No completed questions to repeat yet. Check Should repeat before submitting an attempt.':'No questions here yet. Uncheck Should repeat and submit a completed attempt.'}</p>:isNeetcode?studyTiers.map(tier=>{const list=shownSections.filter(section=>section.tier===tier.id);return list.length>0&&<section className={'study-tier tier-'+tier.id} key={tier.id} aria-labelledby={'tier-'+tier.id}><div className="tier-heading"><h2 id={'tier-'+tier.id}>{tier.title}</h2><p>{tier.description}</p></div>{list.map(renderGroup)}</section>;}):shownSections.map(renderGroup)}
 <footer>Practice the explanation as well as the code. Write your own tests before submitting.</footer></main></div></div></QuestionProgressProvider>;
}




