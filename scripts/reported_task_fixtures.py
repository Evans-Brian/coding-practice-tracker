"""Deterministic fixtures for the remaining reported-task practice editors."""
import re
from collections import Counter


def build_fixtures():
    words = [
        ("Alphabetical order, not frequency", ["pear", "apple", "pear"]),
        ("Unequal counts", ["b", "a", "b", "a", "b"]),
        ("Empty list", []), ("One word", ["hello"]),
        ("All the same word", ["a"] * 12),
        ("Already ordered", ["a", "b", "c"]),
        ("Reverse input order", ["z", "m", "a"]),
        ("Equal frequencies", ["z", "a", "z", "a"]),
        ("Case-sensitive words", ["apple", "Apple", "APPLE", "apple"]),
        ("Empty word is counted", ["", "a", "", "b"]),
        ("Only empty words", ["", "", ""]),
        ("Prefix ordering", ["aaa", "a", "aa", "a"]),
        ("Uppercase sorts first", ["z", "A", "a", "Z"]),
        ("Similar spellings", ["tea", "eat", "ate", "tea"]),
        ("Interspersed repeats", ["cat", "dog", "cat", "bird", "dog", "cat"]),
        ("Mixed empty words and case", ["b", "", "B", "", "b"]),
        ("Long word", ["a" * 1000, "a", "a" * 1000]),
        ("Several prefix groups", ["aa", "ab", "ba", "bb", "aa", "b"]),
        ("Frequency does not break ordering", ["z"] * 100 + ["a", "b", "b"]),
        ("100,000 entries", ["z", "a", "z", "B"] * 25000),
    ]
    counts = [(name, [values], [[word, count] for word, count in sorted(Counter(values).items())])
              for name, values in words]

    dedupe = [
        ("Keep first occurrences", [[3, 5, 3, 7, 5]], [3, 5, 7]),
        ("Negative values and zero", [[-2, 0, -2, -1, 0]], [-2, 0, -1]),
        ("Empty list", [[]], []), ("One value", [[9]], [9]),
        ("All duplicates", [[4] * 20], [4]),
        ("Already unique", [[8, 1, -4, 0]], [8, 1, -4, 0]),
        ("Do not sort", [[9, 2, 7, 1, 9]], [9, 2, 7, 1]),
        ("Repeated zero", [[0, 0, 0]], [0]),
        ("Adjacent duplicates", [[1, 1, 2, 2, 3, 3]], [1, 2, 3]),
        ("Separated duplicates", [[1, 2, 3, 1, 2, 3]], [1, 2, 3]),
        ("Equal magnitude different signs", [[-5, 5, -5, 5]], [-5, 5]),
        ("Large magnitudes", [[1000000000, -1000000000, 1000000000]], [1000000000, -1000000000]),
        ("Last value is new", [[2, 2, 2, 3]], [2, 3]),
        ("Duplicate of first comes last", [[4, 2, 1, 4]], [4, 2, 1]),
        ("Alternating repeats", [[7, -7] * 50], [7, -7]),
        ("Zero between repeats", [[2, 0, 2, 0, -2]], [2, 0, -2]),
        ("Descending input", [[5, 4, 3, 2, 1]], [5, 4, 3, 2, 1]),
        ("100,000 identical values", [[6] * 100000], [6]),
        ("50,000 unique values repeated", [list(range(50000)) * 2], list(range(50000))),
        ("100,000 unique values", [list(range(100000, 0, -1))], list(range(100000, 0, -1))),
    ]

    punctuation_texts = [
        ("Periods and existing run", "Hello. Nice to meet you!!"),
        ("Adjacent original runs and periods", ".!..!!"),
        ("Empty text", ""), ("No punctuation", "hello world"),
        ("One period", "."), ("One exclamation", "!"),
        ("Long original run", "!!!!!"), ("Only periods", "...."),
        ("Run before period", "!!.."), ("Period before run", "..!!"),
        ("Separated runs", "a!b!!c!!!"), ("Preserve spaces", " !  . !! "),
        ("Preserve tabs and newlines", "\t!\n.\n!!\t"),
        ("Other punctuation unchanged", "? , ; : ' \" - () []"),
        ("Alternating punctuation", ".!.!.!"),
        ("Runs at both ends", "!!hello!"),
        ("Mixed case and digits", "A1.b2!C3!!"),
        ("Long period sequence", "." * 100000),
        ("100,000 original exclamations", "!" * 100000),
        ("Many separated runs", "a!." * 30000),
    ]
    punctuation = [(name, [text], re.sub(r"!+|\.", lambda m: "!" if m[0] == "." else m[0] + "!", text))
                   for name, text in punctuation_texts]

    reverse = [
        ("Reverse filtered order", [[2, 3, 4]], [4, 2]),
        ("Negative values, zero, and duplicates", [[-2, 1, 0, -4, -2]], [-2, -4, 0, -2]),
        ("No even values", [[1, 3, 5]], []),
        ("Empty input", [[]], []), ("Single even", [[8]], [8]),
        ("Single odd", [[9]], []), ("Zero is even", [[0]], [0]),
        ("All even", [[2, 6, 4]], [4, 6, 2]),
        ("Preserve repeated values", [[2, 2, 4, 2]], [2, 4, 2, 2]),
        ("Do not sort", [[8, 2, 6]], [6, 2, 8]),
        ("All negative", [[-5, -4, -3, -2]], [-2, -4]),
        ("Zero among odd values", [[1, 0, 3, 0, 5]], [0, 0]),
        ("Even values at both ends", [[2, 1, 3, 4]], [4, 2]),
        ("Odd values at both ends", [[1, 2, 4, 3]], [4, 2]),
        ("Large magnitudes", [[-1000000000, 999999999, 1000000000]], [1000000000, -1000000000]),
        ("Alternating signs", [[2, -2, 3, -3, 4, -4]], [-4, 4, -2, 2]),
        ("100,000 odd values", [[1] * 100000], []),
        ("100,000 zeros", [[0] * 100000], [0] * 100000),
        ("Large alternating input", [[1, 2] * 50000], [2] * 50000),
        ("Large ordered input", [list(range(100000))], list(range(99998, -1, -2))),
    ]

    rectangles = [
        ("Extrema at different points", [[[1, 4], [-2, 8], [3, 2]]], [-2, 2, 5, 6]),
        ("Single point", [[[5, -3]]], [5, -3, 0, 0]),
        ("All negative coordinates", [[[-4, -7], [-2, -3]]], [-4, -7, 2, 4]),
        ("Origin", [[[0, 0]]], [0, 0, 0, 0]),
        ("Duplicate points", [[[2, 3]] * 8], [2, 3, 0, 0]),
        ("Horizontal line", [[[-4, 7], [2, 7], [9, 7]]], [-4, 7, 13, 0]),
        ("Vertical line", [[[3, -5], [3, 4], [3, 10]]], [3, -5, 0, 15]),
        ("Two opposite corners", [[[1, 2], [5, 8]]], [1, 2, 4, 6]),
        ("Reverse corner order", [[[5, 8], [1, 2]]], [1, 2, 4, 6]),
        ("Cross the origin", [[[-5, 4], [7, -9]]], [-5, -9, 12, 13]),
        ("Inside points do not change bounds", [[[0, 0], [10, 10], [3, 7], [9, 2]]], [0, 0, 10, 10]),
        ("Every extreme is separate", [[[-7, 1], [9, 2], [0, -8], [3, 12]]], [-7, -8, 16, 20]),
        ("Geometric dimensions, no plus one", [[[0, 0], [1, 1]]], [0, 0, 1, 1]),
        ("Large coordinate magnitudes", [[[-1000000000, -1000000000], [1000000000, 1000000000]]], [-1000000000, -1000000000, 2000000000, 2000000000]),
        ("Extrema come late", [[[0, 0], [1, 1], [-4, -6], [8, 3]]], [-4, -6, 12, 9]),
        ("Repeated corner and inside point", [[[1, 1], [1, 1], [5, 6], [2, 3]]], [1, 1, 4, 5]),
        ("Positive rectangle away from origin", [[[10, 20], [15, 25]]], [10, 20, 5, 5]),
        ("100,000 repeated points", [[[8, -8]] * 100000], [8, -8, 0, 0]),
        ("100,000 diagonal points", [[[i, -i] for i in range(100000)]], [0, -99999, 99999, 99999]),
        ("100,000 collinear points", [[[5, i] for i in range(100000)]], [5, 0, 0, 99999]),
    ]

    scaling = [
        ("Scale two ingredients", [["100 g flour", "50 g water"], 8], ["800 g flour", "400 g water"]),
        ("Zero and multiword name", [["0 tsp salt", "2 tbsp olive oil"], 3], ["0 tsp salt", "6 tbsp olive oil"]),
        ("Preserve repeated spaces", [["12  g  brown sugar"], 2], ["24  g  brown sugar"]),
        ("Empty ingredient list", [[], 8], []),
        ("Multiplier one", [["23 g Flour"], 1], ["23 g Flour"]),
        ("Single digit quantity", [["2 cups milk"], 4], ["8 cups milk"]),
        ("Carry into another digit", [["9 g salt"], 12], ["108 g salt"]),
        ("Zero stays zero", [["0 ml water"], 1000], ["0 ml water"]),
        ("Maximum quantity and multiplier", [["1000000000 g flour"], 1000], ["1000000000000 g flour"]),
        ("Numbers in name are unchanged", [["10 g vitamin B12"], 2], ["20 g vitamin B12"]),
        ("Preserve capitalization", [["4 TBSP Extra Virgin Olive Oil"], 3], ["12 TBSP Extra Virgin Olive Oil"]),
        ("Preserve punctuation", [["5 g cocoa (unsweetened)"], 2], ["10 g cocoa (unsweetened)"]),
        ("Trailing spaces remain", [["7 g salt  "], 3], ["21 g salt  "]),
        ("Three spaces after quantity", [["3   kg potatoes"], 5], ["15   kg potatoes"]),
        ("Mixed quantities", [["0 g salt", "1 l water", "100 g rice"], 7], ["0 g salt", "7 l water", "700 g rice"]),
        ("Duplicate ingredients", [["2 g salt", "2 g salt"], 4], ["8 g salt", "8 g salt"]),
        ("Unsorted input preserved", [["9 g Zest", "2 g Apple"], 2], ["18 g Zest", "4 g Apple"]),
        ("Large two-value list", [["999999999 g rice", "1000000000 g water"], 2], ["1999999998 g rice", "2000000000 g water"]),
        ("Long ingredient name", [["1 g " + "a" * 1000], 12], ["12 g " + "a" * 1000]),
        ("Large ingredient list", [["1 g x"] * 40000, 1000], ["1000 g x"] * 40000),
    ]

    position_inputs = [
        ("Different occurrences satisfy all checks", 5, [5, 1, 2, 5], [1, 1, 1, 1]),
        ("Match at exact half boundary", 7, [0, 0, 7, 0], [1, 1, 1, 1]),
        ("Disable some matching checks", 5, [5, 1, 2, 5], [0, 1, 0, 1]),
        ("Empty input", 5, [], [1, 1, 1, 1]),
        ("Target missing", 9, [1, 2, 3, 4], [1, 1, 1, 1]),
        ("First index only", 8, [8, 0], [1, 1, 1, 1]),
        ("Last index only", 8, [0, 8], [1, 1, 1, 1]),
        ("Odd index in first half", 7, [0, 7, 0, 0, 0, 0], [1, 1, 1, 1]),
        ("Odd index in second half", 7, [0, 0, 0, 7, 0, 0], [1, 1, 1, 1]),
        ("Even index in first half", 7, [0, 0, 7, 0, 0, 0], [1, 1, 1, 1]),
        ("Even index in second half", 7, [0, 0, 0, 0, 7, 0], [1, 1, 1, 1]),
        ("All flags disabled", 4, [4, 4, 4, 4], [0, 0, 0, 0]),
        ("Only even-index check enabled", 4, [4, 4, 4, 4], [1, 0, 0, 0]),
        ("Only odd-index check enabled", 4, [4, 4, 4, 4], [0, 1, 0, 0]),
        ("Only first-half check enabled", 4, [4, 4, 4, 4], [0, 0, 1, 0]),
        ("Only second-half check enabled", 4, [4, 4, 4, 4], [0, 0, 0, 1]),
        ("Zero is a valid target", 0, [1, 0, 0, 1], [1, 1, 1, 1]),
        ("Negative target", -3, [-3, 2, -3, -3], [1, 0, 1, 1]),
        ("100,000 matching values", 2, [2] * 100000, [1, 1, 1, 1]),
        ("Match only at final index of large input", 9, [0] * 99999 + [9], [1, 1, 1, 1]),
    ]
    positions = []
    for name, target, nums, flags in position_inputs:
        indexes = [i for i, value in enumerate(nums) if value == target]
        checks = [any(i % 2 == 0 for i in indexes), any(i % 2 == 1 for i in indexes),
                  any(i < len(nums) // 2 for i in indexes), any(i >= len(nums) // 2 for i in indexes)]
        positions.append((name, [target, nums, flags], [int(enabled and found) for enabled, found in zip(flags, checks)]))

    buffet = [
        ("Waiting and free return visit", [[10, 20, 30], 2, [0, 1, 2, 0, 2, 0]], 30),
        ("Waiting customer leaves and retries", [[10, 20], 1, [0, 1, 0, 1, 1]], 30),
        ("No events", [[10, 20], 1, []], 0),
        ("One arrival", [[7], 1, [0]], 7),
        ("Arrival and departure", [[7], 1, [0, 0]], 7),
        ("Repeated admissions pay once", [[7], 1, [0] * 10], 7),
        ("Fill exact capacity", [[3, 5, 7], 3, [0, 1, 2]], 15),
        ("Third arrival waits", [[3, 5, 7], 2, [0, 1, 2]], 8),
        ("Waiting departure does not free a seat", [[10, 20, 30], 1, [0, 1, 1, 2]], 10),
        ("No automatic admission when seat opens", [[10, 20], 1, [0, 1, 0]], 10),
        ("New arrival uses seat while another waits", [[10, 20, 30], 1, [0, 1, 0, 2]], 40),
        ("Waiting return still blocked", [[10, 20], 1, [0, 1, 1, 1]], 10),
        ("Zero-price customer occupies a seat", [[0, 20], 1, [0, 1]], 0),
        ("Zero-price customer leaves", [[0, 20], 1, [0, 0, 1]], 20),
        ("Large prices", [[1000000000, 1000000000, 1000000000], 3, [0, 1, 2]], 3000000000),
        ("Capacity larger than customer count", [[2, 3], 100000, [1, 0, 1, 0, 1, 0]], 5),
        ("Unused customers earn nothing", [[10, 100, 1000], 2, [1]], 100),
        ("No customers", [[], 1, []], 0),
        ("100,000 admissions and departures", [[9], 1, [0] * 100000], 9),
        ("100,000 customers with limited capacity", [[1] * 100000, 50000, list(range(100000))], 50000),
    ]
    return {
        "alphabetical-word-count": counts, "deduplicate-integers": dedupe,
        "punctuation-transform": punctuation, "reverse-even-numbers": reverse,
        "bounding-rectangle": rectangles, "scale-ingredients": scaling,
        "value-position-flags": positions, "buffet-revenue": buffet,
    }
