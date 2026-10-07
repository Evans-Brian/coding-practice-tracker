// Isolate Python from the page; terminating this worker also stops endless loops.
const runtimeURL = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';
const exercises = new Set(['double-substitution-decoding', 'minimum-difference-value',
  'interleave-three-strings', 'filter-words-by-characters', 'sum-multiples-below-limit']);
let python;
let initialization;

async function initialize() {
  const [{loadPyodide}, harness] = await Promise.all([
    import(runtimeURL + 'pyodide.mjs'),
    fetch('./variation-runner.py').then(r => {
      if (!r.ok) throw Error('Could not load the test runner.');
      return r.text();
    })
  ]);
  python = await loadPyodide({indexURL: runtimeURL});
  python.globals.set('__name__', '__practice_runner__');
  python.runPython(harness);
}

self.onmessage = async ({data}) => {
  try {
    if (!exercises.has(data.exercise) || !['samples', 'all'].includes(data.suite)) {
      throw Error('Unknown exercise or test suite.');
    }
    initialization ??= initialize();
    const [, suite] = await Promise.all([
      initialization,
      fetch('./' + data.exercise + '/tests.json').then(r => {
        if (!r.ok) throw Error('Could not load the test data.');
        return r.json();
      })
    ]);
    const selected = data.suite === 'samples' ? suite.cases.filter(c => c.sample) : suite.cases;
    self.postMessage({type: 'running'});
    python.globals.set('_practice_source', data.code);
    python.globals.set('_practice_cases_json', JSON.stringify(selected));
    python.globals.set('_practice_function', suite.functionName);
    const result = python.runPython('json.dumps(run_cases(_practice_source, json.loads(_practice_cases_json), _practice_function))');
    self.postMessage({type: 'result', suite: data.suite, ...JSON.parse(result)});
  } catch (error) {
    initialization = undefined;
    self.postMessage({type: 'error', error: String(error?.message || error)});
  }
};
