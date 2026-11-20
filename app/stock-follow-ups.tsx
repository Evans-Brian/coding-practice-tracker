import DifficultyLabel from './difficulty-label';

const followUps=[
  {id:122,name:'Best Time to Buy and Sell Stock II',slug:'best-time-to-buy-and-sell-stock-ii',difficulty:'Medium',variation:'Complete unlimited transactions while holding at most one share.'},
  {id:309,name:'Best Time to Buy and Sell Stock with Cooldown',slug:'best-time-to-buy-and-sell-stock-with-cooldown',difficulty:'Medium',variation:'After selling, wait one day before buying again.'},
  {id:714,name:'Best Time to Buy and Sell Stock with Transaction Fee',slug:'best-time-to-buy-and-sell-stock-with-transaction-fee',difficulty:'Medium',variation:'Pay a fee for each completed purchase-and-sale transaction.'},
  {id:123,name:'Best Time to Buy and Sell Stock III',slug:'best-time-to-buy-and-sell-stock-iii',difficulty:'Hard',variation:'Complete at most two transactions.'},
  {id:188,name:'Best Time to Buy and Sell Stock IV',slug:'best-time-to-buy-and-sell-stock-iv',difficulty:'Hard',variation:'Complete at most k transactions.'},
] as const;

export default function StockFollowUps(){
  return <section id="stock-follow-ups" className="stock-follow-ups" aria-labelledby="stock-follow-ups-heading">
    <h2 id="stock-follow-ups-heading">Suggested follow-ups</h2>
    <p className="stock-follow-ups-intro">More variations of Best Time to Buy and Sell Stock to practice.</p>
    <ul>{followUps.map(question=><li key={question.slug}>
      <div className="stock-follow-up-title"><a href={'https://leetcode.com/problems/'+question.slug+'/'} target="_blank" rel="noopener noreferrer">{question.id}. {question.name}</a><DifficultyLabel difficulty={question.difficulty}/></div>
      <p>{question.variation}</p>
    </li>)}</ul>
  </section>;
}
