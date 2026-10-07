"""Build deterministic practice fixtures and solution-free downloadable packs."""
import json
import random
import re
import string
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "practice"
CATALOG = []
PROMPTS = re.findall(r'prompt:`([\s\S]*?)`', (ROOT / "app" / "reported-variations.ts").read_text(encoding="utf-8"))
assert len(PROMPTS) == 5


def write_exercise(slug, function_name, arguments, signature, docstring, fixtures):
    cases = [{"id": f"case-{i + 1:02}", "name": name, "args": args,
              "expected": expected, "sample": i < 3}
             for i, (name, args, expected) in enumerate(fixtures)]
    assert len(cases) == 20
    starter = f'def {signature}:\n    """{docstring}"""\n    # Return the answer; do not print it.\n    raise NotImplementedError("Implement {function_name}")\n'
    folder = PUBLIC / slug
    folder.mkdir(parents=True, exist_ok=True)
    suite = {"functionName": function_name, "arguments": arguments, "cases": cases}
    (folder / "tests.json").write_text(json.dumps(suite, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
    (folder / "solution.py").write_text(starter, encoding="utf-8")
    instructions = f'''# {slug.replace('-', ' ').title()}

This is a practice reconstruction of a reported Upstart variation. The rules
and tests are original practice material, not Upstart's assessment test suite.
Read the full prompt in the tracker. All inputs and expected outputs are in
tests.json; the first three tests are examples. Do not mutate input arguments.

Implement `{signature}` in solution.py. Return the answer, rather than printing
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

{PROMPTS[len(CATALOG)]}
'''
    (folder / "README.md").write_text(instructions, encoding="utf-8")
    with zipfile.ZipFile(folder / "practice.zip", "w", zipfile.ZIP_DEFLATED) as archive:
        for filename in ["solution.py", "tests.json", "README.md"]:
            archive.write(folder / filename, filename)
        archive.write(PUBLIC / "variation-runner.py", "run_tests.py")
    CATALOG.append({"slug": slug, "problemId": "upstart-" + slug,
                    "functionName": function_name, "arguments": arguments,
                    "starter": starter, "testCount": len(cases), "examples": cases[:3]})


# Original plaintext gives an independent expected result for the cipher cases.
alphabet = string.ascii_lowercase
def encrypted_case(name, plaintext, first, second, chunks=False):
    ab, bc = dict(zip(alphabet, first)), dict(zip(alphabet, second))
    cipher = "".join(" " if c == " " else bc[ab[c]] for c in plaintext)
    known_ab = [[alphabet, first]]
    known_bc = [[alphabet, second]]
    if chunks:
        known_ab = [[alphabet[i:i + 5], first[i:i + 5]] for i in range(0, 26, 5)]
        known_bc = [[alphabet[i:i + 7], second[i:i + 7]] for i in range(0, 26, 7)]
    return name, [known_ab, known_bc, cipher], plaintext

decode = [
    ("Undo both substitutions", [[["abc", "bcd"]], [["bcd", "def"]], "fed def"], "cba abc"),
    ("Preserve repeated letters and spaces", [[["abc", "bcd"]], [["bcd", "def"]], "ddd  f"], "aaa  c"),
    ("Empty message", [[], [], ""], ""),
    ("Only spaces", [[], [], "   "], "   "),
    ("Single letter", [[["a", "z"]], [["z", "b"]], "b"], "a"),
    ("Repeated evidence", [[["abba", "xyyx"], ["a", "x"]], [["xy", "pq"]], "pqqp"], "abba"),
]
for name, plain, first, second, chunks in [
    ("Identity keys", "a quick fox", alphabet, alphabet, False),
    ("First key is identity", "hello world", alphabet, alphabet[::-1], False),
    ("Second key is identity", "hello world", alphabet[5:] + alphabet[:5], alphabet, False),
    ("Reverse alphabet", alphabet, alphabet[::-1], alphabet[3:] + alphabet[:3], False),
    ("Reverse order matters", "zebra garden", alphabet[7:] + alphabet[:7], alphabet[::-1], False),
    ("Split evidence pairs", "an example message", alphabet[1:] + alphabet[:1], alphabet[::-1], True),
    ("Leading and trailing spaces", "  hello  ", alphabet[::-1], alphabet[8:] + alphabet[:8], True),
    ("Multiple consecutive spaces", "one   two  three", alphabet[13:] + alphabet[:13], alphabet[::-1], False),
    ("All letters and repeats", alphabet * 5, alphabet[::-1], alphabet[11:] + alphabet[:11], True),
    ("Repeated short word", "abba abba abba", alphabet[2:] + alphabet[:2], alphabet[9:] + alphabet[:9], False),
    ("Overlapping alphabet letters", "banana", alphabet[1:] + alphabet[:1], alphabet[2:] + alphabet[:2], True),
    ("Long message", "abc " * 10000, alphabet[::-1], alphabet[17:] + alphabet[:17], True),
]:
    decode.append(encrypted_case(name, plain, first, second, chunks))
randomizer = random.Random(75)
for i in range(2):
    first, second = list(alphabet), list(alphabet)
    randomizer.shuffle(first)
    randomizer.shuffle(second)
    decode.append(encrypted_case(f"Mixed bijections {i + 1}", "practice every letter " + alphabet,
                                 "".join(first), "".join(second), True))
write_exercise("double-substitution-decoding", "decode_double", ["known_ab", "known_bc", "encrypted"],
               "decode_double(known_ab, known_bc, encrypted) -> str", "Undo two inferred substitution maps; preserve spaces.", decode)

# Small expected values use all pairs, rather than a sorting-based oracle.
arrays = [
    ("Return just the minimum value", [1, 20, 100, 3]),
    ("Duplicates give zero", [5, 5, 9]),
    ("Negative values", [-8, -2, 4]),
    ("Two values", [3, 8]), ("Equal values", [7, 7]),
    ("Unsorted consecutive values", [4, 1, 3, 2]), ("Already sorted", [1, 3, 9, 20]),
    ("Reverse sorted", [20, 9, 3, 1]), ("Zero and negatives", [0, -10, -1, 10]),
    ("Nonadjacent duplicates", [4, 99, -2, 4]), ("Equal best differences", [1, 5, 9, 13]),
    ("Large magnitudes", [-1000000000, 1000000000]),
    ("Mixed signs", [-100, -20, 40, 44]), ("All duplicates", [6] * 10),
    ("Close large values", [1000000000, 999999999, -1000000000]),
    ("Original neighbors are misleading", [1, 100, 2, 200]),
]
for i in range(3):
    arrays.append((f"Mixed small array {i + 1}", randomizer.sample(range(-1000, 1000), 20)))
minimum = [(name, [values], min(abs(a - b) for i, a in enumerate(values) for b in values[i + 1:]))
           for name, values in arrays]
minimum.append(("100,000 values", [list(range(1700000, 0, -17))], 17))
write_exercise("minimum-difference-value", "minimum_difference", ["nums"],
               "minimum_difference(nums) -> int", "Return the minimum difference between two distinct indexes.", minimum)

triples = [
    ("Interleave three strings", ["abc", "def", "ghi"]),
    ("One character each", ["x", "y", "z"]), ("Empty strings", ["", "", ""]),
    ("Spaces and punctuation", ["a ", "b!", "c?"]), ("Repeated letters", ["aaa", "bbb", "ccc"]),
    ("Identical strings", ["same", "same", "same"]), ("Mixed case", ["aB", "Cd", "eF"]),
    ("Digits", ["12", "34", "56"]), ("All spaces", ["  ", "  ", "  "]),
    ("Whitespace characters", ["a\n", "b\t", "c "]), ("Quotes and slashes", ["'\\", '"/', "[]"]),
    ("Distinct alphabets", [alphabet, alphabet.upper(), string.digits * 2 + "012345"]),
    ("No trimming", [" x ", " y ", " z "]), ("Symbols", ["!@#", "$%^", "&*?"]),
    ("Two same inputs", ["hello", "hello", "world"]), ("Repeated pattern", ["ab" * 40, "cd" * 40, "ef" * 40]),
    ("Long repeated strings", ["a" * 1000, "b" * 1000, "c" * 1000]),
    ("Alternating whitespace", [" a" * 100, "b " * 100, " c" * 100]),
    ("Long mixed strings", ["abc" * 1000, "DEF" * 1000, "123" * 1000]),
    ("100,000 characters per input", ["a" * 100000, "b" * 100000, "c" * 100000]),
]
interleave = [(name, args, "".join(a + b + c for a, b, c in zip(*args))) for name, args in triples]
write_exercise("interleave-three-strings", "interleave_three", ["a", "b", "c"],
               "interleave_three(a: str, b: str, c: str) -> str", "Interleave equal-length inputs in a, b, c order.", interleave)

word_inputs = [
    ("Match any allowed character", ["cat", "dog", "sky"], "ao"),
    ("Case-sensitive matches", ["A", "a", "aba", ""], "a"),
    ("Keep duplicate words", ["cat", "cat"], "t"),
    ("Empty word list", [], "abc"), ("Empty allowed string", ["cat"], ""),
    ("Empty words never match", ["", "", "a"], "a"),
    ("No matches", ["dog", "sky"], "at"), ("All match", ["a", "ba", "cat"], "a"),
    ("Multiple matching letters", ["aaaa", "ababa"], "ab"),
    ("Repeated allowed characters", ["apple", "dog", "pear"], "aaaa"),
    ("Preserve unsorted order", ["zoo", "cat", "dog", "apple"], "ao"),
    ("Uppercase only", ["cat", "CAT", "Cat"], "A"),
    ("Punctuation", ["yes!", "no?", "plain"], "!?"),
    ("Spaces are characters", ["two words", "one", " "], " "),
    ("Digits", ["a1", "b2", "c3"], "13"),
    ("Match the final character", ["xyzq", "abcq", "none"], "q"),
    ("One word", ["banana"], "n"), ("Empty everything", [], ""),
    ("Long word", ["z" * 40000 + "a", "z" * 40000], "a"),
    ("30,000 words", ["cat", "dog", "sky"] * 10000, "ao"),
]
filtering = [(name, [words, allowed], [word for word in words if any(letter in word for letter in allowed)])
             for name, words, allowed in word_inputs]
write_exercise("filter-words-by-characters", "filter_words", ["words", "allowed"],
               "filter_words(words, allowed) -> list[str]", "Keep words sharing at least one character; preserve order and duplicates.", filtering)

limits = [12, 3, 16, 0, 1, 2, 4, 5, 7, 8, 15, 21, 22, 35, 36, 105, 106, 1000, 999999, 1000000]
multiples = [(f"Exclusive limit {n:,}", [n], sum(x for x in range(1, n) if x % 3 == 0 or x % 5 == 0 or x % 7 == 0))
             for n in limits]
write_exercise("sum-multiples-below-limit", "sum_multiples_below", ["n"],
               "sum_multiples_below(n: int) -> int", "Sum positive multiples of 3, 5, or 7 strictly below n, counting each once.", multiples)

(ROOT / "app" / "practice" / "variation-catalog.json").write_text(json.dumps(CATALOG, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"exercises": len(CATALOG), "total_tests": sum(x["testCount"] for x in CATALOG)}))
