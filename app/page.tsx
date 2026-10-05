"use client";
import { useEffect, useRef, useState } from "react";
import { buckets, questions } from "./questions";
type Progress = {notes:string; completions:number; tries:number|null; repeat:boolean};
const blank:Progress={notes:"",completions:0,tries:null,repeat:false};
function Question({q,initial}:{q:typeof questions[number];initial:Progress}){
 const [value,setValue]=useState(initial),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
 const current=useRef(initial), queue=useRef(Promise.resolve()), sequence=useRef(0);
 function save(next:Progress){current.current=next;setValue(next);setStatus("Saving…");setBusy(true);const seq=++sequence.current;
 queue.current=queue.current.catch(()=>{}).then(async()=>{try{const res=await fetch('/api/progress',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:q.slug,...next})});if(!res.ok)throw Error();if(seq===sequence.current)setStatus('Saved');}catch{if(seq===sequence.current)setStatus('Could not save. Retry below.');}finally{if(seq===sequence.current)setBusy(false);}});}
 function draft(next:Progress){current.current=next;setValue(next);setStatus('Unsaved changes');}
 return <article className={value.completions>0?'question completed':'question'}>
 <div className="question-title"><span className="question-id">{String(q.order).padStart(2,'0')}</span><div><a href={'https://leetcode.com/problems/'+q.slug+'/'} target="_blank" rel="noopener noreferrer">{q.name}</a><p>{q.theme}</p></div></div>
 <div className="fields"><div><label>Completions</label><div className="counter"><button aria-label={'Decrease completions for '+q.name} disabled={busy||value.completions===0} onClick={()=>save({...current.current,completions:Math.max(0,current.current.completions-1)})}>−</button><output aria-label={'Completion count for '+q.name}>{value.completions}</output><button aria-label={'Increase completions for '+q.name} disabled={busy} onClick={()=>save({...current.current,completions:current.current.completions+1})}>+</button></div></div>
 <div><label htmlFor={'tries-'+q.slug}>Tries on last attempt</label><input id={'tries-'+q.slug} type="number" min="0" step="1" placeholder="—" value={value.tries??''} onChange={e=>draft({...current.current,tries:e.target.value===''?null:Math.max(0,Math.floor(Number(e.target.value)))})} onBlur={()=>save(current.current)}/></div>
 <label className="repeat"><input type="checkbox" checked={value.repeat} onChange={e=>save({...current.current,repeat:e.target.checked})}/> Should repeat</label></div>
 <div className="notes"><label htmlFor={'notes-'+q.slug}>Notes</label><textarea id={'notes-'+q.slug} placeholder="Approach, edge cases, what to revisit…" value={value.notes} onChange={e=>draft({...current.current,notes:e.target.value})} onBlur={()=>save(current.current)}/><div className="save-line"><span role="status">{status}</span><button className="save" onClick={()=>save(current.current)} disabled={busy}>{status.startsWith('Could')?'Retry save':'Save notes'}</button></div></div>
 </article>;
}
export default function Home(){const [data,setData]=useState<Record<string,Progress>|null>(null),[error,setError]=useState(false);
 async function load(){setError(false);try{const res=await fetch('/api/progress',{cache:'no-store'});if(!res.ok)throw Error();setData(await res.json());}catch{setError(true);}}
 useEffect(()=>{load();},[]);
 return <main><header><div className="brand"><span className="logo">U</span><span>INTERVIEW PRACTICE</span></div><h1>Upstart practice notebook</h1><p className="intro">62 questions, organized by relevance. Solve, reflect, repeat.</p><p className="context">Priorities follow the readable candidate reports, not a verified Upstart question bank. All question links open LeetCode.</p></header>
 <nav aria-label="Question buckets">{buckets.map((b,i)=><a key={i} href={'#bucket-'+i}><span>0{i+1}</span>{b.title}</a>)}</nav>
 <div className="storage-note">Notes and tries save when you leave the field or select Save notes. Counts and repeat selections save immediately.</div>
 {error?<div className="error" role="alert">Your progress couldn’t load. <button onClick={load}>Try again</button></div>:!data?<p role="status">Loading your notebook…</p>:buckets.map((b,i)=><section id={'bucket-'+i} key={i}><div className="section-heading"><span className="bucket-no">0{i+1}</span><div><h2>{b.title}</h2><p>{b.description}</p></div><span className="total">{questions.filter(q=>q.bucket===i).length} questions</span></div><div className="question-list">{questions.filter(q=>q.bucket===i).map(q=><Question key={q.slug} q={q} initial={data[q.slug]??blank}/>)}</div></section>)}
 <footer>Practice the explanation as well as the code. Write your own tests before submitting.</footer></main>;
}
