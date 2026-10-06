import type {Metadata} from 'next';
import AnagramExercise from './exercise';

export const metadata:Metadata = {
 title:'Decode an anagram sentence · Upstart Practice',
 description:'Solve a Python practice reconstruction with examples, 24 runnable tests, and completion tracking.'
};

export default function Page(){return <AnagramExercise/>;}
