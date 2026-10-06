// Keep Python execution off the UI thread so an endless loop can be stopped.
// Pinned to the version documented at pyodide.org/en/stable/usage/webworker.html.
const runtimeURL = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';
let python;
let cases;
let initialization;

async function initialize() {
  const [{loadPyodide}, harness, testData] = await Promise.all([
    import(runtimeURL + 'pyodide.mjs'),
    fetch('./run_tests.py').then(r => { if (!r.ok) throw Error('Could not load the test runner.'); return r.text(); }),
    fetch('./tests.json').then(r => { if (!r.ok) throw Error('Could not load the test data.'); return r.json(); })
  ]);
  python = await loadPyodide({indexURL: runtimeURL});
  python.globals.set('__name__', '__practice_runner__');
  python.runPython(harness);
  cases = testData;
}

self.onmessage = async ({data}) => {
  try {
    initialization ??= initialize();
    await initialization;
    self.postMessage({type: 'running'});
    const selected = data.suite === 'samples' ? cases.filter(c => c.sample) : cases;
    python.globals.set('_practice_source', data.code);
    python.globals.set('_practice_cases_json', JSON.stringify(selected));
    const result = python.runPython('json.dumps(run_cases(_practice_source, json.loads(_practice_cases_json)))');
    self.postMessage({type: 'result', suite: data.suite, ...JSON.parse(result)});
  } catch (error) {
    initialization = undefined;
    self.postMessage({type: 'error', error: String(error?.message || error)});
  }
};
