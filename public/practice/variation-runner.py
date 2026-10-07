"""Run a practice suite in the browser or with standard Python 3."""
import contextlib
import copy
import io
import json
import traceback


class LimitedOutput(io.StringIO):
    def write(self, value):
        remaining = max(0, 4000 - self.tell())
        super().write(value[:remaining])
        return len(value)


def run_cases(source, cases, function_name):
    namespace = {"__name__": "__solution__"}
    console = LimitedOutput()
    results = []
    with contextlib.redirect_stdout(console), contextlib.redirect_stderr(console):
        try:
            exec(compile(source, "solution.py", "exec"), namespace)
            solve = namespace.get(function_name)
            if not callable(solve):
                raise TypeError("Define the function " + function_name + " with the specified arguments.")
        except BaseException:
            return {"results": [], "error": traceback.format_exc(limit=5), "console": console.getvalue()}
        for case in cases:
            actual = None
            error = None
            try:
                inputs = copy.deepcopy(case["args"])
                actual = solve(*inputs)
                expected = case["expected"]
                if type(actual) is not type(expected):
                    error = "Return " + type(expected).__name__ + ", not " + type(actual).__name__ + "."
                    actual = repr(actual)[:2000]
                elif inputs != case["args"]:
                    error = "Do not mutate the input arguments."
                else:
                    # Make result serialization errors visible as per-case failures.
                    json.dumps(actual)
            except BaseException:
                error = traceback.format_exc(limit=4)
                actual = repr(actual)[:2000] if actual is not None else None
            results.append({"id": case["id"], "name": case["name"],
                            "passed": error is None and actual == case["expected"],
                            "actual": actual, "expected": case["expected"], "error": error})
    return {"results": results, "error": None, "console": console.getvalue()}


if __name__ == "__main__":
    import argparse
    from pathlib import Path

    parser = argparse.ArgumentParser(description="Check your practice solution.")
    parser.add_argument("solution", nargs="?", default="solution.py")
    parser.add_argument("--samples", action="store_true")
    args = parser.parse_args()
    suite = json.loads(Path(__file__).with_name("tests.json").read_text(encoding="utf-8"))
    cases = [case for case in suite["cases"] if case["sample"]] if args.samples else suite["cases"]
    result = run_cases(Path(args.solution).read_text(encoding="utf-8"), cases, suite["functionName"])
    if result["error"]:
        print(result["error"])
        raise SystemExit(1)
    for row in result["results"]:
        print(("PASS" if row["passed"] else "FAIL") + "  " + row["name"])
        if not row["passed"]:
            print("  Expected:", repr(row["expected"])[:500])
            print("  Got:     ", repr(row["actual"])[:500])
            if row["error"]:
                print(row["error"])
    passed = sum(row["passed"] for row in result["results"])
    print(f"\n{passed}/{len(cases)} tests passed")
    if result["console"]:
        print("\nYour output:\n" + result["console"])
    raise SystemExit(0 if passed == len(cases) else 1)
