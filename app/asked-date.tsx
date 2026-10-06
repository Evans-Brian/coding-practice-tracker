import {askedDate} from './asked-dates';
import type {QuestionDefinition} from './reported-practice';

export default function AskedDate({question}:{question:Pick<QuestionDefinition,'slug'|'source'|'matchLabel'>}){
 const date=askedDate(question);
 if(!date)return null;
 const scope=question.matchLabel?.includes('proxy')?'Reported variation asked, estimated':'Asked, estimated';
 return <div className="asked-date">
  <p><strong>{scope}: {date.estimate}</strong>{date.confidence!=='Unknown'&&<span className={'date-confidence '+date.confidence.toLowerCase()}>{date.confidence} confidence</span>}{date.stage&&<span className="date-stage">{date.stage}</span>}</p>
  <details><summary>Date evidence</summary><p>{date.basis}</p>{date.additional&&<p>{date.additional}</p>}<ul>{date.links.map(link=><li key={link.url}><a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a></li>)}</ul></details>
 </div>;
}
