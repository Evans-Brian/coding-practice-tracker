import BinarySearchTips from './binary-search-tips';

const template = `while left < right:
    mid = (left + right) // 2

    if condition(mid):
        right = mid
    else:
        left = mid + 1

return left`;

export default function BinarySearchGuide() {
  return <details className="binary-search-guide" open>
    <summary>
      <span><strong>Binary search tips &amp; tricks</strong><span className="binary-guide-subtitle">Find the first qualifying candidate</span></span>
      <span className="binary-guide-toggle" aria-hidden="true"><span className="when-open">Collapse</span><span className="when-closed">Expand</span> <span className="binary-guide-chevron">⌄</span></span>
    </summary>
    <div className="binary-guide-body">
      <p>For this template, transform the problem into:</p>
      <blockquote>Find the smallest candidate <code>x</code> such that <code>condition(x)</code> is True.</blockquote>
      <p>The condition checks whether a candidate <strong>qualifies</strong>, not whether it is already the optimal answer. Several candidates can qualify; binary search finds the first one.</p>
      <div className="binary-guide-examples">
        <div className="binary-guide-example">
          <h3>Example boundary</h3>
          <p>A candidate qualifies if it is at least <code>4</code>. Candidates <code>4</code>, <code>5</code>, and <code>6</code> all qualify, but the smallest is <code>4</code>.</p>
          <div className="binary-boundary-scroll" role="region" aria-label="Example of a false-to-true boundary" tabIndex={0}>
            <table className="binary-boundary-table">
              <thead><tr><th scope="col">Candidate</th>{[1,2,3,4,5,6].map(x=><th scope="col" key={x} className={x===4?'first-true':undefined}>{x}</th>)}</tr></thead>
              <tbody><tr><th scope="row">Condition</th>{[1,2,3,4,5,6].map(x=><td key={x} className={x===4?'first-true':undefined}>{x>=4?'True':'False'}</td>)}</tr>
                <tr className="binary-boundary-label"><th scope="row">Boundary</th><td></td><td></td><td></td><td className="first-true">↑ first True</td><td></td><td></td></tr></tbody>
            </table>
          </div>
        </div>
        <div className="binary-guide-template"><h3>Python template</h3><pre><code>{template}</code></pre></div>
      </div>
      <h3>Three things to select or modify</h3>
      <ol className="binary-guide-checklist">
        <li><strong>Initialize the boundaries.</strong><p>Choose <code>left</code> and <code>right</code> so the desired boundary is included. In the example, use <code>left = 1</code> and <code>right = 6</code>. If no candidate qualifies, handle that case separately or include a sentinel representing “no answer.”</p></li>
        <li><strong>Decide what to return.</strong><p>When the loop finishes, <code>left == right</code> identifies the first True, provided a qualifying candidate exists within the bounds. Sometimes this is the answer; sometimes you need the candidate immediately before it.</p></li>
        <li><strong>Design the condition.</strong><p>It must produce <strong>False → True</strong> as candidates increase. Once a candidate qualifies, every larger candidate must also qualify. For a True → False condition, negate it to find the first False, then adjust what you return.</p></li>
      </ol>
      <div className="binary-guide-updates"><h3>Why the pointers move this way</h3><ul>
        <li><strong>True:</strong> <code>mid</code> could be the first qualifying candidate, so keep it with <code>right = mid</code>.</li>
        <li><strong>False:</strong> <code>mid</code> and everything smaller fail, so discard them with <code>left = mid + 1</code>.</li>
      </ul></div>
      <p className="binary-guide-source">Related reference: <BinarySearchTips/></p>
    </div>
  </details>;
}
