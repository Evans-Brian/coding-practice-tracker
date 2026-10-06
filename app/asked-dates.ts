import type {QuestionDefinition} from './reported-practice';

type EvidenceLink={label:string;url:string};
export type AskedDate={
 estimate:string;
 confidence:'Moderate'|'Low'|'Unknown';
 stage?:string;
 basis:string;
 additional?:string;
 links:EvidenceLink[];
};

const companyList='https://leetcode.com/company/upstart/?favoriteSlug=upstart-all';
const companyDates:Record<string,AskedDate>={
 'group-anagrams':{
  estimate:'Unknown',confidence:'Unknown',
  basis:'The Upstart company list associates this exact problem with the company, but provides no interview date in the evidence we reviewed. The dated sentence-decoding reports describe a related task, not Group Anagrams itself.',
  links:[{label:'Upstart company list',url:companyList}]
 },
 'simplify-path':{
  estimate:'Around Feb 2020',confidence:'Moderate',stage:'Phone screen',
  basis:'A first-person Upstart full-stack phone-screen post dated Feb 26, 2020 explicitly links to Simplify Path. The author does not give the assessment date, so February is an estimate based on the post date.',
  links:[{label:'Candidate report · Feb 26, 2020',url:'https://leetcode.com/discuss/post/521661/upstart-phone-screen-full-stack-developer-role/'}]
 },
 'maximum-subarray':{
  estimate:'Jul 2023',confidence:'Moderate',stage:'SWE interview loop',
  basis:'A Glassdoor candidate report explicitly says the interview was in July 2023 and lists Maximum Subarray. The review was posted Sep 19, 2023; July is the reported interview month. The specific round is not identified.',
  links:[{label:'Candidate report · Jul 2023 interview',url:'https://www.glassdoor.com/Interview/Upstart-Software-Engineer-Interview-Questions-EI_IE7070805.0,7_KO8,25.htm'}]
 },
 'valid-sudoku':{
  estimate:'Unknown',confidence:'Unknown',stage:'OA in supplementary account',
  basis:'PracHub explicitly includes Sudoku validation in an Upstart SWE OA reconstruction. Its catalog labels the question Jan 20, 2026 and the page was updated Jun 26, 2026; neither establishes when the candidate took the assessment.',
  links:[{label:'PracHub OA reconstruction',url:'https://prachub.com/coding-questions/solve-remembered-oa-coding-tasks'}]
 },
 'range-sum-query-2d-immutable':{
  estimate:'Unknown',confidence:'Unknown',
  basis:'The Upstart company list associates this exact problem with the company, but the evidence we reviewed does not identify a dated interview occurrence. Observing the tag on Oct 5, 2026 does not mean the question was asked then.',
  links:[{label:'Upstart company list',url:companyList}]
 },
 'triangle':{
  estimate:'Unknown',confidence:'Unknown',
  basis:'The company list associates Triangle with Upstart. PracHub also describes it as a Data Scientist onsite task, but supplies no interview date on the question page. Its Mar 29, 2026 update is not an interview date.',
  links:[{label:'PracHub DS onsite question',url:'https://prachub.com/coding-questions/find-minimum-path-sum-in-integer-triangle'},{label:'Upstart company list',url:companyList}]
 }
};

export function askedDate(q:Pick<QuestionDefinition,'slug'|'source'>):AskedDate|undefined{
 if(companyDates[q.slug])return companyDates[q.slug];
 const source=q.source;
 if(!source)return undefined;
 const links=[{label:source.label,url:source.url}];
 if(source.url.includes('thread-1153027-'))return {
  estimate:'Oct–early Nov 2025',confidence:'Moderate',stage:'OA',
  basis:'The original candidate post is dated Nov 5, 2025 and categorizes the assessment as Q4 2025. A Nov 8 reply says the same OA was taken the previous week. October through early November is an approximate occurrence window; Nov 5 is the post date, not a confirmed assessment day.',
  additional:'A separate PracHub edited account labels an occurrence Mar 2026 (low confidence). This is a later reported occurrence, not independent verification of the original assessment date.',
  links:[...links,{label:'PracHub edited account · Mar 2026',url:'https://prachub.com/interview-experiences/upstart-software-engineer-interview-experience-four-oa-problems-not-enough-time'}]
 };
 if(source.url.includes('thread-1161825-'))return {
  estimate:'Around Jan 2026',confidence:'Moderate',stage:'Timed coding screen / OA',
  basis:'The first-person report was posted Jan 19, 2026 and categorizes the interview as Q1 2026. January is inferred from the post date; the exact assessment day is unknown. The form labels it a technical phone screen, while the title and replies call it an OA.',
  links
 };
 const month=source.url.endsWith('four-oa-problems-not-enough-time')?'Mar 2026':source.url.endsWith('recalling-all-5-online-assessment-questions')||source.url.endsWith('six-oa-questions-buried-in-walls-of-text')?'Jul 2026':undefined;
 if(!month)return undefined;
 return {
  estimate:month,confidence:'Low',stage:'OA',
  basis:`PracHub labels the interview ${month}; published August 2026. The account is edited, with no linked original dated post, so the interview month is unverified.`,
  links
 };
}
