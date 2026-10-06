import grind75 from './grind75-source.json' with {type:'json'};
import {questions as legacy,difficulty as legacyDifficulty} from './legacy-questions';

export const buckets=[
 {title:'Direct Upstart matches',description:'Questions appearing in your logged-in Upstart company filter. Tags can cover multiple interview stages.'},
 {title:'Closely related techniques',description:'Strings, hash maps, stacks, array scans, and intervals that transfer directly to the tagged problems.'},
 {title:'Useful supporting practice',description:'Related grid, backtracking, DP, design, and array techniques, plus basic search and linked lists.'},
 {title:'Broader coverage',description:'Trees, BSTs, tries, advanced graphs, and heaps with less direct support in the observed Upstart tags.'}
];
// Observed in the user's logged-in LeetCode problemset Companies=Upstart filter,
// October 5, 2026. The pinned daily question is excluded. This is evidence of
// a company association, not frequency, recency, or a screen-only question bank.
export const upstartTags=new Set(`next-permutation valid-sudoku group-anagrams maximum-subarray merge-intervals simplify-path word-search pascals-triangle triangle best-time-to-buy-and-sell-stock best-time-to-buy-and-sell-stock-iii factorial-trailing-zeroes minimum-size-subarray-sum contains-duplicate range-sum-query-2d-immutable range-sum-query-2d-mutable design-tic-tac-toe display-table-of-food-orders-in-a-restaurant maximum-number-of-words-you-can-type decode-the-message distribute-money-to-maximum-children sum-multiples find-the-peaks`.split(' '));
const close=new Set(`two-sum valid-parentheses valid-palindrome valid-anagram ransom-note longest-palindrome majority-element add-binary implement-queue-using-stacks evaluate-reverse-polish-notation min-stack product-of-array-except-self insert-interval longest-substring-without-repeating-characters string-to-integer-atoi spiral-matrix sort-colors find-all-anagrams-in-a-string minimum-window-substring basic-calculator encode-and-decode-strings top-k-frequent-elements longest-consecutive-sequence`.split(' '));
const supporting=new Set(`climbing-stairs coin-change partition-equal-subset-sum word-break unique-paths combination-sum permutations subsets letter-combinations-of-a-phone-number longest-palindromic-substring container-with-most-water 3sum trapping-rain-water maximum-profit-in-job-scheduling largest-rectangle-in-histogram task-scheduler lru-cache time-based-key-value-store accounts-merge k-closest-points-to-origin flood-fill 01-matrix number-of-islands rotting-oranges search-in-rotated-sorted-array binary-search first-bad-version reverse-linked-list merge-two-sorted-lists middle-of-the-linked-list linked-list-cycle`.split(' '));
const extraSlugs=['simplify-path','group-anagrams','encode-and-decode-strings','top-k-frequent-elements','longest-consecutive-sequence'];
const extras=extraSlugs.map(slug=>{const q=legacy.find(q=>q.slug===slug)!;return {name:q.name,slug,theme:q.theme,difficulty:legacyDifficulty(slug)};});
const active=[...grind75.map(q=>({...q,grind75:true})),...extras.map(q=>({...q,grind75:false}))];
const activeSlugs=new Set(active.map(q=>q.slug));
export const isCurrentQuestion=(slug:string)=>activeSlugs.has(slug);
const directOrder=['maximum-subarray','simplify-path','group-anagrams','merge-intervals','best-time-to-buy-and-sell-stock','contains-duplicate','word-search'];
function bucket(slug:string){return upstartTags.has(slug)?0:close.has(slug)?1:supporting.has(slug)?2:3;}
function relevance(slug:string,theme:string){
 if(upstartTags.has(slug))return 'Direct Upstart tag';
 if(slug==='valid-anagram'||slug==='find-all-anagrams-in-a-string'||slug==='ransom-note')return 'Related to Group Anagrams: character counts';
 if(slug==='insert-interval')return 'Related to Merge Intervals';
 if(slug==='product-of-array-except-self')return 'Related to range-sum queries: prefix/suffix accumulation';
 if(slug==='minimum-window-substring'||slug==='longest-substring-without-repeating-characters')return 'Related to Minimum Size Subarray Sum: sliding windows';
 if(/parentheses|calculator|stack|notation/.test(slug))return 'Related to Simplify Path: stacks and parsing';
 if(slug==='combination-sum'||slug==='permutations'||slug==='subsets'||slug==='letter-combinations-of-a-phone-number')return 'Related to Word Search: backtracking';
 if(bucket(slug)===1)return 'Related string, counting, or array processing technique';
 if(bucket(slug)===2)return theme==='Dynamic Programming'?'Related to Triangle and stock variants: DP practice':'Supporting interview technique; indirect tag overlap';
 return 'General interview coverage; limited direct tag overlap';
}
// Keep legacy IDs valid so saved progress is never deleted or orphaned.
// Hidden legacy questions are still shown if retained/completed in the database.
const archived=legacy.filter(q=>!activeSlugs.has(q.slug)).map(q=>({...q,difficulty:legacyDifficulty(q.slug),grind75:false}));
export const questions=[...active,...archived].map(q=>({...q,bucket:bucket(q.slug),upstartTagged:upstartTags.has(q.slug),relevance:relevance(q.slug,q.theme)})).sort((a,b)=>a.bucket-b.bucket||(a.bucket===0?directOrder.indexOf(a.slug)-directOrder.indexOf(b.slug):0)).map((q,i)=>({...q,order:i+1}));
export const difficulty=(slug:string)=>questions.find(q=>q.slug===slug)?.difficulty??'Medium';
export const grind75Count=grind75.length;


