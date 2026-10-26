import type {Metadata} from 'next';
import PointsDashboard from './points-dashboard';
import './points.css';
export const metadata:Metadata={title:'Daily Points | Coding Practice',description:'Your daily practice points from completed problems and extra study.'};
export default function Page(){return <PointsDashboard/>;}
