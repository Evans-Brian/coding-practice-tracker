import grind75 from './grind75-source.json' with {type:'json'};
import {questions as legacy,difficulty as legacyDifficulty} from './legacy-questions';
import {reportedPractice,type QuestionDefinition} from './reported-practice';

export const buckets=[
 {title:'Upstart company-list matches',description:'The six questions in LeetCode’s Upstart company list with All selected. Company association does not establish recency or interview stage.'},
 {title:'Recent reports & close proxies',description:'Practice from reports dated Oct 5, 2025–Oct 5, 2026. Mostly OA tasks; edited accounts receive supplementary weight. Each card explains the match and links its source.'},
 {title:'Strong transferable practice',description:'Hash maps, character counts, stacks, string parsing, array scans, prefix/suffix state, and basic DP. Priorities reflect technique overlap, not reported exact questions.'},
 {title:'Useful general coverage',description:'Sliding windows, intervals, basic binary search, linked lists, grid traversal, backtracking, and additional DP after the higher-priority sections.'},
 {title:'Later if time permits',description:'Trees, BSTs, tries, advanced graphs, heaps, and specialized hard problems with less direct support in this evidence.'}
];

// Observed in the logged-in company/upstart/?favoriteSlug=upstart-all list,
// October 5, 2026. The broader 23-question Companies filter is not used here.
export const upstartTags=new Set('group-anagrams simplify-path maximum-subarray valid-sudoku range-sum-query-2d-immutable triangle'.split(' '));
const companyOrder=['group-anagrams','simplify-path','maximum-subarray','valid-sudoku','range-sum-query-2d-immutable','triangle'];
const reportSlugs=new Set(reportedPractice.map(q=>q.slug));
const strong=new Set('two-sum valid-anagram ransom-note longest-palindrome contains-duplicate valid-parentheses min-stack evaluate-reverse-polish-notation implement-queue-using-stacks valid-palindrome string-to-integer-atoi add-binary encode-and-decode-strings best-time-to-buy-and-sell-stock product-of-array-except-self majority-element sort-colors spiral-matrix climbing-stairs unique-paths top-k-frequent-elements longest-consecutive-sequence'.split(' '));
const general=new Set('longest-substring-without-repeating-characters find-all-anagrams-in-a-string minimum-window-substring insert-interval merge-intervals binary-search first-bad-version search-in-rotated-sorted-array reverse-linked-list merge-two-sorted-lists middle-of-the-linked-list linked-list-cycle flood-fill 01-matrix number-of-islands rotting-oranges word-search combination-sum permutations subsets letter-combinations-of-a-phone-number coin-change partition-equal-subset-sum word-break longest-palindromic-substring container-with-most-water 3sum lru-cache time-based-key-value-store basic-calculator'.split(' '));
const existingExtras=['simplify-path','group-anagrams','encode-and-decode-strings','top-k-frequent-elements','longest-consecutive-sequence'].map(slug=>{
 const q=legacy.find(q=>q.slug===slug)!;
 return {name:q.name,slug,theme:q.theme,difficulty:legacyDifficulty(slug),grind75:false,kind:'leetcode' as const};
});
const companyExtras:QuestionDefinition[]=[
 {name:'Valid Sudoku',slug:'valid-sudoku',theme:'Sets · matrix validation',difficulty:'Medium',grind75:false,kind:'leetcode'},
 {name:'Range Sum Query 2D - Immutable',slug:'range-sum-query-2d-immutable',theme:'2D prefix sums',difficulty:'Medium',grind75:false,kind:'leetcode'},
 {name:'Triangle',slug:'triangle',theme:'Dynamic Programming',difficulty:'Medium',grind75:false,kind:'leetcode'}
];
const active:QuestionDefinition[]=[...grind75.map(q=>({...q,grind75:true,kind:'leetcode' as const})),...existingExtras,...companyExtras,...reportedPractice];
const activeSlugs=new Set(active.map(q=>q.slug));
export const isCurrentQuestion=(slug:string)=>activeSlugs.has(slug);
function bucket(slug:string){return upstartTags.has(slug)?0:reportSlugs.has(slug)?1:strong.has(slug)?2:general.has(slug)?3:4;}
function relevance(q:QuestionDefinition){
 if(upstartTags.has(q.slug))return 'Exact match in the six-question Upstart company list';
 if(q.relationship)return q.relationship;
 if(['valid-anagram','ransom-note','longest-palindrome'].includes(q.slug))return 'Transfers to Group Anagrams and the reported anagram/word-count tasks';
 if(['valid-parentheses','min-stack','evaluate-reverse-polish-notation','implement-queue-using-stacks'].includes(q.slug))return 'Stack practice related to Simplify Path';
 if(q.slug==='product-of-array-except-self')return 'Prefix/suffix accumulation related to range-sum queries';
 if(['climbing-stairs','unique-paths'].includes(q.slug))return 'Basic DP transitions related to Triangle';
 if(q.slug==='best-time-to-buy-and-sell-stock')return 'One-pass state practice related to Maximum Subarray; no direct company-list match';
 if(q.slug==='contains-duplicate')return 'Set practice related to the reported deduplication task; output differs';
 if(bucket(q.slug)===2)return 'Transferable counting, parsing, array processing, or state-tracking practice';
 if(bucket(q.slug)===3)return 'Useful general interview coverage; indirect support in the selected evidence';
 return 'Lower priority for this preparation; limited overlap with the selected evidence';
}
// Preserve every legacy ID so saved progress is never deleted or orphaned.
const archived:QuestionDefinition[]=legacy.filter(q=>!activeSlugs.has(q.slug)).map(q=>({...q,difficulty:legacyDifficulty(q.slug),grind75:false,kind:'leetcode' as const}));
export const questions=[...active,...archived].map(q=>({...q,bucket:bucket(q.slug),upstartTagged:upstartTags.has(q.slug),relevance:relevance(q)})).sort((a,b)=>a.bucket-b.bucket||(a.bucket===0?companyOrder.indexOf(a.slug)-companyOrder.indexOf(b.slug):0)).map((q,i)=>({...q,order:i+1}));
export const difficulty=(slug:string)=>questions.find(q=>q.slug===slug)?.difficulty??'Medium';
export const grind75Count=grind75.length;
export const currentQuestionCount=active.length;
export const customQuestionCount=active.filter(q=>q.kind==='custom').length;
