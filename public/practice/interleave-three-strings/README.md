# Interleave Three Strings

This is a practice reconstruction of a reported Upstart variation. The rules
and tests are original practice material, not Upstart's assessment test suite.
Read the full prompt in the tracker. All inputs and expected outputs are in
tests.json; the first three tests are examples. Do not mutate input arguments.

Implement `interleave_three(a: str, b: str, c: str) -> str` in solution.py. Return the answer, rather than printing
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

Implement interleave_three(a, b, c) -> str.

Return a string containing a[0], b[0], c[0], then a[1], b[1], c[1], and so on. The three strings are guaranteed to have equal length. Treat spaces and punctuation as ordinary characters; preserve every character exactly.

Practice constraints: 0 <= len(a) = len(b) = len(c) <= 100,000. Inputs use ASCII characters. Unequal-length inputs are outside this practice contract.

Example 1: a = "abc", b = "def", c = "ghi" → "adgbehcfi".
Example 2: a = "x", b = "y", c = "z" → "xyz".
Example 3: a = "", b = "", c = "" → "".
Example 4: a = "a ", b = "b!", c = "c?" → "abc !?".

Test empty strings, single-character strings, repeated characters, and embedded spaces. The result must contain exactly three times as many characters as one input.
