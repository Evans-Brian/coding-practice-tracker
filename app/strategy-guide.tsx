import {notesForSection} from './strategy-notes';

export default function StrategyGuide({theme,title=theme}:{theme:string;title?:string}){
  const notes=notesForSection(theme,title);
  if(!notes)return null;
  if(notes.kind==='checklist')return <aside className="strategy-guide" aria-label={title+' strategy notes'}>
    <div className="strategy-recognition"><strong>Dynamic programming checklist</strong></div>
    <ol className="strategy-checklist">{notes.steps.map(step=><li key={step.label}><strong>{step.label}:</strong> {step.text}</li>)}</ol>
  </aside>;
  return <aside className="strategy-guide" aria-label={title+' strategy notes'}>
    <div className="strategy-recognition"><strong>When to use this strategy</strong><p>{notes.recognize}</p></div>
    <ul className="strategy-clues">{notes.clues.map(clue=><li key={clue.signal}><strong>{clue.signal}.</strong> {clue.why}</li>)}</ul>
    <details className="strategy-details">
      <summary><span>Approach &amp; pitfalls</span><span className="strategy-details-toggle" aria-hidden="true">⌄</span></summary>
      <div className="strategy-detail-body">
        <dl><div><dt>Start here</dt><dd>{notes.start}</dd></div><div><dt>Choose carefully</dt><dd>{notes.distinguish}</dd></div></dl>
        <p className="strategy-pitfalls-label">Watch out for</p>
        <ul>{notes.pitfalls.map(pitfall=><li key={pitfall}>{pitfall}</li>)}</ul>
        {notes.references&&<p className="strategy-references">Further reading: {notes.references.map((reference,i)=><span key={reference.href}>{i>0?' · ':''}<a href={reference.href} target="_blank" rel="noopener noreferrer">{reference.label}</a></span>)}</p>}
      </div>
    </details>
  </aside>;
}
