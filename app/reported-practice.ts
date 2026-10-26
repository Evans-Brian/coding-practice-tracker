import taskDefinitions from './practice/reported-task-definitions.json';

export type QuestionDefinition = {
 name:string; slug:string; theme:string; difficulty:string; grind75:boolean;
 kind:'leetcode'|'custom'; practicePrompt?:string;
 reportedVariationSlug?:string; leetcodeFoundationSlug?:string; exercisePath?:string;
};
// Custom exercises retain their stored IDs for existing progress and drafts.

const reportedQuestions:QuestionDefinition[]=[
 {name:'Decode an anagram sentence',slug:'upstart-anagram-sentence',theme:'Character counts · dictionary lookup',difficulty:'Medium',grind75:false,kind:'custom',
 practicePrompt:'Practice reconstruction: given a vocabulary and a sentence of scrambled words, restore the sentence. Each scrambled word preserves its original first and last characters. Assume there is exactly one matching vocabulary word. Preserve word order.\nExample: vocabulary = ["pears", "spear", "something"], sentence = "seapr sothinmeg" → "spear something".\nLeetCode foundation: Group Anagrams (linked in the first section).'},
 {name:'Decode the Message',slug:'decode-the-message',theme:'Substitution maps · strings',difficulty:'Easy',grind75:false,kind:'leetcode',reportedVariationSlug:'upstart-double-substitution-decoding',
 practicePrompt:'After the LeetCode problem: accept plaintext/ciphertext pairs for A→B and B→C, infer their inverse maps, and undo B→C followed by A→B on a doubly encrypted message. Assume consistent one-to-one mappings and that every needed character is covered.\nExample: abc→bcd and bcd→def; encrypted "def" → "abc".'},
 {name:'Minimum Absolute Difference',slug:'minimum-absolute-difference',theme:'Sorting · adjacent differences',difficulty:'Easy',grind75:false,kind:'leetcode',reportedVariationSlug:'upstart-minimum-difference-value',
 practicePrompt:'After LeetCode: return just the minimum difference and allow duplicate inputs.\nExample: [1, 20, 100, 3] → 2; [5, 5, 9] → 0.'},
 {name:'Count words in alphabetical order',slug:'upstart-alphabetical-word-count',theme:'Hash maps · sorting',difficulty:'Easy',grind75:false,kind:'custom',
 practicePrompt:'Given a list of case-sensitive words, return (word, count) pairs sorted alphabetically by word.\nExample: ["pear", "apple", "pear"] → [("apple", 1), ("pear", 2)].\nTest empty input and words with equal counts.'},
 {name:'Remove duplicates while preserving order',slug:'upstart-deduplicate-integers',theme:'Sets · array processing',difficulty:'Easy',grind75:false,kind:'custom',
 practicePrompt:'Given an unsorted integer list, keep only each value’s first occurrence without changing the order.\nExample: [3, 5, 3, 7, 5] → [3, 5, 7].\nTest negative values, empty input, and an all-duplicate list.'},
 {name:'Merge Strings Alternately',slug:'merge-strings-alternately',theme:'String indexing · implementation',difficulty:'Easy',grind75:false,kind:'leetcode',reportedVariationSlug:'upstart-interleave-three-strings',
 practicePrompt:'Interleave corresponding characters from three equal-length strings.\nExample: "abc", "def", "ghi" → "adgbehcfi".\nTest empty strings and one-character strings.'},
 {name:'Jewels and Stones',slug:'jewels-and-stones',theme:'Set membership · string filtering',difficulty:'Easy',grind75:false,kind:'leetcode',reportedVariationSlug:'upstart-filter-words-by-characters',
 practicePrompt:'Given words and a string of allowed characters, return the words containing at least one allowed character. Preserve their original order.\nExample: words = ["cat", "dog", "sky"], allowed = "ao" → ["cat", "dog"].\nMatching is case-sensitive for this practice reconstruction.'},
 {name:'Sum Multiples',slug:'sum-multiples',theme:'Loops · divisibility',difficulty:'Easy',grind75:false,kind:'leetcode',reportedVariationSlug:'upstart-sum-multiples-below-limit',
 practicePrompt:'Practice variant: sum each positive integer smaller than n that is divisible by 3, 5, or 7, counting it once.\nExample: n = 12 → 40.\nTest n = 3 and a number divisible by more than one divisor.'},
 {name:'Rewrite punctuation',slug:'upstart-punctuation-transform',theme:'String scanning · run boundaries',difficulty:'Easy',grind75:false,kind:'custom',
 practicePrompt:'Practice reconstruction: first append one ! to every maximal run of existing ! characters, then replace every . with !. Preserve all other characters. Apply each rule once to the original input.\nExample: "Hello. Nice to meet you!!" → "Hello! Nice to meet you!!!".\nTest empty input, punctuation-only input, and adjacent . and ! characters.'},
 {name:'Reverse and filter even numbers',slug:'upstart-reverse-even-numbers',theme:'Array traversal · filtering',difficulty:'Easy',grind75:false,kind:'custom',
 practicePrompt:'Return only even integers, reversing their order of appearance. Do not mutate the input.\nExample: [2, 3, 4] → [4, 2].\nTest empty input, all odd values, negative even values, and zero.'},
 {name:'Find a bounding rectangle',slug:'upstart-bounding-rectangle',theme:'One-pass extrema · coordinates',difficulty:'Easy',grind75:false,kind:'custom',
 practicePrompt:'For a nonempty list of (x, y) points, return (min_x, min_y, max_x-min_x, max_y-min_y).\nExample: [(1, 4), (-2, 8), (3, 2)] → (-2, 2, 5, 6).\nTest a single point, repeated points, and negative coordinates.'},
 {name:'Scale ingredient quantities',slug:'upstart-scale-ingredients',theme:'String parsing · arithmetic',difficulty:'Easy',grind75:false,kind:'custom',
 practicePrompt:'Given ingredient strings formatted as "integer unit ingredient name" and a positive serving multiplier, multiply the leading quantity and preserve the remaining text.\nExample: ["100 g flour", "50 g water"] with multiplier 8 → ["800 g flour", "400 g water"].\nAssume valid input; test multiword ingredient names and zero quantities.'},
 {name:'Report where a value appears',slug:'upstart-value-position-flags',theme:'Array indexing · Boolean conditions',difficulty:'Easy',grind75:false,kind:'custom',
 practicePrompt:'Given a target, an even-length array, and four enable flags, return four 0/1 results: the target appears at an even index, at an odd index, in the first half, and in the second half. Use zero-based indexes; a disabled flag forces its result to 0.\nExample: target = 5, array = [5, 1, 2, 5], flags = [1, 1, 1, 1] → [1, 1, 1, 1].'},
 {name:'Simulate buffet revenue',slug:'upstart-buffet-revenue',theme:'Sets · event simulation · capacity',difficulty:'Medium',grind75:false,kind:'custom',
 practicePrompt:'Given prices indexed by customer ID, a positive capacity, and an event list, alternate each customer’s events between arrival and departure. Seat an arrival if a seat is free. Otherwise mark them waiting outside; for this drill, waiting customers are not automatically seated when a seat opens. Remove them on departure. Add their price only the first time they are admitted. Assume the restaurant starts empty.\nExample: prices = [10, 20, 30], capacity = 2, events = [0, 1, 2, 0, 2, 0] → 30.\nClarify automatic seating, charging on admission, and return visits before solving a different version.'}
];

export const reportedPractice:QuestionDefinition[]=reportedQuestions.map(question=>{
 const exercise=taskDefinitions.find(entry=>entry.problemId===question.slug);
 return exercise?{...question,practicePrompt:exercise.prompt,exercisePath:'/practice/'+exercise.slug}:question;
});
