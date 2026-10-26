# Minimum Difference Value

This is a standalone coding exercise. Its rules and tests were created
for practice.
Read the full prompt in the tracker. All inputs and expected outputs are in
tests.json; the first three tests are examples. Do not mutate input arguments.

Implement `minimum_difference(nums) -> int` in solution.py. Return the answer, rather than printing
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

Implement minimum_difference(nums) -> int.

Given an integer list, return the smallest absolute difference between the values at any two distinct indexes. Return only the difference, not the pairs. Duplicate values are allowed and can produce a difference of zero. Do not mutate nums.

Practice constraints: 2 <= len(nums) <= 100,000 and -1,000,000,000 <= nums[i] <= 1,000,000,000.

Example 1: [1, 20, 100, 3] → 2.
Example 2: [5, 5, 9] → 0.
Example 3: [-8, -2, 4] → 6.
Example 4: [4, 1, 3, 2] → 1.

Test exactly two values, negative values, duplicate values, and unsorted input. Inputs with fewer than two values are outside this practice contract.
