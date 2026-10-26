# Deduplicate Integers

This is a standalone coding exercise. Its rules and tests were created
for practice.
Read the full prompt in the tracker. All inputs and expected outputs are in
tests.json; the first three tests are examples. Do not mutate input arguments.

Implement `deduplicate(nums: list[int]) -> list[int]` in solution.py. Return the answer, rather than printing
it. Python 3.9+ is sufficient; no third-party packages are required.

Run the examples:

    python run_tests.py --samples

Run all 20 tests:

    python run_tests.py

Test another solution file:

    python run_tests.py my_solution.py

The browser editor uses the same test runner and fixtures. Stop an endless loop
with the editor's Stop run button, or interrupt the local Python process.

## Full practice contract

Implement deduplicate(nums) -> list[int].

Return a new list containing each distinct integer from nums exactly once. Keep the first occurrence of each value and preserve the order of those first occurrences. The input is not necessarily sorted. Do not modify nums.

Practice constraints: 0 <= len(nums) <= 100,000 and -1,000,000,000 <= nums[i] <= 1,000,000,000. Empty input returns []. Zero and negative integers are valid.

Example 1: [3, 5, 3, 7, 5] → [3, 5, 7].
Example 2: [-2, 0, -2, -1, 0] → [-2, 0, -1].
Example 3: [] → [].

Test duplicates separated by other values, all-identical values, and an already unique list. Sorting the answer would change the required order.
