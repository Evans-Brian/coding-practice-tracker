# Decode an anagram sentence

This is a practice reconstruction inspired by an Upstart OA report:
https://www.1point3acres.com/bbs/thread-1153027-1-1.html
These rules and tests were created for practice, not supplied by Upstart.

Implement `decode_sentence(vocabulary: List[str], sentence: str) -> str`.

For every token in `sentence`, find the vocabulary word with the same letters
(including their counts), the same first letter, and the same last letter.
Return the restored words in the original token order, separated by one space.
Only the interior letters may be rearranged; leaving a word unchanged is valid.

Rules:
- Vocabulary words contain only lowercase English letters and have length 1–30.
- There are at most 10,000 vocabulary entries and 10,000 sentence tokens.
- Every sentence token has exactly one distinct matching vocabulary word.
  Duplicate entries of the same word are allowed; distinct ambiguous words are not.
- Tokens are separated by whitespace. Strip outer whitespace and normalize
  separators to a single space. Empty/whitespace-only sentences return "".
- The vocabulary may contain unused words. Do not mutate the input list.
- Return the answer; printing it is not sufficient.

Example:
vocabulary = ["pears", "spear", "something"]
sentence = "seapr sothinmeg"
answer = "spear something"

The first three cases in tests.json are examples. The complete suite also checks
short words, repeated letters, endpoint disambiguation, duplicate vocabulary
entries, whitespace, sentence order, and larger inputs.

Edit solution.py, then run (Python 3.9+; no extra packages required):

    python run_tests.py --samples
    python run_tests.py

You can also test a different file:

    python run_tests.py my_solution.py

All cases and expected answers are visible in tests.json. Try writing your own
edge cases before reviewing the suite. A pass checks this practice contract,
not whether an answer would pass Upstart's actual assessment.
