# Buffet Revenue

This is a practice reconstruction of a reported Upstart variation. The rules
and tests are original practice material, not Upstart's assessment test suite.
Read the full prompt in the tracker. All inputs and expected outputs are in
tests.json; the first three tests are examples. Do not mutate input arguments.

Implement `buffet_revenue(prices: list[int], capacity: int, events: list[int]) -> int` in solution.py. Return the answer, rather than printing
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

Implement buffet_revenue(prices, capacity, events) -> int.

A restaurant starts empty. prices[id] is the nonnegative integer price for customer id. Process events in order; each event contains one customer ID. Each customer's first, third, fifth, and subsequent odd-numbered events are arrivals. Their second, fourth, sixth, and subsequent even-numbered events are departures. A customer can return after leaving.

On arrival, admit the customer if fewer than capacity customers are seated; otherwise they wait outside. On departure, a seated customer leaves and frees a seat; a waiting customer simply leaves the waiting area. Waiting customers are never automatically admitted when a seat opens, and do not retry admission until they have departed and arrived again. Charge a customer only on their first successful admission, at their listed price; later admissions earn no additional revenue. Return total revenue as an integer. Do not modify any inputs.

Practice constraints: 0 <= len(prices) <= 100,000, 0 <= prices[id] <= 1,000,000,000, 1 <= capacity <= 100,000, and 0 <= len(events) <= 100,000. Every event ID is a valid index in prices. Empty events return 0; if prices is empty then events is also empty. Events may end with customers still seated or waiting.

Example 1: prices = [10, 20, 30], capacity = 2, events = [0, 1, 2, 0, 2, 0] → 30. Customer 2 waits and later leaves without admission; customer 0's return is free.
Example 2: prices = [10, 20], capacity = 1, events = [0, 1, 0, 1, 1] → 30. Customer 1 is admitted only after leaving the waiting area and returning.
Example 3: prices = [10, 20], capacity = 1, events = [] → 0.

Test full capacity, waiting departures, return visits, zero-price customers, and seats opening while somebody waits. These waiting and charging rules are explicit practice assumptions for the reported task.
