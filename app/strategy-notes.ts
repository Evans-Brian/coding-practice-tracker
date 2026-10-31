type RecognitionNotes={
  kind?:'recognition';
  recognize:string;
  clues:readonly {signal:string;why:string}[];
  start:string;
  distinguish:string;
  pitfalls:readonly string[];
  references?:readonly {label:string;href:string}[];
};
export type StrategyNotes=RecognitionNotes|{
  kind:'checklist';
  steps:readonly {label:string;text:string}[];
  clues:readonly string[];
  caveat:string;
  comparisons:readonly {label:string;text:string}[];
};

// Recognition clues suggest candidates. The constraints and a correctness
// argument determine whether a technique actually fits a particular problem.
export const strategyNotes:Record<string,StrategyNotes>={
  'Arrays & Hashing':{
    recognize:'Look for repeated lookups, counts, grouping, or information you can reuse from an earlier position.',
    clues:[
      {signal:'Seen before, duplicates, or frequencies',why:'A set handles membership; a map stores counts, positions, or other information for each value.'},
      {signal:'Group equivalent items',why:'Build a stable key that is identical exactly when two items belong in the same group.'},
      {signal:'Repeated range sums or a target subarray sum',why:'Prefix sums summarize earlier ranges; a map of earlier prefix sums may avoid checking every subarray.'},
    ],
    start:'Ask what you wish you could look up in constant average time while scanning. Choose a map value that preserves the needed information, such as a count or an earlier index.',
    distinguish:'Sorting can expose order and reduce extra storage, but may change the input or lose original positions. Hashing usually trades extra space for fast lookups. A fixed-size counting array can replace a map for a small, known alphabet.',
    pitfalls:['Anagram keys must include frequencies, not just the distinct characters. Use an immutable key such as a sorted string or a tuple of counts.','Check duplicates, empty input, and whether you need values, indices, or every occurrence. Prefix-sum ranges need consistent inclusive/exclusive boundaries.'],
  },
  'Two Pointers':{
    recognize:'Look for two positions that can move without reconsidering the values they discard.',
    clues:[
      {signal:'Sorted values and a pair or target',why:'The ordering may tell you which endpoint to move when the current pair is too small or too large.'},
      {signal:'Compare opposite ends',why:'Symmetric checks, reversals, and some boundary problems naturally work inward.'},
      {signal:'Compact or partition in place',why:'A read pointer explores input while a write pointer marks the next retained position.'},
    ],
    start:'State what each pointer means and why moving it cannot skip a better answer. Check that the total pointer movement is bounded by the input length.',
    distinguish:'A sliding window is a related pattern where the two pointers bound a contiguous range and you maintain its state. Merely having two indices does not prove a linear two-pointer solution.',
    pitfalls:['Do not sort when the problem needs the original order unless you can preserve that information. Include the sorting cost in your complexity.','Decide how equal values and duplicate answers are handled, and ensure every branch advances a pointer.'],
  },
  'Sliding Window':{
    recognize:'Think of a moving contiguous substring or subarray whose information can be updated as its ends move.',
    clues:[
      {signal:'Exactly k consecutive elements',why:'A fixed window adds the incoming element and removes the outgoing one.'},
      {signal:'Longest or shortest valid contiguous range',why:'An expandable window works when moving one boundary can restore a clear validity condition.'},
      {signal:'Counts, distinct values, or extrema inside a moving range',why:'A frequency map tracks membership; a monotonic deque can maintain a moving maximum or minimum.'},
    ],
    start:'Define the window invariant, how adding/removing one item updates it, and when to record the answer. For a longest-valid window, restore validity before measuring; shortest-valid windows often measure while shrinking.',
    distinguish:'Contiguous input is a clue, not enough by itself. With negative numbers, extending a range need not increase its sum, so a simple sum-threshold window can fail. Prefix sums or another technique may be needed.',
    pitfalls:['A subsequence can skip elements; a window cannot.','Store positions for expiring deque entries. If one removal may not restore validity, shrink repeatedly rather than just once.'],
  },
  'Stack':{
    recognize:'Look for last-in-first-out work, unfinished items, or a nearest greater/smaller neighbor.',
    clues:[
      {signal:'Nested brackets, parsing, undo, or backtracking through a path',why:'The most recently opened or added item is usually the next one to resolve.'},
      {signal:'Next or previous greater/smaller element',why:'A monotonic stack keeps unresolved candidates in a useful order and resolves them when a new value arrives.'},
      {signal:'A value makes earlier candidates permanently irrelevant',why:'You may be able to pop those candidates once, avoiding repeated scans.'},
    ],
    start:'Describe exactly what stays on the stack, its order, and what an incoming item resolves. Store indices when the result depends on distance or span.',
    distinguish:'Use a deque when candidates must leave from both ends, such as a sliding-window maximum. A heap is useful for repeated global extrema; a monotonic stack is useful for ordered, often nearest-neighbor relationships.',
    pitfalls:['Decide whether equal values should be popped; strict and non-strict comparisons can change boundaries.','Explain why a popped candidate is finished or dominated. Check for unresolved items remaining after the scan.'],
  },
  'Binary Search':{
    recognize:'Look for an ordered search space or a yes/no condition that changes only once as candidates increase.',
    clues:[
      {signal:'Sorted values or a sorted range',why:'A comparison can eliminate a whole side of the remaining search space.'},
      {signal:'Smallest feasible capacity, time, rate, or maximum allowed value',why:'If every larger candidate is also feasible, search for the first feasible one instead of trying them all.'},
      {signal:'A rotated or partly ordered structure',why:'You may still be able to identify a sorted half or another invariant that safely removes candidates.'},
    ],
    start:'Write the predicate and its True/False pattern first. Define what each bound includes and what the converged position represents. The detailed first-True template below covers one common form.',
    distinguish:'A minimum/maximum question is not automatically binary search. You need a monotonic predicate and a feasibility check worth repeating. Rotated arrays require reasoning beyond the ordinary globally sorted template.',
    pitfalls:['Ensure the answer is inside the initial bounds and handle the case where no candidate qualifies.','Check whether you want the first True, first False, or last True; they require consistent updates and return values.'],
  },
  'Linked List':{
    recognize:'You have nodes connected by references, and the operation is about links rather than random access.',
    clues:[
      {signal:'Insert, remove, reverse, merge, or reorder nodes in place',why:'Rewiring links can avoid copying the list or shifting array elements.'},
      {signal:'Middle, cycle, or a fixed gap between positions',why:'Slow/fast pointers or two pointers separated by k nodes may expose the needed relationship.'},
      {signal:'Repeated special cases at the head',why:'A dummy node can give every insertion or deletion a predecessor.'},
    ],
    start:'Draw a few nodes and name each pointer by its role. Save any next pointer you still need before overwriting a link, and define how the final tail terminates.',
    distinguish:'Array indexing is not constant time on a linked list. Sorting node values is also different from rearranging node identities. If the task requires direct lookup plus ordering, combine a map with links, as in LRU Cache.',
    pitfalls:['Split halves deliberately before reversing or weaving them; shared nodes can produce cycles.','Trace empty, one-node, odd-length, and even-length lists. Check the required return value versus an in-place update.'],
  },
  'Trees':{
    recognize:'The input has a root and subtrees, and the answer can often be built from smaller subtree results.',
    clues:[
      {signal:'Height, balance, subtree comparison, or a path aggregate',why:'DFS can return a small summary from each child and combine those summaries at its parent.'},
      {signal:'Levels, nearest depth, or left-to-right values per level',why:'A BFS queue visits nodes in increasing depth and can process one level at a time.'},
      {signal:'The tree is explicitly a binary search tree',why:'Its ordering invariant can guide search, pruning, or an inorder traversal.'},
    ],
    start:'Decide what one recursive call returns and what information must come from its parent. Then choose preorder, inorder, postorder, or BFS to match those dependencies.',
    distinguish:'A binary tree is not necessarily a BST. If parent links or other edges make revisits possible, treat traversal as a graph problem and track visited nodes as needed.',
    pitfalls:['Separate a path you may extend to the parent from a complete answer that combines both children.','Choose base cases deliberately. Consider a skewed tree, recursion depth, and all-negative values in maximum-path problems.'],
  },
  'Heap / Priority Queue':{
    recognize:'You repeatedly need the next smallest or largest item while the candidate set changes.',
    clues:[
      {signal:'Top k, kth largest/smallest, or streaming values',why:'A bounded heap can keep only the candidates that still matter.'},
      {signal:'Merge several sorted sources',why:'Keep the next item from each source and repeatedly take the best frontier item.'},
      {signal:'Earliest finishing active item or next cheapest candidate',why:'A priority queue avoids re-sorting the full candidate set after each change.'},
    ],
    start:'Define what the root must represent and whether the heap holds all candidates or only k of them. To retain the k largest values, a min-heap of size k exposes the weakest retained value.',
    distinguish:'If all values are known and only one sorted pass is needed, sorting may be simpler. A heap gives efficient access to its root, not sorted iteration or constant-time arbitrary lookup.',
    pitfalls:['Expiry and priority changes may require IDs, a map, and lazy removal of stale entries.','Check min-heap versus max-heap direction. In Python, equal tuple priorities may need a tie-breaker when the payloads cannot be compared.'],
    references:[{label:'Python heapq reference',href:'https://docs.python.org/3/library/heapq.html'}],
  },
  'Backtracking':{
    recognize:'You must explore alternative choices, usually to construct valid combinations, arrangements, or paths.',
    clues:[
      {signal:'Return all subsets, permutations, combinations, or valid boards',why:'The output itself may require branching through many possibilities.'},
      {signal:'A partial choice can become invalid early',why:'Prune the branch as soon as it cannot lead to a valid result.'},
      {signal:'Small constraints or an inherently exponential answer set',why:'An exponential search may be intended, but its branching factor and output size still matter.'},
    ],
    start:'Define the partial solution, choices at each step, validity check, and stopping condition. Choose, recurse, then undo any shared mutable state.',
    distinguish:'If you only need a count or best value and many branches reach the same remaining state, memoization/DP may avoid repeated work. Listing every solution still takes at least the size of the output.',
    pitfalls:['Copy a completed mutable path before storing it. Restore visited cells, counts, and choices on return.','Handle duplicate values without emitting duplicate answers, and distinguish reusable choices from choices allowed only once.'],
  },
  'Tries':{
    recognize:'Many word queries share prefixes, or you need to extend a dictionary match one character at a time.',
    clues:[
      {signal:'Repeated prefix queries or autocomplete',why:'A trie shares work across words with the same leading characters.'},
      {signal:'Find many dictionary words in a board or stream',why:'A partial trie match can stop exploration as soon as no dictionary word has that prefix.'},
      {signal:'Dictionary search with character wildcards',why:'A wildcard can branch over the current trie node’s children.'},
    ],
    start:'Define the alphabet, child representation, and end-of-word marker. Distinguish reaching a valid prefix from reaching a complete stored word.',
    distinguish:'For exact word membership alone, a hash set is often enough. For few prefix queries, a sorted word list plus binary search may be simpler and use less memory.',
    pitfalls:['A prefix is not automatically a complete word; handle words that are prefixes of other words.','Wildcard searches can branch exponentially. Board-search visited state belongs to the current path and must be restored.'],
  },
  'Graphs':{
    recognize:'The problem is about entities and allowed transitions, even if it is described as a grid, dependency list, or sequence of moves.',
    clues:[
      {signal:'Reachability, connected components, islands, or cycles',why:'DFS/BFS can explore each connected region while avoiding repeated visits.'},
      {signal:'Minimum number of moves with equal-cost edges',why:'BFS visits states in order of their distance in edges.'},
      {signal:'Prerequisites or repeatedly joining components',why:'Directed prerequisites suggest topological ordering; undirected connectivity updates may suggest union-find.'},
    ],
    start:'Define a node/state, its neighbors, and whether edges are directed or weighted. Include any resource or condition that affects future moves in the state.',
    distinguish:'DFS finds a path but does not generally find the shortest one. Equal-cost shortest paths fit BFS; weighted costs need further analysis. A topological order exists only for a directed acyclic graph.',
    pitfalls:['Mark a BFS state when adding it to the queue to avoid redundant work. Check all components when the graph may be disconnected.','One visited flag per location is insufficient if arriving with different remaining resources changes the possible future moves.'],
  },
  'Advanced Graphs':{
    recognize:'First identify the objective: cheapest route, cheapest connected network, dependency order, or a traversal with special constraints.',
    clues:[
      {signal:'Routes have costs or a limited resource',why:'Track the relevant distance and state, rather than just whether a vertex has been visited.'},
      {signal:'Connect all vertices with minimum total edge cost',why:'A minimum spanning tree method such as Kruskal or Prim targets a different objective from a shortest path.'},
      {signal:'Use every edge once, infer an order, or minimize a path’s largest edge',why:'These need an objective-specific method, such as Eulerian traversal, topological sorting, or a minimax search.'},
    ],
    start:'Choose the graph model and objective before choosing a data structure. Include stops, remaining budget, or other future-relevant constraints in the state; the cheapest arrival at a node may not dominate every other arrival.',
    distinguish:'For shortest paths: equal edge costs suggest BFS, costs of only 0 or 1 allow deque-based 0–1 BFS, and nonnegative weighted costs allow Dijkstra. Negative edges require another valid method. Repeated edge relaxation or DP may fit a limit on the number of edges used.',
    pitfalls:['A heap does not make an arbitrary greedy rule correct. Ordinary Dijkstra relies on nonnegative edge weights.','Do not confuse a minimum spanning tree with shortest routes from one source. Requiring every edge once is different from visiting every vertex.'],
    references:[{label:'Dijkstra and its assumptions',href:'https://cp-algorithms.com/graph/dijkstra.html'},{label:'0–1 BFS',href:'https://cp-algorithms.com/graph/01_bfs.html'}],
  },
  '1-D Dynamic Programming':{
    kind:'checklist',
    steps:[
      {label:'Recognize DP',text:'can the problem be expressed through smaller subproblems whose results repeat?'},
      {label:'Define the state',text:'which changing variables uniquely identify a subproblem?'},
      {label:'Define the recurrence',text:'what choices can you make, and how do their results combine?'},
      {label:'Set base cases',text:'which states have answers you know directly?'},
      {label:'Choose implementation',text:'recursive/top-down or iterative/bottom-up?'},
      {label:'Store results',text:'how will you avoid recalculating states?'},
      {label:'Analyze complexity',text:'number of states × work per state.'},
    ],
    clues:[
      'You’re counting ways, checking feasibility, or finding a minimum/maximum over a sequence or amount.',
      'You repeatedly face choices such as take or skip, or build an answer from earlier positions.',
      'The relevant history can be summarized by one main index, position, or remaining amount.',
    ],
    caveat:'These are clues rather than guarantees. A minimum/maximum question alone does not establish that DP is appropriate.',
    comparisons:[
      {label:'Greedy',text:'consider it when you can prove a local choice is always safe.'},
      {label:'Backtracking',text:'consider it when you must construct and return every valid solution. DP cannot eliminate the work of producing that output.'},
    ],
  },
  '2-D Dynamic Programming':{
    recognize:'The remaining work depends on two coordinates, such as two string positions, a grid cell, or an item index and a budget.',
    clues:[
      {signal:'Compare or align two sequences',why:'A state for a pair of positions can describe the remaining matching or editing problem.'},
      {signal:'Choose items while tracking a sum, capacity, or other limit',why:'The answer depends on both which choices remain and the remaining resource.'},
      {signal:'Grid routes or subinterval decisions',why:'A row/column or left/right boundary can identify reusable subproblems.'},
    ],
    start:'Explain precisely what each table entry means. Derive transitions and boundary states, then fill the table in dependency order or memoize an equivalent recurrence.',
    distinguish:'A 2-D input does not automatically require DP: a grid may be a BFS/DFS problem. The number of state variables comes from future decisions, not the input’s shape. Interval DP can have two state variables but many split-point transitions.',
    pitfalls:['With compressed knapsack DP, update direction controls whether an item can be reused. Loop order can also change whether you count combinations or ordered sequences.','Check empty prefixes, impossible states, and overlapping subproblems. Do not optimize memory before establishing which previous states must stay available.'],
    references:[{label:'Knapsack states and update order',href:'https://cp-algorithms.com/dynamic_programming/knapsack.html'}],
  },
  'Greedy':{
    recognize:'A local choice may be final because you can prove it leaves an equally good or better path to the global objective.',
    clues:[
      {signal:'Sorting exposes a useful order',why:'Processing by a deadline, finishing time, or another justified key may prevent future choices from being harmed.'},
      {signal:'One candidate dominates another',why:'You may be able to discard the worse candidate without losing an optimal solution.'},
      {signal:'A frontier or best reachable boundary summarizes progress',why:'You may only need the strongest state so far rather than every possible history.'},
    ],
    start:'Name the local rule and justify it with an exchange argument, a stays-ahead argument, or a dominance invariant. Try a small counterexample before implementing it.',
    distinguish:'Minimum/maximum wording does not establish a greedy solution. If choosing locally sacrifices a future tradeoff you cannot summarize or rule out, DP or search may be required. A greedy feasibility check can also sit inside binary search.',
    pitfalls:['“Take the largest” is not a proof: with coins 1, 3, 4 and target 6, taking 4 first uses more coins than 3 + 3.','Check ties, impossible states, and exactly what quantity is being optimized before copying a familiar sorting rule.'],
  },
  'Intervals':{
    recognize:'The input consists of ranges, occupied times, or start/end pairs, and the answer depends on how those ranges interact.',
    clues:[
      {signal:'Merge, insert, or detect overlapping ranges',why:'Sorting by start often turns the task into a scan with one active merged interval.'},
      {signal:'Maximum overlap or minimum simultaneous resources',why:'A sweep over events or a heap of active end times can track concurrency.'},
      {signal:'Choose compatible intervals',why:'Earliest-finish greedy fits the maximum number of unweighted intervals; differing rewards may require DP.'},
    ],
    start:'Clarify whether endpoints are inclusive and whether touching ranges overlap. Choose the ordering based on the objective, then state what your active interval, event count, or heap represents.',
    distinguish:'Merging, maximizing the number of non-overlapping intervals, and minimizing rooms are different objectives. They do not all use the same ordering or state. For more complex interval problems, heaps can manage the currently active candidates.',
    pitfalls:['For half-open time ranges, a resource ending at t can usually be reused by one starting at t; closed ranges can have different overlap rules.','A merge keeps the farthest active end. A resource allocator may need to remove every expired interval, depending on what its heap is meant to represent.'],
  },
  'Math & Geometry':{
    recognize:'Look for a numeric or spatial invariant that makes a direct simulation unnecessary or easier to reason about.',
    clues:[
      {signal:'Coordinates, symmetry, rotations, or matrix transformations',why:'Reasoning about where one point moves can reveal a consistent transformation.'},
      {signal:'Repeated cycles, huge iteration counts, or divisibility',why:'Modular arithmetic, a recurrence, or a repeating state may avoid simulating every step.'},
      {signal:'Counts or totals over a structured range',why:'A formula, factorization, or counting argument may replace enumerating all cases.'},
    ],
    start:'Work through small cases, state the invariant or coordinate relationship, and prove it continues to hold. Keep a straightforward simulation as a way to check small examples.',
    distinguish:'A matrix is not automatically a geometry problem; paths and connectivity may need graph traversal. A numeric pattern seen in a few examples is a hypothesis, not a proof of a formula.',
    pitfalls:['Prefer exact integer comparisons when possible; floating-point equality can be fragile.','Check zero, negatives, boundaries, and division by zero. For repeated-state simulations, verify both how the state is recorded and why repetition determines the future.'],
  },
};

