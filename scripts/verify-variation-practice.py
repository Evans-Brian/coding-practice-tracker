"""Verify fixtures, runnable packs, and useful failure detection."""
import importlib.util
import json
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "practice"
spec = importlib.util.spec_from_file_location("practice_runner", PUBLIC / "variation-runner.py")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)

REFERENCES = {
    "double-substitution-decoding": '''def decode_double(known_ab, known_bc, encrypted):
    undo_ab = {b: a for left, right in known_ab for a, b in zip(left, right)}
    undo_bc = {c: b for left, right in known_bc for b, c in zip(left, right)}
    return ''.join(' ' if c == ' ' else undo_ab[undo_bc[c]] for c in encrypted)
''',
    "minimum-difference-value": '''def minimum_difference(nums):
    ordered = sorted(nums)
    return min(ordered[i] - ordered[i - 1] for i in range(1, len(ordered)))
''',
    "interleave-three-strings": '''def interleave_three(a, b, c):
    pieces = []
    for i in range(len(a)):
        pieces.extend([a[i], b[i], c[i]])
    return ''.join(pieces)
''',
    "filter-words-by-characters": '''def filter_words(words, allowed):
    targets = set(allowed)
    return [word for word in words if any(c in targets for c in word)]
''',
    "sum-multiples-below-limit": '''def sum_multiples_below(n):
    def total(divisor):
        count = (n - 1) // divisor if n else 0
        return divisor * count * (count + 1) // 2
    return total(3) + total(5) + total(7) - total(15) - total(21) - total(35) + total(105)
''',
}
WRONG = {
    "double-substitution-decoding": '''def decode_double(known_ab, known_bc, encrypted):
    undo_ab = {b: a for left, right in known_ab for a, b in zip(left, right)}
    undo_bc = {c: b for left, right in known_bc for b, c in zip(left, right)}
    return ''.join(' ' if c == ' ' else undo_bc[undo_ab[c]] for c in encrypted)
''',
    "minimum-difference-value": '''def minimum_difference(nums):
    nums.sort()
    return min(b - a for a, b in zip(nums, nums[1:]))
''',
    "interleave-three-strings": '''def interleave_three(a, b, c):
    return ''.join(x + z + y for x, y, z in zip(a, b, c))
''',
    "filter-words-by-characters": '''def filter_words(words, allowed):
    return [word for word in words if all(c in allowed for c in word)]
''',
    "sum-multiples-below-limit": '''def sum_multiples_below(n):
    return sum(x for x in range(1, n + 1) if x % 3 == 0 or x % 5 == 0 or x % 7 == 0)
''',
}


def main():
    catalog = json.loads((ROOT / "app" / "practice" / "variation-catalog.json").read_text(encoding="utf-8"))
    count = 0
    for exercise in catalog:
        slug = exercise["slug"]
        suite = json.loads((PUBLIC / slug / "tests.json").read_text(encoding="utf-8"))
        cases = suite["cases"]
        assert len(cases) == exercise["testCount"] == 20
        assert [c for c in cases if c["sample"]] == exercise["examples"]
        assert len({c["id"] for c in cases}) == 20
        assert suite["functionName"] == exercise["functionName"]
        result = runner.run_cases(REFERENCES[slug], cases, suite["functionName"])
        assert not result["error"], result["error"]
        assert all(row["passed"] for row in result["results"]), result
        bad = runner.run_cases(WRONG[slug], cases, suite["functionName"])
        assert any(not row["passed"] for row in bad["results"]), slug + " accepted a known wrong approach"
        starter = runner.run_cases(exercise["starter"], cases[:3], suite["functionName"])
        assert not any(row["passed"] for row in starter["results"])
        with tempfile.TemporaryDirectory(prefix="upstart-editor-check-") as directory:
            folder = Path(directory)
            with zipfile.ZipFile(PUBLIC / slug / "practice.zip") as archive:
                assert set(archive.namelist()) == {"README.md", "solution.py", "tests.json", "run_tests.py"}
                archive.extractall(folder)
            assert (folder / "run_tests.py").read_bytes() == (PUBLIC / "variation-runner.py").read_bytes()
            (folder / "solution.py").write_text(REFERENCES[slug], encoding="utf-8")
            command = subprocess.run([sys.executable, "run_tests.py"], cwd=folder, capture_output=True, text=True, timeout=20)
            assert command.returncode == 0, command.stdout + command.stderr
            assert "20/20 tests passed" in command.stdout
        count += len(cases)
        print(slug + ": 20/20; incorrect approach rejected; downloadable pack passed")
    integer_case = [{"id": "type", "name": "Strict integer return", "args": [1], "expected": 1}]
    assert not runner.run_cases("def f(n): return True", integer_case, "f")["results"][0]["passed"]
    assert runner.run_cases("def f(:", integer_case, "f")["error"]
    assert runner.run_cases("x = 1", integer_case, "f")["error"]
    printed = runner.run_cases("def f(n):\n print('x' * 100000)\n return n", integer_case, "f")
    assert len(printed["console"]) == 4000 and printed["results"][0]["passed"]
    print(f"Verified {count} tests, five practice packs, and harness error handling.")


if __name__ == "__main__":
    main()
