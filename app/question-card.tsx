"use client";

import {createContext,useContext,useRef,useSyncExternalStore,type ReactNode} from 'react';
import {isCurrentQuestion} from './questions';
import {type StudyQuestion} from './study-catalog';
import {isCompleted,type Progress} from './progress-state';
import {createQuestionProgress} from './question-progress';
import AskedDate from './asked-date';

type Registry=Map<string,ReturnType<typeof createQuestionProgress>>;
const ProgressRegistry=createContext<Registry|null>(null);

export function QuestionProgressProvider({children}:{children:ReactNode}) {
  const registry=useRef<Registry>(new Map());
  return <ProgressRegistry.Provider value={registry.current}>{children}</ProgressRegistry.Provider>;
}

export default function Question({q,initial,onSubmitted,onSaved,variationHref,idPrefix=''}:{
  q:StudyQuestion;
  initial:Progress;
  onSubmitted:(progress:Progress)=>void;
  onSaved:(progress:Progress)=>void;
  variationHref?:string;
  idPrefix?:string;
}) {
  const registry=useContext(ProgressRegistry);
  if(!registry)throw Error('Question progress provider is missing');
  let controller=registry.get(q.slug);
  if(!controller){controller=createQuestionProgress(q.slug,initial,{onSaved,onSubmitted});registry.set(q.slug,controller);}
  controller.setCallbacks({onSaved,onSubmitted});
  const {value,status,busy,submitting,submitError}=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  const current=()=>controller.getSnapshot().value;
  const save=()=>controller.save(current());
  const triesId=idPrefix+'tries-'+q.slug,notesId=idPrefix+'notes-'+q.slug;

  return <article id={idPrefix+'question-'+q.slug} data-question-slug={q.slug} className={isCompleted(value)?'question completed':'question'}>
    <div className="question-title"><span className="question-id">{String(q.order).padStart(2,'0')}</span><div>
      {q.kind==='custom'?<span className="custom-title">{q.name}</span>:<a href={'https://leetcode.com/problems/'+q.slug+'/'} target="_blank" rel="noopener noreferrer">{q.name}</a>}
      <p><span className={'difficulty '+q.difficulty.toLowerCase()}>{q.difficulty}{q.kind==='custom'?' · estimated':''}</span> {q.theme}</p>
      <p className="question-source"><span>{q.neetcode150?'NeetCode 150':q.grind75?'Grind 75':q.kind==='custom'?'Custom drill':'Extra'}</span>
        {isCompleted(value)&&<span className="completion-badge">Completed{value.repeat?' · repeat':''}</span>}
        {q.upstartTagged&&<span className="tagged">Company-list match</span>}{q.matchLabel&&<span className="reported">{q.matchLabel}</span>}</p>
      {q.reportedTask&&<p className="reported-task">Reported: {q.reportedTask}</p>}{q.relevance&&<p className="relevance">{q.relevance}</p>}
      {!q.neetcode150&&<AskedDate question={q}/>}
      {q.source&&<p className="evidence"><a href={q.source.url} target="_blank" rel="noopener noreferrer">{q.source.label}</a> · {q.source.date}{q.source.edited?' · supplementary evidence':''}</p>}
      {!q.neetcode150&&!isCurrentQuestion(q.slug)&&<p className="retained">Kept because you completed it</p>}
    </div></div>
    <div className="fields"><div><label>Completions</label><div className="counter"><output aria-label={'Completion count for '+q.name}>{value.completions}</output></div></div>
      <div><label htmlFor={triesId}>Tries on last attempt</label><input id={triesId} type="number" disabled={submitting} min="0" step="1" placeholder="—" value={value.tries??''}
        onChange={event=>controller.draft({...current(),tries:event.target.value===''?null:Math.max(0,Math.floor(Number(event.target.value)))})} onBlur={save}/></div>
      <label className="repeat"><input type="checkbox" disabled={submitting} checked={value.repeat} onChange={event=>controller.save({...current(),repeat:event.target.checked})}/> Should repeat</label>
    </div>
    {variationHref&&<p className="evidence"><a href={variationHref}>Open standalone reported variation</a> · tracked separately</p>}
    {q.leetcodeFoundationSlug&&<p className="evidence"><a href={'https://leetcode.com/problems/'+q.leetcodeFoundationSlug+'/'} target="_blank" rel="noopener noreferrer">LeetCode foundation</a></p>}
    {q.practicePrompt&&<details className="practice-prompt" open={q.kind==='custom'}><summary>{q.kind==='custom'?'Practice prompt':'Practice the reported variation'}</summary><p>{q.practicePrompt}</p>
      {(q.exercisePath||q.slug==='upstart-anagram-sentence')&&<p><a className="exercise-start" href={q.exercisePath??'/practice/anagram-sentence'}>{q.exercisePath?'Solve with Python and 20 tests':'Solve with Python and 24 tests'}</a></p>}
    </details>}
    <div className="notes"><label htmlFor={notesId}>Notes</label><textarea id={notesId} disabled={submitting} placeholder="Approach, edge cases, what to revisit…" value={value.notes}
      onChange={event=>controller.draft({...current(),notes:event.target.value})} onBlur={save}/>
      <div className="save-line"><span role="status">{status}</span>
        <button className="save" onPointerDown={event=>event.preventDefault()} onClick={save} disabled={busy||submitting}>Save notes</button>
        <button className="submit" aria-label={(submitError?'Retry submission for ':'Submit completed attempt for ')+q.name} onPointerDown={event=>event.preventDefault()} onClick={controller.submit} disabled={submitting}>
          {submitting?'Submitting…':submitError?'Retry submission':'Submit completed attempt'}</button>
      </div>
      <p className="submit-hint">Adds 1 completion and moves to {value.repeat?'Repeat':'Done'}.</p>
    </div>
  </article>;
}
