import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

// This integration check writes only to the local preview database.
const url = 'http://127.0.0.1:5173/api/progress';
async function request(method, body) {
  const response = await fetch(url, body ? {method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)} : undefined);
  assert.equal(response.status, 200, await response.clone().text());
  return response.json();
}

const existing = await request('GET');
const id = 'daily-temperatures';
const before = existing[id]?.completions ?? 0;
const attempt = {id, notes: 'Local QA: notes shared between catalogs', completions: before, tries: 2, repeat: true};
await request('PUT', attempt);
const submissionId = randomUUID();
const first = await request('POST', {...attempt, submissionId});
const retry = await request('POST', {...attempt, submissionId});
assert.equal(first.progress.completions, before + 1);
assert.deepEqual(retry.progress, first.progress);
assert.equal(first.progress.submitted, true);
assert.equal(first.progress.repeat, true);
const saved = await request('GET');
assert.equal(saved[id].notes, attempt.notes);
assert.equal(saved[id].tries, 2);
assert.equal(saved[id].completions, before + 1);
for (const [slug, progress] of Object.entries(existing)) {
  if (slug !== id) assert.deepEqual(saved[slug], progress, `Unrelated progress changed: ${slug}`);
}

console.log('Verified locally: new NeetCode IDs save notes and tries, submission increments once, retries are idempotent, and unrelated progress is unchanged.');
