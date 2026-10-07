# Scale Ingredients

This is a practice reconstruction of a reported Upstart variation. The rules
and tests are original practice material, not Upstart's assessment test suite.
Read the full prompt in the tracker. All inputs and expected outputs are in
tests.json; the first three tests are examples. Do not mutate input arguments.

Implement `scale_ingredients(ingredients: list[str], multiplier: int) -> list[str]` in solution.py. Return the answer, rather than printing
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

Implement scale_ingredients(ingredients, multiplier) -> list[str].

Each ingredient string starts with a nonnegative integer quantity, followed by at least one ASCII space, then a unit and an ingredient name. Multiply the leading quantity by multiplier. Return the updated strings in their original order, preserving every character after the original quantity exactly, including repeated spaces, capitalization, and the full ingredient name. Do not modify ingredients.

Practice rules: quantities are decimal integers between 0 and 1,000,000,000, with no leading zeros except the quantity 0. The multiplier is a positive integer between 1 and 1,000. Inputs are valid and contain ASCII text. Empty ingredient lists are allowed; an individual ingredient string is never empty. Handle up to 100,000 ingredients and 300,000 total input characters.

Example 1: ingredients = ["100 g flour", "50 g water"], multiplier = 8 → ["800 g flour", "400 g water"].
Example 2: ingredients = ["0 tsp salt", "2 tbsp olive oil"], multiplier = 3 → ["0 tsp salt", "6 tbsp olive oil"].
Example 3: ingredients = ["12  g  brown sugar"], multiplier = 2 → ["24  g  brown sugar"].

Test zero quantities, multiplier 1, multiword names, repeated spaces, and numbers elsewhere in ingredient names.
