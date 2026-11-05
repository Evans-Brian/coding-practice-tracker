'use client';
import {useEffect,useMemo,useRef,useState,type FormEvent} from 'react';
import StudyHeader from '../study-header';
import DifficultyLabel from '../difficulty-label';
import {shiftDay,type DayPoints,type PointsDashboardData} from '../points-model';
import type {StudyCreditInput} from '../study-credit-input';

const number=(value:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(value);
function dateLabel(day:string,short=false){return new Intl.DateTimeFormat('en-US',{month:short?'short':'long',day:'numeric',...(short?{}:{year:'numeric'}),timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));}
function monthLabel(month:string){return new Intl.DateTimeFormat('en-US',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-01T12:00:00Z'));}
const emptyDay=(day:string):DayPoints=>({day,points:0,extraPoints:0,extras:[],questions:0,attempts:0,easy:0,medium:0,hard:0,problems:[],leetcodeQuestions:0,trackerQuestions:0,overlapQuestions:0});
type Range='30'|'90'|'all';
type TrendPoint={key:string;label:string;points:number;easy:number;medium:number;hard:number;extra:number;cumulative:number};

function HistoryViews({data}:{data:PointsDashboardData}){
  const [range,setRange]=useState<Range>('all'),[cumulative,setCumulative]=useState(true);
  const [selectedYear,setSelectedYear]=useState(data.today.slice(0,4)),[selectedDay,setSelectedDay]=useState(data.today);
  const [activeOnly,setActiveOnly]=useState(true),[page,setPage]=useState(0);
  const byDay=useMemo(()=>new Map(data.days.map(day=>[day.day,day])),[data.days]);
  const firstYear=Number(data.firstDay?.slice(0,4)??data.today.slice(0,4));
  const years=Array.from({length:Number(data.today.slice(0,4))-firstYear+1},(_,i)=>String(Number(data.today.slice(0,4))-i));
  const year=years.includes(selectedYear)?selectedYear:years[0];
  const yearDays=data.days.filter(day=>day.day.startsWith(year));
  const yearPoints=yearDays.reduce((sum,day)=>sum+day.points,0),yearActive=yearDays.filter(day=>day.points>0).length;
  const cells=useMemo(()=>{
    const first=year+'-01-01',offset=new Date(first+'T12:00:00Z').getUTCDay();
    const result:(string|null)[]=Array(offset).fill(null);
    for(let day=first;day.startsWith(year);day=shiftDay(day,1))result.push(day);
    while(result.length%7)result.push(null);
    return result;
  },[year]);
  const calendarMonths=cells.map((day,index)=>day?.endsWith('-01')?{label:new Intl.DateTimeFormat('en-US',{month:'short',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z')),column:Math.floor(index/7)+1}:null).filter((month):month is {label:string;column:number}=>!!month);
  const selection=byDay.get(selectedDay)??emptyDay(selectedDay);
  const filteredDays=useMemo(()=>data.days.filter(day=>(range==='all'||day.day>=shiftDay(data.today,-Number(range)+1))&&(!activeOnly||day.points>0)),[data.days,data.today,range,activeOnly]);
  const pageCount=Math.max(1,Math.ceil(filteredDays.length/20)),currentPage=Math.min(page,pageCount-1);
  const trend=useMemo(()=>{
    const days=[...data.days].reverse().filter(day=>range==='all'||day.day>=shiftDay(data.today,-Number(range)+1));
    const monthly=days.length>120,groups=new Map<string,TrendPoint>();
    for(const day of days){
      const key=monthly?day.day.slice(0,7):day.day;
      const group=groups.get(key)??{key,label:monthly?monthLabel(key):dateLabel(key,true),points:0,easy:0,medium:0,hard:0,extra:0,cumulative:0};
      group.points+=day.points;
      for(const problem of day.problems){
        if(problem.difficulty==='Easy')group.easy+=problem.points;
        else if(problem.difficulty==='Medium')group.medium+=problem.points;
        else if(problem.difficulty==='Hard')group.hard+=problem.points;
      }
      group.extra+=day.extraPoints;groups.set(key,group);
    }
    let total=0;return {monthly,points:[...groups.values()].map(point=>({...point,cumulative:total+=point.points})),days};
  },[data.days,data.today,range]);
  const trendTotal=trend.days.reduce((sum,day)=>sum+day.points,0),trendMax=Math.max(1,...trend.points.map(point=>cumulative?point.cumulative:point.points));
  const x=(i:number)=>42+(trend.points.length===1?460:i/(trend.points.length-1)*920);
  const trendLine=trend.points.map((point,i)=>`${x(i)},${180-point.cumulative/trendMax*150}`).join(' ');
  function chooseRange(value:Range){setRange(value);setPage(0);}
  return <>
    <section className="points-panel points-calendar-panel" aria-labelledby="points-calendar-heading">
      <div className="points-panel-heading"><div><h2 id="points-calendar-heading">Practice calendar</h2><p>{number(yearPoints)} points on {yearActive} active days in {year}</p></div><label className="points-select-label">Year<select aria-label="Calendar year" value={year} onChange={event=>{setSelectedYear(event.target.value);setSelectedDay(data.days.find(day=>day.day.startsWith(event.target.value)&&day.points>0)?.day??event.target.value+'-01-01');}}>{years.map(value=><option key={value}>{value}</option>)}</select></label></div>
      <div className="points-calendar-scroll" tabIndex={0} role="region" aria-label={'Daily practice calendar for '+year}>
        <div className="points-calendar-months" style={{gridTemplateColumns:`repeat(${cells.length/7},14px)`}}>{calendarMonths.map(month=><span key={month.label} style={{gridColumn:month.column}}>{month.label}</span>)}</div>
        <div className="points-calendar-body"><div className="points-calendar-weekdays" aria-hidden="true">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=><span key={day}>{day}</span>)}</div><div className="points-calendar-grid" style={{gridTemplateColumns:`repeat(${cells.length/7},14px)`}}>{cells.map((day,index)=>{
          if(!day)return <span className="points-calendar-blank" key={'blank-'+index}/>;
          const value=byDay.get(day),points=value?.points??0,disabled=day>data.today||!!data.firstDay&&day<data.firstDay;
          const level=points===0?0:points<3?1:points<6?2:points<10?3:4;
          const description=dateLabel(day)+': '+number(points)+' points, '+(value?.questions??0)+' problems';
          return <button type="button" key={day} disabled={disabled} className={'points-calendar-day heat-'+level+(day===data.today?' is-today':'')} aria-label={description} title={description} aria-pressed={selectedDay===day} onClick={()=>setSelectedDay(day)}/>;
        })}</div></div>
      </div>
      <div className="points-calendar-footer"><span>{data.days.filter(day=>day.points>0).length} active days in your recorded history</span><div className="points-heat-legend" aria-label="Daily points intensity: 0, above 0 and under 3, 3 to under 6, 6 to under 10, 10 or more"><span>Fewer points</span>{[0,1,2,3,4].map(level=><i key={level} className={'heat-'+level}/>)}<span>More</span></div></div>
    </section>
    <section className="points-panel points-day-detail" aria-labelledby="points-day-heading">
      <div className="points-panel-heading"><div><h2 id="points-day-heading">{dateLabel(selectedDay)}{selectedDay===data.today?' · Today':''}</h2><p>Select a calendar day or a date in the breakdown to see its work.</p></div><strong className="points-selected-total">{number(selection.points)} <span>points</span></strong></div>
      {selection.problems.length>0?<ul className="points-problems">{selection.problems.map(problem=><li key={problem.id}><div><a href={problem.href} target="_blank" rel="noopener noreferrer">{problem.name}</a><span className="points-problem-meta"><DifficultyLabel difficulty={problem.difficulty}/><span>{problem.sources.length===2?'LeetCode + tracker':problem.sources.includes('leetcode')?'LeetCode':'Tracker'}</span></span></div><strong>+{number(problem.points)}</strong></li>)}</ul>:<p className="points-empty-history">No completed problems recorded for this day.</p>}
      {selection.extras.length>0&&<ul className="points-day-extras">{selection.extras.map(entry=><li key={entry.id}><span>{entry.note||'Extra study'}</span><strong>+{number(entry.pointUnits/2)}</strong></li>)}</ul>}
      {selection.overlapQuestions>0&&<p className="points-table-note">{selection.overlapQuestions} problem{selection.overlapQuestions===1?' is':'s are'} recorded in both sources and credited once.</p>}
    </section>
    <section className="points-panel points-trend-panel" aria-labelledby="points-activity-heading">
      <div className="points-panel-heading"><div><h2 id="points-activity-heading">Points over time</h2><p>{number(trendTotal)} points{trend.days.length?' from '+dateLabel(trend.days[0].day)+' to '+dateLabel(trend.days.at(-1)!.day):''}</p></div><div className="points-range" aria-label="History range">{(['30','90','all'] as const).map(value=><button type="button" key={value} aria-pressed={range===value} onClick={()=>chooseRange(value)}>{value==='all'?(data.history?.complete?'All time':'Recorded history'):value+' days'}</button>)}</div></div>
      <div className="points-trend-toolbar"><label><input type="checkbox" checked={cumulative} onChange={event=>setCumulative(event.target.checked)}/>Cumulative points</label><span>{cumulative?'Running total within this range':trend.monthly?'Monthly totals':'Daily totals'}</span></div>
      {trend.points.length?cumulative?<div className="points-line-chart"><svg viewBox="0 0 1000 220" role="img" aria-label={'Cumulative points within selected range: '+number(trendTotal)+' points.'}><line className="points-line-grid" x1="42" x2="962" y1="180" y2="180"/><line className="points-line-grid" x1="42" x2="962" y1="105" y2="105"/><line className="points-line-grid" x1="42" x2="962" y1="30" y2="30"/><text x="32" y="184" textAnchor="end">0</text><text x="32" y="109" textAnchor="end">{number(trendMax/2)}</text><text x="32" y="34" textAnchor="end">{number(trendMax)}</text><polyline className="points-line" points={trendLine}/>{trend.points.map((point,i)=><circle key={point.key} cx={x(i)} cy={180-point.cumulative/trendMax*150} r={trend.points.length<35?3:1.5}><title>{point.label+': '+number(point.cumulative)+' cumulative points'}</title></circle>)}<text x="42" y="211">{trend.points[0].label}</text><text x="962" y="211" textAnchor="end">{trend.points.at(-1)!.label}</text></svg></div>:<div className="points-chart" role="img" aria-label={(trend.monthly?'Monthly':'Daily')+' points by difficulty. '+trend.points.map(point=>point.label+': '+number(point.points)+' points').join('; ')}>{trend.points.map(point=><div className="points-chart-column" key={point.key} title={point.label+': '+number(point.points)+' points'}><span className="points-chart-value">{number(point.points)}</span><div className="points-chart-track"><div className="points-stacked-bar" style={{height:Math.max(2,point.points/trendMax*100)+'%'}}>{point.points>0?(['easy','medium','hard','extra'] as const).map(kind=>point[kind]>0&&<span key={kind} className={'points-segment '+kind} style={{flex:point[kind]}}/>):<span className="points-segment zero"/>}</div></div><span className="points-chart-date">{point.label}</span></div>)}</div>:<div className="points-empty"><p>A completed attempt or extra study entry starts this chart.</p><a href="/">Choose a practice question</a></div>}
      {!cumulative&&<div className="points-trend-legend"><span><i className="easy"/>Easy</span><span><i className="medium"/>Medium</span><span><i className="hard"/>Hard</span><span><i className="extra"/>Extra study</span></div>}
    </section>
    <section className="points-panel" aria-labelledby="points-history-heading"><div className="points-panel-heading"><div><h2 id="points-history-heading">Daily breakdown</h2><p>Most recent first · Uses the range above</p></div><label className="points-active-filter"><input type="checkbox" checked={activeOnly} onChange={event=>{setActiveOnly(event.target.checked);setPage(0);}}/>Active days only</label></div>
      {filteredDays.length?<><div className="points-table-scroll" role="region" aria-label="Daily points breakdown" tabIndex={0}><table className="points-table"><thead><tr><th scope="col">Day</th><th scope="col"><DifficultyLabel difficulty="Easy"/></th><th scope="col"><DifficultyLabel difficulty="Medium"/></th><th scope="col"><DifficultyLabel difficulty="Hard"/></th><th scope="col">Problems</th><th scope="col">Extra</th><th scope="col">Points</th></tr></thead><tbody>{filteredDays.slice(currentPage*20,(currentPage+1)*20).map(day=><tr key={day.day} className={selectedDay===day.day?'is-selected':''}><th scope="row"><button type="button" aria-pressed={selectedDay===day.day} onClick={()=>{setSelectedDay(day.day);setSelectedYear(day.day.slice(0,4));}}>{dateLabel(day.day)}</button>{day.day===data.today&&<span className="points-today-tag">Today</span>}</th><td>{day.easy}</td><td>{day.medium}</td><td>{day.hard}</td><td>{day.questions}</td><td>{number(day.extraPoints)}</td><td className="points-table-total">{number(day.points)}</td></tr>)}</tbody></table></div><div className="points-pagination"><span>{currentPage*20+1}–{Math.min((currentPage+1)*20,filteredDays.length)} of {filteredDays.length} days</span><div><button className="save" type="button" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Previous</button><button className="save" type="button" disabled={currentPage+1===pageCount} onClick={()=>setPage(currentPage+1)}>Next</button></div></div></>:<p className="points-empty-history">No study entries in this range. Choose {data.history?.complete?'All time':'Recorded history'} to see earlier activity.</p>}
      <p className="points-table-note">Each problem earns points once per day, even when it appears in both LeetCode and the tracker. Extra study adds points without counting as a problem.</p>
    </section>
  </>;
}

export default function PointsDashboard(){
  const [data,setData]=useState<PointsDashboardData|null>(null),[error,setError]=useState(false);
  const [pointUnits,setPointUnits]=useState<1|2>(1),[note,setNote]=useState(''),[busy,setBusy]=useState<string|null>(null),[actionError,setActionError]=useState(''),[notice,setNotice]=useState('');
  const pendingCredit=useRef<StudyCreditInput|null>(null);
  async function load(){setError(false);try{const response=await fetch('/api/points',{cache:'no-store'});if(!response.ok)throw Error();setData(await response.json());}catch{setError(true);}}
  useEffect(()=>{load();},[]);
  async function changePoints(method:'POST'|'DELETE',body:StudyCreditInput|{id:string}){
    const response=await fetch('/api/points',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result=await response.json() as PointsDashboardData&{error?:string};if(!response.ok)throw Error(result.error??'Could not update extra points. Try again.');setData(result);
  }
  async function addExtra(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;setBusy('add');setActionError('');setNotice('');
    const entry=pendingCredit.current??{id:crypto.randomUUID(),pointUnits,note};pendingCredit.current=entry;
    try{await changePoints('POST',entry);pendingCredit.current=null;setNote('');setNotice('Added '+number(entry.pointUnits/2)+' extra study point'+(entry.pointUnits===1?'s':'')+' for today.');}
    catch(error){setActionError(error instanceof Error?error.message:'Could not save extra points. Try again.');}finally{setBusy(null);}
  }
  async function removeExtra(id:string){
    if(busy)return;setBusy(id);setActionError('');setNotice('');
    try{await changePoints('DELETE',{id});setNotice('Extra study points removed.');}
    catch(error){setActionError(error instanceof Error?error.message:'Could not remove extra points. Try again.');}finally{setBusy(null);}
  }
  return <div className="study-app"><StudyHeader active="points" counts={data?.navigation??null}/><main className="points-main">
    <header className="points-heading"><div><h1>Daily points</h1><p>Your coding practice over time, from LeetCode and this notebook.</p></div><div className="points-weights" aria-label="Points by difficulty"><span><DifficultyLabel difficulty="Easy"/>0.5 points</span><span><DifficultyLabel difficulty="Medium"/>1 point</span><span><DifficultyLabel difficulty="Hard"/>2 points</span></div></header>
    <p className="points-rule">One score per problem per day. Repeat it on a later day to earn points again. SQL questions earn half: Easy 0.25, Medium 0.5, Hard 1 point. Tracker dates use New York time; imported history uses the dates shown by LeetCode.</p>
    {error?<div className="error" role="alert">Your points couldn’t load. <button className="save" onClick={load}>Try again</button></div>:!data?<p role="status">Loading your points…</p>:<>
      {data.history&&<aside className={'points-import-note'+(data.history.complete?'':' is-partial')} aria-label="LeetCode import coverage"><div><strong>{data.history.complete?'LeetCode history imported':'LeetCode history · partial import'}</strong><p>{number(data.history.importedProblems)} problems across {number(data.history.importedDays)} days{data.history.firstDay&&data.history.lastDay?' · '+dateLabel(data.history.firstDay)+' to '+dateLabel(data.history.lastDay):''}.</p><p>{data.history.reviewedProblems} of {data.history.expectedProblems} practice histories reviewed.{data.history.overlapProblemDays>0?' '+data.history.overlapProblemDays+' overlapping problem-days credited once.':''}</p></div><div><a href={data.history.sourceUrl} target="_blank" rel="noopener noreferrer">LeetCode progress</a>{data.history.importedAt&&<span>Imported {dateLabel(data.history.importedAt.slice(0,10))}</span>}</div></aside>}
      {!data.history&&<aside className="points-import-note is-partial" aria-label="LeetCode import coverage"><div><strong>LeetCode history has not been imported yet</strong><p>These totals show recorded tracker activity and extra study only. Earlier LeetCode practice will appear here after its accepted submission dates are imported.</p></div><a href="https://leetcode.com/progress/" target="_blank" rel="noopener noreferrer">LeetCode progress</a></aside>}
      {!data.firstDay&&<p className="points-tracking-note">Daily tracking starts with your next submitted completion, imported history, or extra study entry.</p>}
      <dl className="points-summary" aria-label="Points summary"><div><dt>Today</dt><dd>{number(data.todayPoints)}<span>points</span></dd><p>{data.todayQuestions} problem{data.todayQuestions===1?'':'s'} · {dateLabel(data.today,true)}</p></div><div><dt>Last 7 days</dt><dd>{number(data.weekPoints)}<span>points</span></dd><p>Including today</p></div><div><dt>Total recorded</dt><dd>{number(data.totalPoints)}<span>points</span></dd><p>{data.firstDay?'Since '+dateLabel(data.firstDay):'Starts with your next study entry'}</p></div></dl>
      <HistoryViews data={data}/>
      <section className="points-panel points-extra" aria-labelledby="points-extra-heading"><div className="points-panel-heading"><h2 id="points-extra-heading">Extra study points</h2><span>For today · {dateLabel(data.today,true)}</span></div><form onSubmit={addExtra} className="points-extra-form"><p>Credit yourself for a video, extra practice, or other work beyond a problem completion.</p><fieldset disabled={!!busy}><legend>Points to add</legend><div className="points-extra-amounts">{([1,2] as const).map(units=><label key={units}><input type="radio" name="extra-points" value={units} checked={pointUnits===units} onChange={()=>{setPointUnits(units);pendingCredit.current=null;}}/>+{number(units/2)} point{units===1?'s':''}</label>)}</div></fieldset><label className="points-extra-note" htmlFor="extra-study-note"><span>What did you work on? <span>(optional)</span></span><input id="extra-study-note" maxLength={500} placeholder="e.g. Watched a tree traversal video" value={note} disabled={!!busy} onChange={event=>{setNote(event.target.value);pendingCredit.current=null;}}/></label><button className="submit" type="submit" disabled={!!busy}>{busy==='add'?'Adding…':'Add extra points'}</button></form><p className="points-extra-help">Added to today’s total. Your problem counts and completion history stay the same.</p></section>
      {actionError&&<p className="error" role="alert">{actionError}</p>}{notice&&<p className="points-action-notice" role="status">{notice}</p>}
      {data.days.some(day=>day.extras.length>0)&&<section className="points-panel" aria-labelledby="points-extra-history-heading"><div className="points-panel-heading"><h2 id="points-extra-history-heading">Extra study entries</h2><span>Most recent first</span></div><ul className="points-extra-history">{data.days.flatMap(day=>day.extras.map(entry=><li key={entry.id}><div><strong>{entry.note||'Extra study'}</strong><span>{dateLabel(day.day)}</span></div><b>+{number(entry.pointUnits/2)}</b><button className="save" type="button" disabled={!!busy} aria-label={'Remove extra study entry: '+(entry.note||'Extra study')+', '+dateLabel(day.day)} onClick={()=>removeExtra(entry.id)}>{busy===entry.id?'Removing…':'Remove'}</button></li>))}</ul></section>}
      {data.undated.attempts>0&&<aside className="points-undated" aria-label="Earlier completion history"><div><strong>Undated tracker records</strong><p>{number(data.undated.attempts)} completed attempts across {number(data.undated.questions)} problems.</p></div><p>These tracker records have no saved date. Matching LeetCode history is included above when available; these records do not add a second score. Your notes and completion counts remain in Repeat and Done.</p></aside>}
    </>}
  </main></div>;
}
