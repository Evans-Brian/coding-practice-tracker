# Alphabetical Word Count

This is a practice reconstruction of a reported Upstart variation. The rules
and tests are original practice material, not Upstart's assessment test suite.
Read the full prompt in the tracker. All inputs and expected outputs are in
tests.json; the first three tests are examples. Do not mutate input arguments.

Implement `count_words(words: list[str]) -> list[list]` in solution.py. Return the answer, rather than printing
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

Implement count_words(words) -> list[list].

Given a list of words, count how many times each distinct word occurs. Return a list of two-element lists [word, count], sorted in ascending lexicographical order by word. Counts must be integers. Each distinct word appears exactly once in the result.

Practice rules: matching is case-sensitive. Use Python's default string ordering: uppercase letters sort before lowercase letters. Words contain only ASCII letters and may be empty strings; an empty string is a valid word and sorts first. An empty input list returns []. Do not modify words. Handle up to 100,000 entries and 200,000 total characters.

Example 1: ["pear", "apple", "pear"] → [["apple", 1], ["pear", 2]].
Example 2: ["b", "a", "b", "a", "b"] → [["a", 2], ["b", 3]].
Example 3: [] → [].

Test empty words, mixed case, equal counts, and a common word that sorts after a less frequent word. Return lists rather than tuples.
