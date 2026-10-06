"""Shared test harness: used by the browser and by Python 3 locally."""
import contextlib
import copy
import io
import json
import traceback


def run_cases(source, cases):
    namespace = {"__name__": "__solution__"}
    console = io.StringIO()
    results = []
    with contextlib.redirect_stdout(console), contextlib.redirect_stderr(console):
        try:
            exec(compile(source, "solution.py", "exec"), namespace)
            solve = namespace.get("decode_sentence")
            if not callable(solve):
                raise TypeError("Define decode_sentence(vocabulary, sentence).")
        except BaseException:
            return {"results": [], "error": traceback.format_exc(limit=5),
                    "console": console.getvalue()[:4000]}
        for case in cases:
            actual = None
            error = None
            try:
                vocabulary = copy.deepcopy(case["vocabulary"])
                actual = solve(vocabulary, case["sentence"])
                if not isinstance(actual, str):
                    error = "Return a string, not " + type(actual).__name__ + "."
                    actual = repr(actual)[:2000]
                elif vocabulary != case["vocabulary"]:
                    error = "Do not mutate the input vocabulary list."
            except BaseException:
                error = traceback.format_exc(limit=4)
            results.append({"id": case["id"], "name": case["name"],
                            "passed": error is None and actual == case["expected"],
                            "actual": actual, "expected": case["expected"], "error": error})
    return {"results": results, "error": None, "console": console.getvalue()[:4000]}


if __name__ == "__main__":
    import argparse
    from pathlib import Path

    parser = argparse.ArgumentParser(description="Check your anagram-sentence solution.")
    parser.add_argument("solution", nargs="?", default="solution.py")
    parser.add_argument("--samples", action="store_true")
    args = parser.parse_args()
    cases = json.loads(Path(__file__).with_name("tests.json").read_text(encoding="utf-8"))
    if args.samples:
        cases = [case for case in cases if case.get("sample")]
    result = run_cases(Path(args.solution).read_text(encoding="utf-8"), cases)
    if result["error"]:
        print(result["error"])
        raise SystemExit(1)
    for row in result["results"]:
        print(("PASS" if row["passed"] else "FAIL") + "  " + row["name"])
        if not row["passed"]:
            print("  Expected:", repr(row["expected"][:500]))
            print("  Got:     ", repr(row["actual"])[:500])
            if row["error"]:
                print(row["error"])
    passed = sum(row["passed"] for row in result["results"])
    print(f"\n{passed}/{len(cases)} tests passed")
    if result["console"]:
        print("\nYour output:\n" + result["console"])
    raise SystemExit(0 if passed == len(cases) else 1)
