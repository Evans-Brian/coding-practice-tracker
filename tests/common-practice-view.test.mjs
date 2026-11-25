import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuestionProgress} from '../app/question-progress.ts';
import {commonProgressAfterSave,commonQuestionVisible} from '../app/common-50/common-practice-state.ts';

const empty={notes:'',completions:0,tries:null,repeat:false,submitted:false,retained:false};

function fixture(initial,view,{failFirstPost=false}={}){
  const slug='example-question',calls=[],solved=new Set();
  let pageProgress={[slug]:{...initial}},server={...initial},postFailures=failFirstPost?1:0;
  const controller=createQuestionProgress(slug,{...initial},{
    onSaved:value=>{pageProgress=commonProgressAfterSave(pageProgress,view,slug,value);},
    onSubmitted:value=>{pageProgress={...pageProgress,[slug]:value};},
  },async(_url,options)=>{
    const body=JSON.parse(options.body);calls.push({method:options.method,body});
    if(options.method==='PUT'){
      server={...server,notes:body.notes,tries:body.tries,repeat:body.repeat};
      return Response.json({saved:true});
    }
    if(postFailures-->0)return Response.json({error:'Unavailable'},{status:503});
    server={...server,notes:body.notes,tries:body.tries,repeat:body.repeat,completions:server.completions+1,submitted:true,retained:true};
    return Response.json({progress:server});
  });
  return {controller,calls,get pageProgress(){return pageProgress;},get server(){return server;},visible:nextView=>commonQuestionVisible(slug,pageProgress,solved,nextView)};
}

test('repeat card stays editable after unchecking and saving, then leaves only after a completed submission',async()=>{
  const app=fixture({...empty,completions:2,submitted:true,repeat:true,retained:true},'repeat');
  assert.equal(app.visible('repeat'),true);
  await app.controller.save({...app.controller.getSnapshot().value,repeat:false});
  assert.equal(app.server.repeat,false,'the checkbox change is saved');
  assert.equal(app.controller.getSnapshot().value.repeat,false,'the checkbox is visibly unchecked');
  assert.equal(app.visible('repeat'),true,'saving the checkbox must not remove the card before Submit');

  app.controller.draft({...app.controller.getSnapshot().value,notes:'Review complete',tries:3});
  await app.controller.save(app.controller.getSnapshot().value);
  assert.equal(app.controller.getSnapshot().value.notes,'Review complete');
  assert.equal(app.controller.getSnapshot().value.tries,3);
  assert.equal(app.controller.getSnapshot().submitting,false);
  assert.equal(app.visible('repeat'),true,'notes remain editable after the unchecked value is saved');

  await app.controller.submit();
  assert.deepEqual(app.calls.map(call=>call.method),['PUT','PUT','POST']);
  assert.equal(app.server.completions,3);
  assert.equal(app.server.notes,'Review complete');
  assert.equal(app.server.tries,3);
  assert.equal(app.server.repeat,false);
  assert.equal(app.visible('repeat'),false);
  assert.equal(app.visible('practice'),false);
});

test('unfinished completion with Should repeat checked leaves practice and enters the same set’s repeat list',async()=>{
  const app=fixture(empty,'practice');
  await app.controller.save({...empty,repeat:true,notes:'Practice again',tries:2});
  assert.equal(app.visible('practice'),true,'saving a draft does not complete the question');
  assert.equal(app.visible('repeat'),false);
  assert.equal(app.server.completions,0);

  await app.controller.submit();
  assert.deepEqual(app.calls.map(call=>call.method),['PUT','POST']);
  assert.equal(app.server.completions,1);
  assert.equal(app.visible('practice'),false);
  assert.equal(app.visible('repeat'),true);
});

test('a failed repeat submission keeps the unchecked card available for a safe retry',async()=>{
  const app=fixture({...empty,completions:1,submitted:true,repeat:true,retained:true},'repeat',{failFirstPost:true});
  await app.controller.save({...app.controller.getSnapshot().value,repeat:false});
  await app.controller.submit();
  assert.equal(app.controller.getSnapshot().submitError,true);
  assert.equal(app.visible('repeat'),true);
  assert.equal(app.server.completions,1);

  await app.controller.submit();
  const posts=app.calls.filter(call=>call.method==='POST');
  assert.equal(posts[0].body.submissionId,posts[1].body.submissionId);
  assert.equal(app.server.completions,2);
  assert.equal(app.visible('repeat'),false);
});
