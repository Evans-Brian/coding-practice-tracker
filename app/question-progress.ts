import type {Progress} from './progress-state';

type Callbacks = {
  onSaved: (progress:Progress)=>void;
  onSubmitted: (progress:Progress)=>void;
};
type Snapshot = {
  value: Progress;
  status: string;
  busy: boolean;
  submitting: boolean;
  submitError: boolean;
};

// One controller per question keeps all rendered copies and pending requests in sync.
export function createQuestionProgress(id:string,initial:Progress,callbacks:Callbacks,request:typeof fetch=fetch) {
  let state:Snapshot={value:initial,status:'',busy:false,submitting:false,submitError:false};
  let queue=Promise.resolve(),sequence=0,submissionId:string|null=null,submitLock=false;
  const listeners=new Set<()=>void>();
  const publish=(next:Partial<Snapshot>)=>{
    state={...state,...next};
    listeners.forEach(listener=>listener());
  };
  function draft(next:Progress) {
    if(submitLock)return;
    publish({value:next,status:'Unsaved changes'});
  }
  function save(next:Progress) {
    if(submitLock)return Promise.resolve();
    publish({value:next,status:'Saving…',busy:true});
    const seq=++sequence;
    queue=queue.catch(()=>{}).then(async()=>{
      try {
        const response=await request('/api/progress',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,...next})});
        if(!response.ok)throw Error('Save failed');
        if(seq===sequence){
          publish({status:state.value===next?'Saved':'Unsaved changes'});
          callbacks.onSaved(next);
        }
      } catch {
        if(seq===sequence)publish({status:'Could not save. Retry below.'});
      } finally {
        if(seq===sequence)publish({busy:false});
      }
    });
    return queue;
  }
  async function submit() {
    if(submitLock)return;
    submitLock=true;
    publish({submitting:true,submitError:false,status:'Submitting…'});
    const attempt={...state.value};
    submissionId??=crypto.randomUUID();
    try {
      await queue;
      const response=await request('/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,...attempt,submissionId})});
      if(!response.ok)throw Error('Submission failed');
      const result=await response.json() as {progress:Progress};
      submissionId=null;
      submitLock=false;
      publish({value:result.progress,submitting:false,status:'Submitted'});
      callbacks.onSubmitted(result.progress);
    } catch {
      submitLock=false;
      publish({submitting:false,submitError:true,status:'Could not submit. Your attempt is still here; retry submission.'});
    }
  }
  return {
    getSnapshot:()=>state,
    subscribe:(listener:()=>void)=>{listeners.add(listener);return ()=>{listeners.delete(listener);};},
    setCallbacks:(next:Callbacks)=>{callbacks=next;},
    draft,save,submit,
  };
}
