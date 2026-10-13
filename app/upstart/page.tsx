import type {Metadata} from 'next';
import Tracker from '../tracker';

export const metadata: Metadata = {title: 'Upstart Prep | Practice Notebook'};
export default function Page(){return <Tracker catalog="upstart"/>;}
