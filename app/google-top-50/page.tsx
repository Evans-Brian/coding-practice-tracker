import type {Metadata} from 'next';
import GoogleTop50Dashboard from './google-top50-dashboard';
import './google-top50.css';

export const metadata:Metadata={
  title:'Google Top 50 | Coding Practice',
  description:'Google’s 50 most frequent LeetCode problems from the three-month company list, with shared notes and completion tracking.',
};

export default function Page(){return <GoogleTop50Dashboard/>;}
