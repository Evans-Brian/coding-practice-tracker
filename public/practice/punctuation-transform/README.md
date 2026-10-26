# Punctuation Transform

This is a standalone coding exercise. Its rules and tests were created
for practice.
Read the full prompt in the tracker. All inputs and expected outputs are in
tests.json; the first three tests are examples. Do not mutate input arguments.

Implement `rewrite_punctuation(text: str) -> str` in solution.py. Return the answer, rather than printing
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

Implement rewrite_punctuation(text) -> str.

Apply two rules to the original text: replace every period (.) with one exclamation mark (!), and append one extra ! to every maximal consecutive run of existing ! characters. Preserve all other characters exactly, including whitespace. Return the transformed string.

A maximal run is a consecutive group of ! characters that cannot be extended to the left or right in the original input. Each run receives just one additional !, regardless of its length. Exclamation marks created by replacing periods do not receive an additional mark. Apply the rules once; do not repeatedly transform newly created characters.

Practice constraints: 0 <= len(text) <= 100,000; text contains ASCII characters. Empty input returns "".

Example 1: "Hello. Nice to meet you!!" → "Hello! Nice to meet you!!!".
Example 2: ".!..!!" → "!!!!!!!!" (one converted period, a two-mark extended run, two converted periods, and a three-mark extended run).
Example 3: "" → "".

Test punctuation-only text, adjacent periods and exclamation runs, and whitespace between runs.
