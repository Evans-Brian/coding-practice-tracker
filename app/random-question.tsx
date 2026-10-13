"use client";

import {useState} from 'react';
import {type StudyQuestion} from './study-catalog';

type DifficultyFilter = 'easy' | 'easy-medium' | 'medium' | 'hard';

export default function RandomQuestion({questions}:{questions:StudyQuestion[]|null}) {
  const [difficulty,setDifficulty]=useState<DifficultyFilter>('easy-medium');
  const [selectedSlug,setSelectedSlug]=useState<string|null>(null);
  const choices=(questions??[]).filter(q=>difficulty==='easy-medium'
    ? q.difficulty==='Easy'||q.difficulty==='Medium'
    : q.difficulty.toLowerCase()===difficulty);
  const selected=choices.find(q=>q.slug===selectedSlug);

  return <section className="random-question" aria-labelledby="random-question-heading">
    <div className="random-question-heading">
      <h2 id="random-question-heading">Random question</h2>
      <p>Pick from your unfinished NeetCode 150 questions, including Not Prioritized.</p>
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
    <div className="random-question-result" role="status" aria-live="polite">
      {selected?<><a href={'https://leetcode.com/problems/'+selected.slug+'/'} target="_blank" rel="noopener noreferrer">{selected.name}</a>
        <span className={'difficulty '+selected.difficulty.toLowerCase()}>{selected.difficulty}</span>
        <a className="random-question-jump" href={'#question-'+selected.slug}>View in notebook</a></>
        :questions?<span>{choices.length?choices.length+' unfinished questions available.':'No unfinished questions match this difficulty.'}</span>
        :<span>Loading your progress…</span>}
    </div>
  </section>;
}
