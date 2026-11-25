import type {Progress} from '../progress-state';

export type CommonPracticeView='practice'|'repeat';

export function commonQuestionVisible(slug:string,progress:Record<string,Progress>|undefined,solved:ReadonlySet<string>,view:CommonPracticeView){
  const value=progress?.[slug],completed=!!value&&(value.submitted||value.completions>0);
  return view==='repeat'?completed&&!!value?.repeat:!completed&&!solved.has(slug);
}

export function commonProgressAfterSave(progress:Record<string,Progress>,view:CommonPracticeView,slug:string,value:Progress):Record<string,Progress>{
  // The controller keeps saved edits visible. Hold the repeat row's membership
  // until Submit updates the parent, so an unchecked box cannot remove its button.
  if(view==='repeat')return progress;
  return {...progress,[slug]:value};
}
