import type {Metadata} from 'next';
import PointsDashboard from './points-dashboard';
import './points.css';
export const metadata:Metadata={title:'Daily Points | Practice Notebook',description:'Your daily practice points, with one score per problem per day.'};
export default function Page(){return <PointsDashboard/>;}
