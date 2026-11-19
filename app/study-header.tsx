type Counts={neetcode:number;repeat:number;done:number};
export default function StudyHeader({active,counts}:{active?:'neetcode'|'google'|'google-month'|'repeat'|'done'|'not-prioritized'|'points';counts:Counts|null}) {
  return <header className="study-topbar">
    <a className="brand" href="/"><span className="logo">C</span><span>Coding practice</span></a>
    <nav className="pages" aria-label="Study pages">
      <a href="/" aria-current={active==='neetcode'?'page':undefined}>NeetCode 150{counts&&<span>{counts.neetcode}/150</span>}</a>
      <a href="/google-top-50" aria-current={active==='google'?'page':undefined}>Google Top 50</a>
      <a href="/google-last-month" aria-current={active==='google-month'?'page':undefined}>Google 30 Days</a>
      <a href="/repeat" aria-current={active==='repeat'?'page':undefined}>Repeat{counts&&<span>{counts.repeat}</span>}</a>
      <a href="/done" aria-current={active==='done'?'page':undefined}>Done{counts&&<span>{counts.done}</span>}</a>
      <a href="/not-prioritized" aria-current={active==='not-prioritized'?'page':undefined}>Not Prioritized</a>
      <a href="/points" aria-current={active==='points'?'page':undefined}>Daily points</a>
    </nav>
  </header>;
}
