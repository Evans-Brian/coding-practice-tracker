import type {Metadata} from 'next';
import CommonPractice from './common-practice';
import './common-practice.css';

export const metadata:Metadata={
  title:'Common 50 | Coding Practice',
  description:'A fixed set of 50 common coding-interview questions, with shared notes, completion tracking, and repeat practice.',
};

export default function Page(){return <CommonPractice/>;}
