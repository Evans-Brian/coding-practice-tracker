import {type StudyQuestion} from './study-catalog';
import {questionRelevance,relevanceCompanies,relevanceMetadata} from './question-relevance';

export default function QuestionRelevanceLabel({question}:{question:StudyQuestion}) {
  const relevance=questionRelevance(question);
  if(!relevance)return null;
  return <details className="question-relevance">
    <summary><span className="relevance-badge">Relevance <strong>{relevance.score}/100</strong></span>
      <span className="company-coverage">{relevance.companyCount?relevance.companyCount+' company '+(relevance.companyCount===1?'list':'lists'):'No matching recent listing'}</span>
    </summary>
    <div className="relevance-detail">
      <p>Six-month company-list snapshot: approximately Apr 20–Oct 20, 2026. Checked Oct 26.</p>
      {relevance.companyCount>0?<>
        <p>Listed in {relevance.companyCount} of {relevanceMetadata.sampleCompanyCount} sampled company lists.{relevance.coverage==='limited'?' Limited coverage; this evidence receives less weight.':''}</p>
        <ul>{relevance.companies.map(company=><li key={company.name}><a href={relevanceCompanies.find(source=>source.name===company.name)?.sourceUrl} target="_blank" rel="noopener noreferrer">{company.name}</a></li>)}</ul>
      </>:<p>No match in this sample. The score uses topic relevance and curated-list coverage; missing data does not mean the question is never asked.</p>}
      <p>Combines recent company coverage and relative frequency, topic relevance, and curated-list coverage. This is a study index, not a percentage chance of being asked.</p>
    </div>
  </details>;
}

export function RelevanceGuide() {
  return <details className="relevance-guide">
    <summary>How relevance scores work <span>Updated Oct 26, 2026</span></summary>
    <div>
      <p><strong>Section scores</strong> use our recent-weighted generalist interview priorities. Your tier choices stay separate from the scores; LRU Cache leads Medium Priority.</p>
      <p><strong>Question scores</strong> combine topic relevance (45%), curated-list coverage (20%), and recent company evidence (up to 35%). Recent evidence combines breadth across company lists with relative frequency within each list. Fewer than four matching companies reduces its weight; no match falls back to the first two components.</p>
      <p>The baseline recognizes NeetCode 150 and additional Grind 75 coverage. Hard-only sections measure extra study depth; individual questions use their parent topic and their own evidence.</p>
      <p>Recent evidence comes from <a href={relevanceMetadata.commitUrl} target="_blank" rel="noopener noreferrer">25 company lists in the Oct 20 snapshot</a>, committed Oct 21, covering approximately Apr 20–Oct 20, 2026. {relevanceMetadata.trackedQuestionsWithEvidence} of {relevanceMetadata.trackedQuestionCount} questions have matching listings.</p>
      <p>These are community-reported LeetCode company tags, not employer-verified interview counts. Role, level, and location are unavailable, and some company lists are sparse. Raw frequency values are used only for relative ranking within a company. Scores are approximate study priorities, not probabilities.</p>
    </div>
  </details>;
}
