export const buckets=[
 {title:'Start here',description:'Strings, hash maps, sets, and stacks. Closest to the reported screen themes.'},
 {title:'Build fluency',description:'Useful extensions, array processing, intervals, and state tracking.'},
 {title:'Broaden coverage',description:'Common interview fundamentals once the priority questions feel comfortable.'},
 {title:'Leave until last',description:'More specialized techniques with less supporting evidence for this screen.'}
];
const groups=[
`Simplify Path|simplify-path|Stack · path parsing
Valid Anagram|valid-anagram|Character counts
Group Anagrams|group-anagrams|Hash-map grouping
Valid Parentheses|valid-parentheses|Stack · parsing
Contains Duplicate|contains-duplicate|Set membership
Two Sum|two-sum|Hash-map lookup
Encode and Decode Strings|encode-and-decode-strings|String encoding · parsing
Longest Substring Without Repeating Characters|longest-substring-without-repeating-characters|Sliding window · sets
Top K Frequent Elements|top-k-frequent-elements|Frequency counting
Longest Consecutive Sequence|longest-consecutive-sequence|Sets`,
`Longest Repeating Character Replacement|longest-repeating-character-replacement|Sliding window · counts
Minimum Window Substring|minimum-window-substring|Sliding window · strings
Palindromic Substrings|palindromic-substrings|String indexing
Best Time to Buy and Sell Stock|best-time-to-buy-and-sell-stock|One-pass state
Maximum Subarray|maximum-subarray|Running state
Product of Array Except Self|product-of-array-except-self|Prefix · suffix
3Sum|3sum|Sorting · two pointers
Container With Most Water|container-with-most-water|Two pointers
Merge Intervals|merge-intervals|Sorting · merging
Insert Interval|insert-interval|Interval boundaries
Non-overlapping Intervals|non-overlapping-intervals|Intervals · greedy
Meeting Rooms|meeting-rooms|Interval validation
Meeting Rooms II|meeting-rooms-ii|Concurrent events
Task Scheduler|task-scheduler|Counts · scheduling`,
`Search in Rotated Sorted Array|search-in-rotated-sorted-array|Binary search
Find Minimum in Rotated Sorted Array|find-minimum-in-rotated-sorted-array|Binary search
Reverse Linked List|reverse-linked-list|Linked lists
Linked List Cycle|linked-list-cycle|Fast · slow pointers
Remove Nth Node From End of List|remove-nth-node-from-end-of-list|Linked lists
Invert Binary Tree|invert-binary-tree|Basic trees
Maximum Depth of Binary Tree|maximum-depth-of-binary-tree|Basic trees
Same Tree|same-tree|Basic trees
Subtree of Another Tree|subtree-of-another-tree|Basic trees
Binary Tree Level Order Traversal|binary-tree-level-order-traversal|Breadth-first search
Validate Binary Search Tree|validate-binary-search-tree|BSTs
Lowest Common Ancestor of a BST|lowest-common-ancestor-of-a-binary-search-tree|BSTs
Kth Smallest Element in a BST|kth-smallest-element-in-a-bst|BST traversal
Number of Islands|number-of-islands|Graph traversal
Clone Graph|clone-graph|Graph traversal
Graph Valid Tree|graph-valid-tree|Graphs
Number of Connected Components|number-of-connected-components-in-an-undirected-graph|Graphs
Climbing Stairs|climbing-stairs|Dynamic programming
House Robber|house-robber|Dynamic programming
Coin Change|coin-change|Dynamic programming
Jump Game|jump-game|Greedy`,
`Maximum Product Subarray|maximum-product-subarray|Dynamic programming
Longest Increasing Subsequence|longest-increasing-subsequence|Dynamic programming
House Robber II|house-robber-ii|Dynamic programming
Decode Ways|decode-ways|Dynamic programming
Unique Paths|unique-paths|Dynamic programming
Word Break|word-break|Dynamic programming
Combination Sum|combination-sum|Backtracking
Implement Trie|implement-trie-prefix-tree|Tries
Add and Search Word|design-add-and-search-words-data-structure|Tries · backtracking
Word Search II|word-search-ii|Tries · backtracking
Construct Binary Tree from Preorder and Inorder Traversal|construct-binary-tree-from-preorder-and-inorder-traversal|Tree construction
Serialize and Deserialize Binary Tree|serialize-and-deserialize-binary-tree|Tree serialization
Binary Tree Maximum Path Sum|binary-tree-maximum-path-sum|Trees · recursion
Merge K Sorted Lists|merge-k-sorted-lists|Heaps
Find Median from Data Stream|find-median-from-data-stream|Heaps
Pacific Atlantic Water Flow|pacific-atlantic-water-flow|Graph traversal
Alien Dictionary|alien-dictionary|Topological sorting`
];
let order=0;
export const questions=groups.flatMap((group,bucket)=>group.split('\n').map(line=>{const [name,slug,theme]=line.split('|');return {name,slug,theme,bucket,order:++order};}));
