import type {Metadata} from 'next';
import CommonPractice from '../common-practice';
import '../common-practice.css';

export const metadata:Metadata={
  title:'Common 50 Repeat | Coding Practice',
  description:'Repeat completed questions from your fixed Common 50 practice set.',
};

export default function Page(){return <CommonPractice view="repeat"/>;}
