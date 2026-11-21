import type {Metadata} from 'next';
import GoogleTop50Dashboard from '../google-top-50/google-top50-dashboard';
import {googleLastMonthQuestions,googleLastMonthSnapshot} from '../google-last-month';
import '../google-top-50/google-top50.css';

export const metadata:Metadata={
  title:'Google Last 30 Days | Coding Practice',
  description:'Non-SQL problems in Google’s last-30-days LeetCode list, ranked by frequency with shared notes and completion tracking.',
};

export default function Page(){
  return <GoogleTop50Dashboard questions={googleLastMonthQuestions} snapshot={googleLastMonthSnapshot}
    title="Google · Last 30 Days" active="google-month"
    description="Non-SQL problems from Google’s last-30-days LeetCode list, kept in frequency order."
    sourceLinkLabel="View the 30-day source"/>;
}
