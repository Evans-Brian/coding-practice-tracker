"use client";

import {useState,type ReactNode} from 'react';
import {type StudyQuestion} from './study-catalog';

type DifficultyFilter = 'easy' | 'easy-medium' | 'medium' | 'hard';

export default function RandomQuestion({questions,renderQuestion}:{questions:StudyQuestion[]|null;renderQuestion:(question:StudyQuestion)=>ReactNode}) {
  const [difficulty,setDifficulty]=useState<DifficultyFilter>('easy-medium');
  const [selectedSlug,setSelectedSlug]=useState<string|null>(null);
  const choices=(questions??[]).filter(q=>difficulty==='easy-medium'
    ? q.difficulty==='Easy'||q.difficulty==='Medium'
    : q.difficulty.toLowerCase()===difficulty);
  const selected=choices.find(q=>q.slug===selectedSlug);

  return <section className="random-question" aria-labelledby="random-question-heading">
    <div className="random-question-heading">
      <h2 id="random-question-heading">Random question</h2>
      <p>Pick an unfinished question from your prioritized practice list.</p>
    </div>
    <div className="random-question-controls">
      <label htmlFor="random-difficulty">Difficulty
        <select id="random-difficulty" value={difficulty} disabled={!questions}
          onChange={event=>{setDifficulty(event.target.value as DifficultyFilter);setSelectedSlug(null);}}>
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
        :questions?<span role="status">{choices.length?choices.length+' unfinished questions available.':'No unfinished questions match this difficulty.'}</span>
        :<span role="status">Loading your progress…</span>}
    </div>
  </section>;
}
