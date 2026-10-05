import {env} from 'cloudflare:workers';
export function storage(){if(!env.DB)throw Error('Progress storage unavailable');return env.DB;}
