'use client';
import {useEffect,useRef,useState} from 'react';
import AskedDate from '../asked-date';
import type {PracticeCase,VariationExerciseDefinition} from './variation-definitions';

type Row={id:string;name:string;passed:boolean;actual:unknown;expected:unknown;error:string|null};
type Result={results:Row[];error:string|null;console:string;suite:'samples'|'all'};
type Progress={notes:string;completions:number;tries:number|null;repeat:boolean;submitted:boolean;retained:boolean};
const blank:Progress={notes:'',completions:0,tries:null,repeat:false,submitted:false,retained:false};
function preview(value:unknown){const text=JSON.stringify(value,null,2)??String(value);return text.length>900?text.slice(0,900)+'\n… (preview truncated; full inputs are in tests.json)':text;}

export default function VariationExercise({exercise}:{exercise:VariationExerciseDefinition}){
 const {question,problemId,starter,testCount,examples,arguments:argumentNames}=exercise;
 const assets='/practice/'+exercise.slug+'/';
 const draftKey='upstart:'+problemId+':python:v1';
 const [code,setCode]=useState(starter),[draftReady,setDraftReady]=useState(false),[draftStatus,setDraftStatus]=useState('');
 const [busy,setBusy]=useState(false),[runStatus,setRunStatus]=useState(''),[result,setResult]=useState<Result|null>(null),[testedCode,setTestedCode]=useState('');
 const [cases,setCases]=useState<PracticeCase[]>(examples),[progress,setProgress]=useState<Progress|null>(null),[loadError,setLoadError]=useState(false);
 const [notes,setNotes]=useState(''),[repeat,setRepeat]=useState(false),[tries,setTries]=useState(0),[submitting,setSubmitting]=useState(false),[submitted,setSubmitted]=useState(false),[submitStatus,setSubmitStatus]=useState('');
 const codeRef=useRef(starter),worker=useRef<Worker|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),runLock=useRef(false),submitLock=useRef(false),submissionId=useRef<string|null>(null);
 const fullPass=!!result&&result.suite==='all'&&!result.error&&result.results.length===testCount&&result.results.every(row=>row.passed)&&testedCode===code;
 const passed=result?.results.filter(row=>row.passed).length??0;

 async function loadProgress(){
  setLoadError(false);
  try{const response=await fetch('/api/progress',{cache:'no-store'});if(!response.ok)throw Error();const all=await response.json() as Record<string,Progress>;const saved=all[problemId]??blank;setProgress(saved);setNotes(saved.notes);setRepeat(saved.repeat);}
  catch{setLoadError(true);}
 }
 useEffect(()=>{
  try{const saved=localStorage.getItem(draftKey);if(saved!==null){setCode(saved);codeRef.current=saved;}}
  catch{setDraftStatus('Draft storage unavailable; download your code to keep a copy.');}
  setDraftReady(true);loadProgress();
  fetch(assets+'tests.json').then(response=>{if(!response.ok)throw Error();return response.json();}).then(data=>setCases((data as {cases:PracticeCase[]}).cases)).catch(()=>{});
  return()=>{worker.current?.terminate();if(timer.current)clearTimeout(timer.current);};
 },[]);
 useEffect(()=>{if(!draftReady)return;try{localStorage.setItem(draftKey,code);setDraftStatus('Draft saved in this browser.');}catch{setDraftStatus('Draft storage unavailable; download your code to keep a copy.');}},[code,draftReady,draftKey]);
 function clearTimer(){if(timer.current)clearTimeout(timer.current);timer.current=null;}
 function editCode(next:string){codeRef.current=next;setCode(next);}
 function stop(message='Run stopped. Edit your code and try again.'){
  clearTimer();worker.current?.terminate();worker.current=null;runLock.current=false;setBusy(false);setRunStatus(message);
 }
 function run(suite:'samples'|'all'){
  if(runLock.current||submitting)return;
  runLock.current=true;setBusy(true);setResult(null);setTestedCode('');setSubmitted(false);setSubmitStatus('');setTries(previous=>submitted?1:previous+1);
  const source=codeRef.current;
  setRunStatus(worker.current?'Running tests…':'Loading Python for the first run…');
  clearTimer();timer.current=setTimeout(()=>stop('Python could not load in time. Check your connection and retry, or use the downloadable practice pack.'),120000);
  try{
   const active=worker.current??new Worker('/practice/variation-worker.mjs',{type:'module'});worker.current=active;
   active.onmessage=({data}:{data:Result&{type:string}})=>{
    if(worker.current!==active)return;
    if(data.type==='running'){clearTimer();setRunStatus('Running tests…');timer.current=setTimeout(()=>stop('Run stopped after 20 seconds. Check for an endless loop or a slow approach, then retry.'),20000);return;}
    clearTimer();runLock.current=false;setBusy(false);
    if(data.type==='error'){active.terminate();worker.current=null;setRunStatus('Python could not run: '+data.error+' Retry, or download the practice pack.');return;}
    setResult(data);setTestedCode(source);setRunStatus(data.error?'Fix the Python error below.':data.results.filter(row=>row.passed).length+' / '+data.results.length+' tests passed.');
   };
   active.onerror=()=>stop('Python could not load. Check your connection and retry, or download the practice pack.');
   active.postMessage({code:source,suite,exercise:exercise.slug});
  }catch{stop('Python could not start in this browser. You can run the downloadable practice pack locally.');}
 }
 async function submit(){
  if(submitLock.current||!progress||!fullPass||submitted)return;
  submitLock.current=true;setSubmitting(true);setSubmitStatus('Saving your completed attempt…');submissionId.current??=crypto.randomUUID();
  try{
   const response=await fetch('/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:problemId,notes,completions:progress.completions,tries,repeat,submissionId:submissionId.current})});
   if(!response.ok)throw Error();const saved=await response.json() as {progress:Progress};setProgress(saved.progress);setSubmitted(true);submissionId.current=null;
   setSubmitStatus('Completed attempt saved to '+(repeat?'Repeat':'Done')+'. You are still on this page.');
  }catch{setSubmitStatus('Could not save your attempt. Your code and results are still here; retry submission.');}
  finally{submitLock.current=false;setSubmitting(false);}
 }
 function downloadCode(){const url=URL.createObjectURL(new Blob([code],{type:'text/x-python'}));const link=document.createElement('a');link.href=url;link.download='solution.py';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 const taskParagraphs=question.practicePrompt!.split('\n\n').filter(paragraph=>!paragraph.startsWith('Example ')&&!paragraph.startsWith('Test '));
 return <main className="exercise-page">
  <a className="exercise-back" href="/upstart#bucket-1">Back to Upstart prep</a>
  <header className="exercise-header"><div><div className="brand"><span className="logo">U</span><span>CUSTOM PRACTICE</span></div><h1>{question.name}</h1><p className="intro">Python · {question.difficulty}, estimated · {testCount} tests</p></div><a className="exercise-download" href={assets+'practice.zip'} download>Download practice pack</a></header>
  <AskedDate question={question}/>
  <div className="exercise-workspace">
   <section className="exercise-prompt" aria-labelledby="problem-heading"><h2 id="problem-heading">Your task</h2>
    {taskParagraphs.map((paragraph,index)=><p className="exercise-contract" key={index}>{paragraph}</p>)}
    <h3>Examples</h3>{examples.map((sample,index)=><div className="exercise-example" key={sample.id}><strong>Example {index+1}</strong><pre>{sample.args.map((value,i)=>argumentNames[i]+' = '+JSON.stringify(value)).join('\n')}{'\n'}returns {JSON.stringify(sample.expected)}</pre></div>)}
    <p className="exercise-provenance">Practice reconstruction inspired by the <a href={question.source!.url} target="_blank" rel="noopener noreferrer">reported Upstart task</a>. The precise rules and tests here were created for practice; they are not Upstart’s original test suite.</p>
    <p className="exercise-files"><a href={assets+'tests.json'} download>Test data</a><a href="/practice/variation-runner.py" download="run_tests.py">Python test runner</a><a href={assets+'README.md'} download>Local instructions</a></p>
    {question.leetcodeFoundationSlug&&<p><a href={'https://leetcode.com/problems/'+question.leetcodeFoundationSlug+'/'} target="_blank" rel="noopener noreferrer">LeetCode foundation</a></p>}
   </section>
   <div className="exercise-code-column">
    <section className="exercise-editor" aria-labelledby="editor-heading"><div className="exercise-panel-heading"><h2 id="editor-heading">Your solution</h2><button className="save" onClick={downloadCode}>Download code</button></div>
     <p className="exercise-mobile-prompt-link"><a href="#problem-heading">Read problem and examples</a></p>
     <label className="sr-only" htmlFor="python-code">Python solution</label>
     <textarea id="python-code" className="code-editor" spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap="off" value={code} disabled={!draftReady||busy||submitting}
      onChange={event=>editCode(event.target.value)} onKeyDown={event=>{if(event.key==='Tab'){event.preventDefault();const input=event.currentTarget,start=input.selectionStart,end=input.selectionEnd;editCode(code.slice(0,start)+'    '+code.slice(end));requestAnimationFrame(()=>{input.selectionStart=input.selectionEnd=start+4;});}}}/>
     <p className="exercise-draft">{draftStatus} Python runs in your browser; the first run needs an internet connection.</p>
     <div className="exercise-run-actions"><button className="save" disabled={!draftReady||busy||submitting} onClick={()=>run('samples')}>Run examples</button><button className="submit" disabled={!draftReady||busy||submitting} onClick={()=>run('all')}>Run all {testCount} tests</button>{busy&&<button className="save" onClick={()=>stop()}>Stop run</button>}</div>
     <p className="exercise-run-status" role="status">{runStatus}{result&&testedCode!==code?' Code changed; run the tests again.':''}</p>
    </section>
    {result&&<section className="exercise-results" aria-labelledby="results-heading"><h2 id="results-heading">{result.error?'Python error':passed+' / '+result.results.length+' tests passed'}</h2>
     {result.error&&<pre className="test-error" role="alert">{result.error}</pre>}
     {result.results.map(row=>{const input=cases.find(item=>item.id===row.id);return <details className={'test-result '+(row.passed?'test-pass':'test-fail')} key={row.id} open={!row.passed}><summary><span>{row.passed?'PASS':'FAIL'}</span>{row.name}</summary>{input&&<><h3>Input</h3><pre>{preview(Object.fromEntries(input.args.map((value,index)=>[argumentNames[index],value])))}</pre></>}<h3>Expected</h3><pre>{preview(row.expected)}</pre><h3>Your return value</h3><pre>{preview(row.actual)}</pre>{row.error&&<pre className="test-error">{row.error}</pre>}</details>;})}
     {result.console&&<details className="test-console"><summary>Your printed output</summary><pre>{result.console}</pre></details>}
    </section>}
    <section className="exercise-completion" aria-labelledby="completion-heading"><div className="exercise-panel-heading"><h2 id="completion-heading">Complete this attempt</h2>{progress&&<span>{progress.completions} completion{progress.completions===1?'':'s'}</span>}</div>
     {loadError?<p className="error" role="alert">Your progress couldn’t load. <button className="save" onClick={loadProgress}>Try again</button></p>:!progress?<p role="status">Loading your tracker progress…</p>:<>
      <div className="exercise-attempt-fields"><label htmlFor="attempt-tries">Tries this attempt<input id="attempt-tries" type="number" min="0" step="1" value={tries} disabled={submitting} onChange={event=>setTries(Math.max(0,Math.floor(Number(event.target.value))))}/></label><label className="repeat"><input type="checkbox" checked={repeat} disabled={submitting} onChange={event=>setRepeat(event.target.checked)}/> Should repeat</label></div>
      <label htmlFor="attempt-notes">Notes</label><textarea id="attempt-notes" placeholder="Approach, edge cases, what to revisit…" maxLength={50000} value={notes} disabled={submitting} onChange={event=>setNotes(event.target.value)}/>
      <p className="exercise-draft">Notes, tries, and repeat choice save when you submit. Code stays in this browser.</p>
      <button className="submit" disabled={!fullPass||busy||submitting||submitted} onClick={submit}>{submitting?'Saving…':submitted?'Attempt submitted':'Submit completed attempt'}</button>
      <p className="exercise-draft">{submitted?'Run the tests again for another attempt.':fullPass?'Adds 1 completion and moves this question to '+(repeat?'Repeat':'Done')+'.':'Pass the full suite with your current code to submit.'} Submission keeps you on this page.</p>
      <p className="exercise-submit-status" role="status">{submitStatus}</p>{submitted&&<a href={repeat?'/repeat':'/done'}>View {repeat?'Repeat':'Done'} when you’re ready</a>}
     </>}
    </section>
   </div>
  </div>
 </main>;
}
