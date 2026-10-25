export const pointsTimeZone='America/New_York';
export const difficultyPointUnits:Record<string,number>={Easy:1,Medium:2,Hard:4};
export type CompletionEvent={questionId:string;difficulty:string;pointUnits:number;completedAt:string;completedDay:string};
export type PointProgress={id:string;completions:number;submitted:number|boolean;repeat:number|boolean};
export type PointQuestion={slug:string;name:string;difficulty:string;neetcode150?:boolean;exercisePath?:string};
export type DailyProblem={id:string;name:string;difficulty:string;points:number;attempts:number;href:string};
export type DayPoints={day:string;points:number;questions:number;attempts:number;easy:number;medium:number;hard:number;problems:DailyProblem[]};

export function localDay(date:Date) {
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:pointsTimeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const part=(type:string)=>parts.find(p=>p.type===type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function shiftDay(day:string,offset:number) {
  const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+offset);return date.toISOString().slice(0,10);
}
export function buildPointsDashboard(events:CompletionEvent[],progress:PointProgress[],questions:PointQuestion[],now=new Date()) {
  const today=localDay(now),lookup=new Map(questions.map(q=>[q.slug,q]));
  const groups=new Map<string,Map<string,DailyProblem>>(),attemptsByDay=new Map<string,number>(),datedAttempts=new Map<string,number>();
  for(const event of [...events].sort((a,b)=>a.completedAt.localeCompare(b.completedAt))) {
    datedAttempts.set(event.questionId,(datedAttempts.get(event.questionId)??0)+1);
    attemptsByDay.set(event.completedDay,(attemptsByDay.get(event.completedDay)??0)+1);
    let day=groups.get(event.completedDay);if(!day){day=new Map();groups.set(event.completedDay,day);}
    const existing=day.get(event.questionId);if(existing){existing.attempts++;continue;}
    const question=lookup.get(event.questionId);
    day.set(event.questionId,{id:event.questionId,name:question?.name??event.questionId,difficulty:event.difficulty,points:event.pointUnits/2,attempts:1,
      href:question?.exercisePath??(event.questionId==='upstart-anagram-sentence'?'/practice/anagram-sentence':'https://leetcode.com/problems/'+event.questionId+'/')});
  }
  const recordedDays:DayPoints[]=[...groups.entries()].map(([day,group])=>{
    const problems=[...group.values()];return {day,points:problems.reduce((total,p)=>total+p.points,0),questions:problems.length,attempts:attemptsByDay.get(day)??0,
      easy:problems.filter(p=>p.difficulty==='Easy').length,medium:problems.filter(p=>p.difficulty==='Medium').length,hard:problems.filter(p=>p.difficulty==='Hard').length,problems};
  }).sort((a,b)=>b.day.localeCompare(a.day));
  const firstDay=recordedDays.at(-1)?.day??null,byDay=new Map(recordedDays.map(day=>[day.day,day]));
  const days:DayPoints[]=[];
  if(firstDay){for(let day=today;day>=firstDay;day=shiftDay(day,-1)){days.push(byDay.get(day)??{day,points:0,questions:0,attempts:0,easy:0,medium:0,hard:0,problems:[]});}}
  const chart:Pick<DayPoints,'day'|'points'|'questions'>[]=[];
  if(firstDay){const start=firstDay>shiftDay(today,-13)?firstDay:shiftDay(today,-13);for(let day=start;day<=today;day=shiftDay(day,1)){chart.push({day,points:byDay.get(day)?.points??0,questions:byDay.get(day)?.questions??0});}}
  let undatedAttempts=0,undatedQuestions=0;
  for(const row of progress){const undated=Math.max(0,Math.max(row.completions,row.submitted?1:0)-(datedAttempts.get(row.id)??0));undatedAttempts+=undated;if(undated)undatedQuestions++;}
  const completed=progress.filter(p=>p.submitted||p.completions>0);
  return {today,timeZone:pointsTimeZone,days,chart,
    todayPoints:byDay.get(today)?.points??0,todayQuestions:byDay.get(today)?.questions??0,
    weekPoints:days.filter(day=>day.day>=shiftDay(today,-6)&&day.day<=today).reduce((sum,day)=>sum+day.points,0),
    totalPoints:days.reduce((sum,day)=>sum+day.points,0),firstDay,
    undated:{attempts:undatedAttempts,questions:undatedQuestions},
    navigation:{neetcode:completed.filter(p=>lookup.get(p.id)?.neetcode150).length,repeat:completed.filter(p=>!!p.repeat).length,done:completed.filter(p=>!p.repeat).length}};
}
export type PointsDashboardData=ReturnType<typeof buildPointsDashboard>;
