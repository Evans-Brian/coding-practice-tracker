import type {Metadata} from 'next';
import GoogleTop50Dashboard from './google-top50-dashboard';
import './google-top50.css';

export const metadata:Metadata={
  title:'Google Top 50 | Coding Practice',
  description:'Non-SQL problems from Google’s three-month Top 50, with shared notes and completion tracking.',
};

export default function Page(){return <GoogleTop50Dashboard/>;}