const hardTreeNotes:StrategyNotes={
  recognize:'A tree problem becomes more involved when one child result must summarize several facts or a complete answer spans multiple subtrees.',
  clues:[
    {signal:'A result can pass through a node and both children',why:'Compute a complete candidate at that node, but return only a result that its parent is allowed to extend.'},
    {signal:'Validation depends on distant ancestors or several subtree facts',why:'Carry bounds downward or return a structured summary upward rather than comparing only immediate children.'},
    {signal:'Encode, reconstruct, or identify subtrees',why:'You need enough shape information to distinguish structures, including missing children where relevant.'},
  ],
  start:'Specify the meaning of every value returned by a recursive call and any global answer separately. Trace a leaf, a chain, and a node with two children.',
  distinguish:'Difficulty alone does not imply a special algorithm. Many hard tree problems are postorder DFS with a carefully chosen summary. If previous states truly repeat, memoization may help; an ordinary tree traversal already visits each node once.',
  pitfalls:['Do not return a branching path to a parent that can extend only one branch.','Check all-negative values and unbalanced trees. Serialization needs unambiguous boundaries and enough information about null children.'],
};

const hardLinkedListNotes:StrategyNotes={
  recognize:'The challenge is usually coordinating several lists or safely rewiring a segment while preserving all connections.',
  clues:[
    {signal:'Reverse or reorder groups of nodes',why:'Track the segment’s predecessor, start, end, and successor before changing its links.'},
    {signal:'Merge k sorted lists',why:'A heap of current heads or pairwise divide-and-conquer merges can select the next node without scanning all lists each time.'},
    {signal:'Strict space or node-identity requirements',why:'Pointer operations may be necessary even when collecting values in an array would be easier.'},
  ],
  start:'Draw the links before and after one small operation. Identify which references must survive the change, and verify the segment size before doing a group-specific operation.',
  distinguish:'These problems combine linked-list mechanics with another strategy. A heap or divide-and-conquer handles selection across lists; pointer manipulation handles the actual list structure.',
  pitfalls:['Keep detached suffixes reachable and reconnect both ends of a changed segment.','Check a final short group, empty lists, equal values, and whether nodes may be reused. Confirm that the output has no cycle.'],
};

export function notesForSection(theme:string,title=theme):StrategyNotes|undefined{
  if(title==='LRU Cache')return undefined;
  if(title==='Trees · Hard')return hardTreeNotes;
  if(title==='Linked List · Hard')return hardLinkedListNotes;
  return strategyNotes[theme];
}
