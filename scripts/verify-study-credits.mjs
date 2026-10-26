import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

// Test-only entries are created and removed only in the loopback preview.
const origin='http://127.0.0.1:5173';
const ids=[randomUUID(),randomUUID()];
async function request(method,body){
  const response=await fetch(origin+'/api/points',{method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  assert.equal(response.status,200,await response.clone().text());return response.json();
}
const before=await request('GET'),progressBefore=await (await fetch(origin+'/api/progress')).json();
try{
  const half={id:ids[0],pointUnits:1,note:'Local QA: extra study'},whole={id:ids[1],pointUnits:2,note:''};
  await request('POST',half);await request('POST',whole);await request('POST',half);
  const after=await request('GET');
  assert.equal(after.todayPoints,before.todayPoints+1.5);
  assert.equal(after.weekPoints,before.weekPoints+1.5);assert.equal(after.totalPoints,before.totalPoints+1.5);
  assert.equal(after.todayQuestions,before.todayQuestions);assert.deepEqual(after.navigation,before.navigation);assert.deepEqual(after.undated,before.undated);
  assert.equal(after.days.flatMap(day=>day.extras).filter(entry=>ids.includes(entry.id)).length,2);
  const invalid=await fetch(origin+'/api/points',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:randomUUID(),pointUnits:3,note:''})});
  assert.equal(invalid.status,400);assert.equal((await request('GET')).totalPoints,after.totalPoints);
  assert.deepEqual(await (await fetch(origin+'/api/progress')).json(),progressBefore);
}finally{
  for(const id of ids)await request('DELETE',{id});
}
await request('DELETE',{id:ids[0]});
assert.deepEqual(await request('GET'),before);
console.log('Verified locally: half and whole points persist, retries count once, invalid amounts fail, removal restores totals, and problem progress stays unchanged.');
