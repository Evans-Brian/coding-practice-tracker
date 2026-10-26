import evidence from './question-relevance-data.json' with {type: 'json'};
import {type StudyQuestion} from './study-catalog';
import {neetcodeSections, sectionForQuestion} from './study-priorities';

type CompanyEvidence = {name:string;rawFrequency:number|null;withinCompanyPercentile:number|null};
type QuestionEvidence = {companyCount:number;meanWithinCompanyPercentile:number|null;companies:CompanyEvidence[]};
const questionEvidence:Record<string,QuestionEvidence> = evidence.questions;
export const relevanceMetadata = evidence.metadata;
export const relevanceCompanies = evidence.companies;

// Editorial study index, not a prediction of interview probability. Recent
// evidence has at most 35% influence, shrinking toward the prior below four
// observed company lists. Missing listings are never treated as zero relevance.
export function questionRelevance(question:StudyQuestion) {
  const section=sectionForQuestion(question);
  if(!section||question.kind==='custom')return null;
  // Hard-only section scores describe incremental study depth. Individual
  // problems retain their parent topic's baseline and their own recent evidence.
  const parent=neetcodeSections.find(candidate=>candidate.theme===question.theme&&candidate.tier==='prioritized');
  const topicScore=question.slug==='lru-cache'?section.relevance:(parent??section).relevance;
  const curationScore=question.grind75?95:question.neetcode150?70:60;
  const baseline=(45*topicScore+20*curationScore)/65;
  const recent=questionEvidence[question.slug];
  const companyCount=recent?.companyCount??0;
  const percentile=recent?.meanWithinCompanyPercentile;
  const recentWeight=percentile==null?0:0.35*Math.min(companyCount/4,1);
  const breadth=100*Math.log1p(companyCount)/Math.log1p(relevanceMetadata.sampleCompanyCount);
  const recentScore=percentile==null?null:0.65*percentile+0.35*breadth;
  const score=Math.round((1-recentWeight)*baseline+recentWeight*(recentScore??baseline));
  return {score,topicScore,curationScore,companyCount,recentWeight,recentScore,
    companies:recent?.companies??[],coverage:companyCount===0?'unlisted':companyCount<4?'limited':'broader'} as const;
}
