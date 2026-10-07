# Filter Words By Characters

This is a practice reconstruction of a reported Upstart variation. The rules
and tests are original practice material, not Upstart's assessment test suite.
Read the full prompt in the tracker. All inputs and expected outputs are in
tests.json; the first three tests are examples. Do not mutate input arguments.

Implement `filter_words(words, allowed) -> list[str]` in solution.py. Return the answer, rather than printing
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

Implement filter_words(words, allowed) -> list[str].

Keep each word that contains at least one character appearing in allowed. Return the matching words in their original order, including repeated words. Matching is case-sensitive. A word is included once per occurrence in words, even if several of its characters match. Do not modify words.

Practice rules: words and allowed contain ASCII characters. Empty input lists, empty words, and an empty allowed string are valid. An empty word never matches; an empty allowed string matches nothing. Handle up to 100,000 total input characters.

Example 1: words = ["cat", "dog", "sky"], allowed = "ao" → ["cat", "dog"].
Example 2: words = ["A", "a", "aba", ""], allowed = "a" → ["a", "aba"].
Example 3: words = ["cat", "cat"], allowed = "t" → ["cat", "cat"].
Example 4: words = ["cat"], allowed = "" → [].

Test no matches, multiple matching characters in one word, repeated allowed characters, and case differences.
