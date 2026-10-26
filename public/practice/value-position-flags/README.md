# Value Position Flags

This is a standalone coding exercise. Its rules and tests were created
for practice.
Read the full prompt in the tracker. All inputs and expected outputs are in
tests.json; the first three tests are examples. Do not mutate input arguments.

Implement `position_flags(target: int, nums: list[int], flags: list[int]) -> list[int]` in solution.py. Return the answer, rather than printing
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

Implement position_flags(target, nums, flags) -> list[int].

Return four integer 0/1 results in this exact order: whether target appears at an even index, at an odd index, in the first half of nums, and in the second half of nums. Indexes are zero-based. nums has even length; the first half contains indexes below len(nums) // 2, and the second half contains the rest.

flags contains exactly four integers, each 0 or 1, in the same order as the four checks. A disabled check (flag 0) must return 0 even if a matching value exists. An enabled check returns 1 if at least one matching occurrence satisfies it. Different occurrences may satisfy different checks. Return integers rather than Boolean values. Do not modify nums or flags.

Practice constraints: 0 <= len(nums) <= 100,000, with even length. Values and target are integers between -1,000,000,000 and 1,000,000,000. Empty input is valid and returns [0, 0, 0, 0].

Example 1: target = 5, nums = [5, 1, 2, 5], flags = [1, 1, 1, 1] → [1, 1, 1, 1].
Example 2: target = 7, nums = [0, 0, 7, 0], flags = [1, 1, 1, 1] → [1, 0, 0, 1].
Example 3: target = 5, nums = [5, 1, 2, 5], flags = [0, 1, 0, 1] → [0, 1, 0, 1].

Test the exact half boundary, odd indexes, disabled checks, repeated matches, and a missing target.
