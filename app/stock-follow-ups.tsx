'use client';

import Question from './question-card';
import {blankProgress,type Progress} from './progress-state';
import {studyQuestions} from './study-catalog';
import {stockFollowUps} from './stock-follow-ups-data';

const catalog=new Map(studyQuestions('all').map(question=>[question.slug,question]));

export default function StockFollowUps({data,onSaved,onSubmitted}:{
  data:Record<string,Progress>;
  onSaved:(slug:string,progress:Progress)=>void;
  onSubmitted:(slug:string,progress:Progress)=>void;
}){
  return <section id="stock-follow-ups" className="stock-follow-ups" aria-labelledby="stock-follow-ups-heading">
    <h2 id="stock-follow-ups-heading">Suggested follow-ups</h2>
    <p className="stock-follow-ups-intro">Variations of Best Time to Buy and Sell Stock. Track each separately here; your progress is shared with Repeat, Done, and Daily points.</p>
    <ul aria-label="Stock follow-up problems">{stockFollowUps.map((followUp,index)=>{
      const question=catalog.get(followUp.slug)!;
      return <li key={question.slug}><div className="question-list">
        <Question q={{...question,order:index+1}} initial={data[question.slug]??blankProgress}
          idPrefix="stock-follow-up-" description={followUp.variation}
          showTopic={false} showRelevance={false} showBinarySearchTips={false}
          onSaved={progress=>onSaved(question.slug,progress)}
          onSubmitted={progress=>onSubmitted(question.slug,progress)}/>
      </div></li>;
    })}</ul>
  </section>;
}
