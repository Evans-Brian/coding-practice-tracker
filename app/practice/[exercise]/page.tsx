import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {variationExercises} from '../variation-definitions';
import VariationExercise from '../variation-exercise';

type Props={params:Promise<{exercise:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {exercise}=await params;
 const definition=variationExercises.find(item=>item.slug===exercise);
 return definition?{
  title:definition.question.name+' | Coding Practice',
  description:'Solve this Python practice reconstruction with examples, 20 runnable tests, and completion tracking.'
 }:{};
}

export default async function Page({params}:Props){
 const {exercise}=await params;
 const definition=variationExercises.find(item=>item.slug===exercise);
 if(!definition)notFound();
 return <VariationExercise key={definition.problemId} exercise={definition}/>;
}
