# Bounding Rectangle

This is a practice reconstruction of a reported Upstart variation. The rules
and tests are original practice material, not Upstart's assessment test suite.
Read the full prompt in the tracker. All inputs and expected outputs are in
tests.json; the first three tests are examples. Do not mutate input arguments.

Implement `bounding_rectangle(points: list[list[int]]) -> list[int]` in solution.py. Return the answer, rather than printing
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

Implement bounding_rectangle(points) -> list[int].

Given a nonempty list of coordinate pairs [x, y], return the smallest axis-aligned rectangle containing every point. Represent the result as a four-element list [min_x, min_y, width, height], where width = max_x - min_x and height = max_y - min_y. These are geometric distances: do not add one to either dimension. Do not modify points.

Practice constraints: 1 <= len(points) <= 100,000. Coordinates are integers between -1,000,000,000 and 1,000,000,000. Repeated points are allowed. A single point produces zero width and zero height. Empty input is outside this practice contract.

Example 1: [[1, 4], [-2, 8], [3, 2]] → [-2, 2, 5, 6].
Example 2: [[5, -3]] → [5, -3, 0, 0].
Example 3: [[-4, -7], [-2, -3]] → [-4, -7, 2, 4].

Test all-negative coordinates, horizontal or vertical lines, and extrema found at different points. Return a list rather than a tuple.
