"use client";

import {useState,type ReactNode} from 'react';
import {type StudyQuestion} from './study-catalog';

type DifficultyFilter = 'any' | 'easy' | 'easy-medium' | 'medium' | 'hard';

export default function RandomQuestion({questions,renderQuestion,mode='practice'}:{questions:StudyQuestion[]|null;renderQuestion:(question:StudyQuestion)=>ReactNode;mode?:'practice'|'repeat'}) {
  const [difficulty,setDifficulty]=useState<DifficultyFilter>('easy-medium');
  const [selectedSlug,setSelectedSlug]=useState<string|null>(null);
  const choices=(questions??[]).filter(q=>difficulty==='any'||(difficulty==='easy-medium'
    ? q.difficulty==='Easy'||q.difficulty==='Medium'
    : q.difficulty.toLowerCase()===difficulty));
  const selected=choices.find(q=>q.slug===selectedSlug);
  const questionLabel=mode==='repeat'?'repeat':'unfinished';

  return <section className="random-question" aria-labelledby="random-question-heading">
    <div className="random-question-heading">
      <h2 id="random-question-heading">Random question</h2>
      <p>{mode==='repeat'?'Pick a question from your Repeat list.':'Pick an unfinished question from your prioritized practice list.'}</p>
    </div>
    <div className="random-question-controls">
      <label htmlFor="random-difficulty">Difficulty
        <select id="random-difficulty" value={difficulty} disabled={!questions}
          onChange={event=>{setDifficulty(event.target.value as DifficultyFilter);setSelectedSlug(null);}}>
          <option value="any">Any difficulty</option>
          <option value="easy">Easy</option>
          <option value="easy-medium">Easy–Medium</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>
      <button className="submit" disabled={!questions||choices.length===0}
        onClick={()=>setSelectedSlug(choices[Math.floor(Math.random()*choices.length)].slug)}>Pick a question</button>
    </div>
    <div className="random-question-result">
      {selected?<><span className="random-question-announcement" role="status">Selected {selected.name}.</span><div className="question-list random-question-card">{renderQuestion(selected)}</div></>
        :questions?<span role="status">{choices.length?choices.length+' '+questionLabel+' questions available.':'No '+questionLabel+' questions match this difficulty.'}</span>
        :<span role="status">Loading your progress…</span>}
    </div>
  </section>;
}
