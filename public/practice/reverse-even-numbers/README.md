# Reverse Even Numbers

This is a practice reconstruction of a reported Upstart variation. The rules
and tests are original practice material, not Upstart's assessment test suite.
Read the full prompt in the tracker. All inputs and expected outputs are in
tests.json; the first three tests are examples. Do not mutate input arguments.

Implement `reverse_evens(nums: list[int]) -> list[int]` in solution.py. Return the answer, rather than printing
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

Implement reverse_evens(nums) -> list[int].

Return only the even integers from nums, in the reverse of their original order of appearance. Preserve repeated values. Zero and negative even integers count as even. Return a new list without modifying nums.

Practice constraints: 0 <= len(nums) <= 100,000 and -1,000,000,000 <= nums[i] <= 1,000,000,000. Return [] when the input is empty or contains no even values.

Example 1: [2, 3, 4] → [4, 2].
Example 2: [-2, 1, 0, -4, -2] → [-2, -4, 0, -2].
Example 3: [1, 3, 5] → [].

Test all-even input, all-odd input, duplicates, zero, and negative values. Reversing is different from sorting in descending order.
