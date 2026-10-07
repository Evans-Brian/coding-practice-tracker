import {reportedPractice, type QuestionDefinition} from './reported-practice';

// Independent practice reconstructions, not verbatim assessment prompts.
// Reuse the proxy's report evidence without transferring its saved progress.
type Variation = {
 foundation:string; name:string; difficulty:string; theme:string;
 relationship:string; prompt:string;
};
const variations:Variation[]=[
 {
  foundation:'decode-the-message',name:'Decode a doubly substituted message',difficulty:'Medium',theme:'Inverse character maps · strings',
  relationship:'Standalone reconstruction of the reported two-key task. Decode the Message practices one substitution table; this question infers two tables from examples and reverses both. The input rules below are practice assumptions.',
  prompt:`Implement decode_double(known_ab, known_bc, encrypted) -> str.

A message was encrypted twice: first with a substitution from alphabet A to B, then with another substitution from B to C. known_ab contains (original, transformed) example pairs for the first step; known_bc contains pairs for the second. Recover the original message from encrypted, which is in alphabet C.

Practice rules: strings contain lowercase English letters and spaces. Spaces remain spaces at both steps. Each pair has equal-length strings; every non-space character maps consistently and one-to-one. Examples cover every mapping needed to decode encrypted. Repeated letters are allowed. Return a string; do not change the inputs. You do not need to validate inconsistent or incomplete examples.

Example 1: known_ab = [("abc", "bcd")], known_bc = [("bcd", "def")], encrypted = "fed def" → "cba abc".
Example 2: the same examples, encrypted = "ddd  f" → "aaa  c".
Example 3: empty encrypted text → "".

Test repeated characters, multiple example pairs, spaces, and mappings where a letter appears in both alphabets. Aim to handle 100,000 total example/message characters.`
 },
 {
  foundation:'minimum-absolute-difference',name:'Find the minimum difference value',difficulty:'Easy',theme:'Sorting · adjacent differences',
  relationship:'Standalone reconstruction of the reported scalar-return task. Unlike Minimum Absolute Difference on LeetCode, return one integer and allow duplicate input values.',
  prompt:`Implement minimum_difference(nums) -> int.

Given an integer list, return the smallest absolute difference between the values at any two distinct indexes. Return only the difference, not the pairs. Duplicate values are allowed and can produce a difference of zero. Do not mutate nums.

Practice constraints: 2 <= len(nums) <= 100,000 and -1,000,000,000 <= nums[i] <= 1,000,000,000.

Example 1: [1, 20, 100, 3] → 2.
Example 2: [5, 5, 9] → 0.
Example 3: [-8, -2, 4] → 6.
Example 4: [4, 1, 3, 2] → 1.

Test exactly two values, negative values, duplicate values, and unsorted input. Inputs with fewer than two values are outside this practice contract.`
 },
 {
  foundation:'merge-strings-alternately',name:'Interleave three equal-length strings',difficulty:'Easy',theme:'String indexing · implementation',
  relationship:'Standalone reconstruction of the reported three-string task. Merge Strings Alternately on LeetCode has two input strings; this version has three equal-length inputs.',
  prompt:`Implement interleave_three(a, b, c) -> str.

Return a string containing a[0], b[0], c[0], then a[1], b[1], c[1], and so on. The three strings are guaranteed to have equal length. Treat spaces and punctuation as ordinary characters; preserve every character exactly.

Practice constraints: 0 <= len(a) = len(b) = len(c) <= 100,000. Inputs use ASCII characters. Unequal-length inputs are outside this practice contract.

Example 1: a = "abc", b = "def", c = "ghi" → "adgbehcfi".
Example 2: a = "x", b = "y", c = "z" → "xyz".
Example 3: a = "", b = "", c = "" → "".
Example 4: a = "a ", b = "b!", c = "c?" → "abc !?".

Test empty strings, single-character strings, repeated characters, and embedded spaces. The result must contain exactly three times as many characters as one input.`
 },
 {
  foundation:'jewels-and-stones',name:'Filter words by shared characters',difficulty:'Easy',theme:'Set membership · word filtering',
  relationship:'Standalone reconstruction of the reported word-filter task. Jewels and Stones counts matching characters; this question returns the matching words in input order.',
  prompt:`Implement filter_words(words, allowed) -> list[str].

Keep each word that contains at least one character appearing in allowed. Return the matching words in their original order, including repeated words. Matching is case-sensitive. A word is included once per occurrence in words, even if several of its characters match. Do not modify words.

Practice rules: words and allowed contain ASCII characters. Empty input lists, empty words, and an empty allowed string are valid. An empty word never matches; an empty allowed string matches nothing. Handle up to 100,000 total input characters.

Example 1: words = ["cat", "dog", "sky"], allowed = "ao" → ["cat", "dog"].
Example 2: words = ["A", "a", "aba", ""], allowed = "a" → ["a", "aba"].
Example 3: words = ["cat", "cat"], allowed = "t" → ["cat", "cat"].
Example 4: words = ["cat"], allowed = "" → [].

Test no matches, multiple matching characters in one word, repeated allowed characters, and case differences.`
 },
 {
  foundation:'sum-multiples',name:'Sum multiples below an exclusive limit',difficulty:'Easy',theme:'Divisibility · boundary conditions',
  relationship:'Standalone reconstruction of the reported exclusive-limit task. Sum Multiples on LeetCode includes n; this version includes only positive integers strictly smaller than n.',
  prompt:`Implement sum_multiples_below(n) -> int.

Return the sum of all positive integers x such that x < n and x is divisible by 3, 5, or 7. Include each qualifying integer exactly once, even if it is divisible by more than one of these numbers. The upper bound n is excluded.

Practice constraint: n is an integer with 0 <= n <= 1,000,000. Return an integer; use a representation large enough for the total.

Example 1: n = 12 → 40, from 3 + 5 + 6 + 7 + 9 + 10.
Example 2: n = 3 → 0.
Example 3: n = 7 → 14, from 3 + 5 + 6; 7 itself is excluded.
Example 4: n = 16 → 81; 15 contributes only once.
Example 5: n = 0 → 0.

Test a limit divisible by 3, 5, or 7; overlapping multiples such as 15, 21, 35, and 105; and limits below the first qualifying number.`
 }
];

export const reportedVariations:QuestionDefinition[]=variations.map(variation=>{
 const foundation=reportedPractice.find(q=>q.slug===variation.foundation);
 if(!foundation?.reportedVariationSlug||!foundation.source)throw new Error('Missing report for variation: '+variation.foundation);
 return {
  name:variation.name,slug:foundation.reportedVariationSlug,theme:variation.theme,
  difficulty:variation.difficulty,grind75:false,kind:'custom',matchLabel:'Reported variation',
  source:foundation.source,reportedTask:foundation.reportedTask,
  relationship:variation.relationship,practicePrompt:variation.prompt,
  leetcodeFoundationSlug:foundation.slug
 };
});
