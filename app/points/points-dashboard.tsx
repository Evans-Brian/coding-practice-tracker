'use client';
import {useEffect,useState} from 'react';
import StudyHeader from '../study-header';
import DifficultyLabel from '../difficulty-label';
import type {PointsDashboardData} from '../points-model';

function dateLabel(day:string,short=false){return new Intl.DateTimeFormat('en-US',{month:short?'short':'long',day:'numeric',...(short?{}:{year:'numeric'}),timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));}
const number=(value:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(value);

export default function PointsDashboard(){
  const [data,setData]=useState<PointsDashboardData|null>(null),[error,setError]=useState(false);
  async function load(){setError(false);try{const response=await fetch('/api/points',{cache:'no-store'});if(!response.ok)throw Error();setData(await response.json());}catch{setError(true);}}
  useEffect(()=>{load();},[]);
  const max=Math.max(1,...(data?.chart.map(day=>day.points)??[]));
  return <div className="study-app"><StudyHeader active="points" counts={data?.navigation??null}/>
    <main className="points-main">
      <header className="points-heading"><div><h1>Daily points</h1><p>Points from completed practice, grouped by day.</p></div>
        <div className="points-weights" aria-label="Points by difficulty"><span><DifficultyLabel difficulty="Easy"/>0.5 points</span><span><DifficultyLabel difficulty="Medium"/>1 point</span><span><DifficultyLabel difficulty="Hard"/>2 points</span></div>
      </header>
      <p className="points-rule">One score per problem per day. Repeat it on a later day to earn points again. Days use New York time.</p>
      {error?<div className="error" role="alert">Your points couldn’t load. <button className="save" onClick={load}>Try again</button></div>:!data?<p role="status">Loading your points…</p>:<>
        {!data.firstDay&&<p className="points-tracking-note">Daily tracking starts with your next submitted completion. Earlier attempts have no saved date.</p>}
        <dl className="points-summary" aria-label="Points summary">
          <div><dt>Today</dt><dd>{number(data.todayPoints)}<span>points</span></dd><p>{data.todayQuestions} problem{data.todayQuestions===1?'':'s'}{data.today?' · '+dateLabel(data.today,true):''}</p></div>
          <div><dt>Last 7 days</dt><dd>{number(data.weekPoints)}<span>points</span></dd><p>Including today</p></div>
          <div><dt>Total recorded</dt><dd>{number(data.totalPoints)}<span>points</span></dd><p>{data.firstDay?'Since '+dateLabel(data.firstDay,true):'Starts with your next completion'}</p></div>
        </dl>
        <section className="points-panel" aria-labelledby="points-activity-heading"><div className="points-panel-heading"><h2 id="points-activity-heading">Recent activity</h2><span>Up to 14 days</span></div>
          {data.chart.length?<div className="points-chart" role="img" aria-label={'Daily points. '+data.chart.map(day=>dateLabel(day.day,true)+': '+number(day.points)+' points').join('; ')}>{data.chart.map(day=><div className={'points-chart-column'+(day.day===data.today?' is-today':'')} key={day.day} title={dateLabel(day.day)+': '+number(day.points)+' points'}><span className="points-chart-value">{number(day.points)}</span><div className="points-chart-track"><span className={day.points?'points-chart-bar':'points-chart-bar is-zero'} style={{height:Math.max(2,day.points/max*100)+'%'}}/></div><span className="points-chart-date">{dateLabel(day.day,true)}</span></div>)}</div>:<div className="points-empty"><p>Your next completed attempt starts this chart.</p><a href="/">Choose a practice question</a></div>}
        </section>
        <section className="points-panel" aria-labelledby="points-history-heading"><div className="points-panel-heading"><h2 id="points-history-heading">Daily breakdown</h2><span>Most recent first</span></div>
          {data.days.length?<div className="points-table-scroll" role="region" aria-label="Daily points breakdown" tabIndex={0}><table className="points-table"><thead><tr><th scope="col">Day</th><th scope="col"><DifficultyLabel difficulty="Easy"/></th><th scope="col"><DifficultyLabel difficulty="Medium"/></th><th scope="col"><DifficultyLabel difficulty="Hard"/></th><th scope="col">Problems</th><th scope="col">Points</th></tr></thead><tbody>{data.days.map(day=><tr key={day.day}><th scope="row">{dateLabel(day.day)}{day.day===data.today&&<span className="points-today-tag">Today</span>}</th><td>{day.easy}</td><td>{day.medium}</td><td>{day.hard}</td><td>{day.questions}</td><td className="points-table-total">{number(day.points)}</td></tr>)}</tbody></table></div>:<p className="points-empty-history">No dated completions yet. Submit a completed attempt to add your first day.</p>}
          <p className="points-table-note">Problem counts include each problem once per day, even if you submit it several times.</p>
        </section>
        {data.undated.attempts>0&&<aside className="points-undated" aria-label="Earlier completion history"><div><strong>Earlier completions</strong><p>{number(data.undated.attempts)} completed attempts across {number(data.undated.questions)} problems.</p></div><p>Their completion dates weren’t recorded, so they aren’t included in daily points. Your notes and completion counts are still in Repeat and Done.</p></aside>}
      </>}
    </main>
  </div>;
}
