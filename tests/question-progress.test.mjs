import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuestionProgress} from '../app/question-progress.ts';

const initial={notes:'',completions:0,tries:null,repeat:false,submitted:false,retained:false};
const ok=()=>new Response('{}',{status:200});
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};

test('both subscribers see edits, and an older save cannot erase a newer draft',async()=>{
  const pending=deferred(),saved=[];
  const controller=createQuestionProgress('3sum',initial,{onSaved:p=>saved.push(p),onSubmitted:()=>{}},()=>pending.promise);
  const left=[],right=[];
  controller.subscribe(()=>left.push(controller.getSnapshot()));
  controller.subscribe(()=>right.push(controller.getSnapshot()));
  const first={...initial,notes:'Use two pointers',tries:2,repeat:true};
  controller.draft(first);
  assert.equal(left.at(-1),right.at(-1));
  assert.deepEqual(left.at(-1).value,first);
  const saving=controller.save(first);
  const newer={...first,notes:'Use two pointers; skip duplicates'};
  controller.draft(newer);
  pending.resolve(ok());
  await saving;
  assert.deepEqual(controller.getSnapshot().value,newer);
  assert.equal(controller.getSnapshot().status,'Unsaved changes');
  assert.equal(controller.getSnapshot().busy,false);
  assert.deepEqual(saved,[first]);
  assert.equal(left.at(-1),right.at(-1));
});

test('queued saves finish before submission, and duplicate submits record one attempt',async()=>{
  const firstSave=deferred(),calls=[],submitted=[];
  const controller=createQuestionProgress('3sum',initial,{onSaved:()=>{},onSubmitted:p=>submitted.push(p)},async(_url,options)=>{
    const body=JSON.parse(options.body);calls.push({method:options.method,body});
    if(calls.length===1)return firstSave.promise;
    if(options.method==='PUT')return ok();
    return Response.json({progress:{...body,completions:1,submitted:true,retained:true}});
  });
  const savingFirst=controller.save({...initial,notes:'First draft'});
  const savingSecond=controller.save({...initial,notes:'Final draft',tries:3,repeat:true});
  const submitting=controller.submit();
  const duplicateSubmit=controller.submit();
  await new Promise(setImmediate);
  assert.deepEqual(calls.map(c=>c.method),['PUT']);
  assert.equal(controller.getSnapshot().submitting,true);
  firstSave.resolve(ok());
  await Promise.all([savingFirst,savingSecond,submitting,duplicateSubmit]);
  assert.deepEqual(calls.map(c=>c.method),['PUT','PUT','POST']);
  assert.equal(calls[2].body.notes,'Final draft');
  assert.equal(calls[2].body.tries,3);
  assert.equal(calls[2].body.repeat,true);
  assert.equal(submitted.length,1);
  assert.equal(controller.getSnapshot().value.completions,1);
  assert.equal(controller.getSnapshot().submitting,false);
});

test('retry after a failed submission preserves the draft and the attempt ID',async()=>{
  const attempts=[],submitted=[];
  const controller=createQuestionProgress('3sum',initial,{onSaved:()=>{},onSubmitted:p=>submitted.push(p)},async(_url,options)=>{
    const body=JSON.parse(options.body);attempts.push(body);
    if(attempts.length===1)throw Error('Connection interrupted');
    return Response.json({progress:{...body,completions:1,submitted:true,retained:true}});
  });
  controller.draft({...initial,notes:'Handle duplicates',tries:2,repeat:true});
  await controller.submit();
  assert.equal(controller.getSnapshot().submitError,true);
  assert.equal(controller.getSnapshot().value.notes,'Handle duplicates');
  assert.equal(submitted.length,0);
  await controller.submit();
  assert.equal(attempts[0].submissionId,attempts[1].submissionId);
  assert.equal(controller.getSnapshot().submitError,false);
  assert.equal(controller.getSnapshot().value.completions,1);
  assert.equal(submitted.length,1);
});
