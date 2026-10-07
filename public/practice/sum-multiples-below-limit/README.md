# Sum Multiples Below Limit

This is a practice reconstruction of a reported Upstart variation. The rules
and tests are original practice material, not Upstart's assessment test suite.
Read the full prompt in the tracker. All inputs and expected outputs are in
tests.json; the first three tests are examples. Do not mutate input arguments.

Implement `sum_multiples_below(n: int) -> int` in solution.py. Return the answer, rather than printing
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

Implement sum_multiples_below(n) -> int.

Return the sum of all positive integers x such that x < n and x is divisible by 3, 5, or 7. Include each qualifying integer exactly once, even if it is divisible by more than one of these numbers. The upper bound n is excluded.

Practice constraint: n is an integer with 0 <= n <= 1,000,000. Return an integer; use a representation large enough for the total.

Example 1: n = 12 → 40, from 3 + 5 + 6 + 7 + 9 + 10.
Example 2: n = 3 → 0.
Example 3: n = 7 → 14, from 3 + 5 + 6; 7 itself is excluded.
Example 4: n = 16 → 81; 15 contributes only once.
Example 5: n = 0 → 0.

Test a limit divisible by 3, 5, or 7; overlapping multiples such as 15, 21, 35, and 105; and limits below the first qualifying number.
