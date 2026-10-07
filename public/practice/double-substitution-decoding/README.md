# Double Substitution Decoding

This is a practice reconstruction of a reported Upstart variation. The rules
and tests are original practice material, not Upstart's assessment test suite.
Read the full prompt in the tracker. All inputs and expected outputs are in
tests.json; the first three tests are examples. Do not mutate input arguments.

Implement `decode_double(known_ab, known_bc, encrypted) -> str` in solution.py. Return the answer, rather than printing
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

Implement decode_double(known_ab, known_bc, encrypted) -> str.

A message was encrypted twice: first with a substitution from alphabet A to B, then with another substitution from B to C. known_ab contains (original, transformed) example pairs for the first step; known_bc contains pairs for the second. Recover the original message from encrypted, which is in alphabet C.

Practice rules: strings contain lowercase English letters and spaces. Spaces remain spaces at both steps. Each pair has equal-length strings; every non-space character maps consistently and one-to-one. Examples cover every mapping needed to decode encrypted. Repeated letters are allowed. Return a string; do not change the inputs. You do not need to validate inconsistent or incomplete examples.

Example 1: known_ab = [("abc", "bcd")], known_bc = [("bcd", "def")], encrypted = "fed def" → "cba abc".
Example 2: the same examples, encrypted = "ddd  f" → "aaa  c".
Example 3: empty encrypted text → "".

Test repeated characters, multiple example pairs, spaces, and mappings where a letter appears in both alphabets. Aim to handle 100,000 total example/message characters.
