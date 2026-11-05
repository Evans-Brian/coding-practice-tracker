export const pointsTimeZone='America/New_York';
export const difficultyPointUnits:Record<string,number>={Easy:1,Medium:2,Hard:4};
// SQL classification verified from the official question descriptions (SQL Schema),
// November 5, 2026. This is public problem metadata, never completion history.
export const sqlQuestionSlugs:ReadonlySet<string>=new Set([
  'article-views-i',
  'average-selling-price',
  'average-time-of-process-per-machine',
  'big-countries',
  'biggest-single-number',
  'classes-with-at-least-5-students',
  'combine-two-tables',
  'confirmation-rate',
  'consecutive-numbers',
  'count-salary-categories',
  'customer-who-visited-but-did-not-make-any-transactions',
  'customers-who-bought-all-products',
  'customers-who-never-order',
  'department-top-three-salaries',
  'duplicate-emails',
  'employee-bonus',
  'employees-earning-more-than-their-managers',
  'employees-whose-manager-left-the-company',
  'exchange-seats',
  'find-customer-referee',
  'find-followers-count',
  'friend-requests-ii-who-has-the-most-friends',
  'game-play-analysis-iv',
  'group-sold-products-by-the-date',
  'immediate-food-delivery-ii',
  'invalid-tweets',
  'investments-in-2016',
  'last-person-to-fit-in-the-bus',
  'list-the-products-ordered-in-a-period',
  'managers-with-at-least-5-direct-reports',
  'monthly-transactions-i',
  'movie-rating',
  'not-boring-movies',
  'nth-highest-salary',
  'number-of-unique-subjects-taught-by-each-teacher',
  'patients-with-a-condition',
  'percentage-of-users-attended-a-contest',
  'primary-department-for-each-employee',
  'product-price-at-a-given-date',
  'product-sales-analysis-i',
  'product-sales-analysis-iii',
  'project-employees-i',
  'queries-quality-and-percentage',
  'recyclable-and-low-fat-products',
  'replace-employee-id-with-the-unique-identifier',
  'restaurant-growth',
  'rising-temperature',
  'second-highest-salary',
  'students-and-examinations',
  'the-number-of-employees-which-report-to-each-employee',
  'triangle-judgement',
  'user-activity-for-the-past-30-days-i',
]);
// Stored units retain the original difficulty value; the scoring policy is applied
// when reading, so historical SQL scores change without rewriting source records.
export function questionPoints(questionId:string,pointUnits:number){
  return pointUnits/(sqlQuestionSlugs.has(questionId)?4:2);
}
export type CompletionEvent={questionId:string;difficulty:string;pointUnits:number;completedAt:string;completedDay:string};
export type PointProgress={id:string;completions:number;submitted:number|boolean;repeat:number|boolean};
export type PointQuestion={slug:string;name:string;difficulty:string;neetcode150?:boolean;exercisePath?:string};
export type PointSource='tracker'|'leetcode';
export type DailyProblem={id:string;name:string;difficulty:string;points:number;attempts:number;href:string;sources:PointSource[]};
export type StudyCredit={id:string;pointUnits:number;note:string;earnedDay:string;createdAt:string};
export type DayPoints={day:string;points:number;extraPoints:number;extras:StudyCredit[];questions:number;attempts:number;easy:number;medium:number;hard:number;problems:DailyProblem[];leetcodeQuestions:number;trackerQuestions:number;overlapQuestions:number};
export type LeetcodeDailyCompletion={questionId:string;name:string;difficulty:string;pointUnits:number;completedDay:string;importedAt:string};
export type LeetcodeImportMetadata={firstDay:string;lastDay:string;reviewedProblems:number;expectedProblems:number;complete:boolean|number;importedAt:string;sourceUrl:string};
export type LeetcodeHistory={entries:LeetcodeDailyCompletion[];import?:LeetcodeImportMetadata|null};

export function localDay(date:Date) {
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:pointsTimeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const part=(type:string)=>parts.find(p=>p.type===type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function shiftDay(day:string,offset:number) {
  const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+offset);return date.toISOString().slice(0,10);
}
export function buildPointsDashboard(events:CompletionEvent[],progress:PointProgress[],questions:PointQuestion[],now=new Date(),credits:StudyCredit[]=[],history:LeetcodeHistory={entries:[]}) {
  const today=localDay(now),lookup=new Map(questions.map(q=>[q.slug,q]));
  const groups=new Map<string,Map<string,DailyProblem>>(),attemptsByDay=new Map<string,number>(),datedAttempts=new Map<string,number>();
  for(const event of [...events].sort((a,b)=>a.completedAt.localeCompare(b.completedAt))) {
    datedAttempts.set(event.questionId,(datedAttempts.get(event.questionId)??0)+1);
    attemptsByDay.set(event.completedDay,(attemptsByDay.get(event.completedDay)??0)+1);
    let day=groups.get(event.completedDay);if(!day){day=new Map();groups.set(event.completedDay,day);}
    const existing=day.get(event.questionId);if(existing){existing.attempts++;continue;}
    const question=lookup.get(event.questionId);
    day.set(event.questionId,{id:event.questionId,name:question?.name??event.questionId,difficulty:event.difficulty,points:questionPoints(event.questionId,event.pointUnits),attempts:1,sources:['tracker'],
      href:question?.exercisePath??(event.questionId==='upstart-anagram-sentence'?'/practice/anagram-sentence':'https://leetcode.com/problems/'+event.questionId+'/')});
  }
  // An external accepted submission can describe the same work as a tracker
  // submission. Credit their union by problem and day, never sum both sources.
  const importedKeys=new Set<string>(),importedDays=new Set<string>(),importedProblems=new Set<string>();
  let overlapProblemDays=0;
  for(const entry of history.entries){
    const key=entry.questionId+'\0'+entry.completedDay;if(importedKeys.has(key))continue;
    importedKeys.add(key);importedDays.add(entry.completedDay);importedProblems.add(entry.questionId);
    let day=groups.get(entry.completedDay);if(!day){day=new Map();groups.set(entry.completedDay,day);}
    const existing=day.get(entry.questionId);
    if(existing){existing.sources.push('leetcode');overlapProblemDays++;continue;}
    const question=lookup.get(entry.questionId);
    day.set(entry.questionId,{id:entry.questionId,name:question?.name??entry.name,difficulty:entry.difficulty,points:questionPoints(entry.questionId,entry.pointUnits),attempts:0,sources:['leetcode'],href:'https://leetcode.com/problems/'+entry.questionId+'/'});
  }
  const creditsByDay=new Map<string,StudyCredit[]>();
  for(const credit of credits){const list=creditsByDay.get(credit.earnedDay)??[];list.push(credit);creditsByDay.set(credit.earnedDay,list);if(!groups.has(credit.earnedDay))groups.set(credit.earnedDay,new Map());}
  const recordedDays:DayPoints[]=[...groups.entries()].map(([day,group])=>{
    const extras=(creditsByDay.get(day)??[]).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),extraPoints=extras.reduce((sum,credit)=>sum+credit.pointUnits/2,0);
    const problems=[...group.values()];return {day,points:problems.reduce((total,p)=>total+p.points,0)+extraPoints,extraPoints,extras,questions:problems.length,attempts:attemptsByDay.get(day)??0,
      easy:problems.filter(p=>p.difficulty==='Easy').length,medium:problems.filter(p=>p.difficulty==='Medium').length,hard:problems.filter(p=>p.difficulty==='Hard').length,problems,
      leetcodeQuestions:problems.filter(p=>p.sources.includes('leetcode')).length,trackerQuestions:problems.filter(p=>p.sources.includes('tracker')).length,overlapQuestions:problems.filter(p=>p.sources.length===2).length};
  }).sort((a,b)=>b.day.localeCompare(a.day));
  const firstDay=recordedDays.at(-1)?.day??null,byDay=new Map(recordedDays.map(day=>[day.day,day]));
  const days:DayPoints[]=[];
  if(firstDay){for(let day=today;day>=firstDay;day=shiftDay(day,-1)){days.push(byDay.get(day)??{day,points:0,extraPoints:0,extras:[],questions:0,attempts:0,easy:0,medium:0,hard:0,problems:[],leetcodeQuestions:0,trackerQuestions:0,overlapQuestions:0});}}
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
    history:history.entries.length||history.import?{importedDays:importedDays.size,importedProblems:importedProblems.size,creditedProblemDays:importedKeys.size,overlapProblemDays,
      firstDay:history.import?.firstDay??([...importedDays].sort()[0]??null),lastDay:history.import?.lastDay??([...importedDays].sort().at(-1)??null),
      importedAt:history.import?.importedAt??(history.entries.map(entry=>entry.importedAt).sort().at(-1)??null),
      complete:!!history.import?.complete,reviewedProblems:history.import?.reviewedProblems??importedProblems.size,expectedProblems:history.import?.expectedProblems??importedProblems.size,
      sourceUrl:history.import?.sourceUrl??'https://leetcode.com/progress/'}:null,
    navigation:{neetcode:completed.filter(p=>lookup.get(p.id)?.neetcode150).length,repeat:completed.filter(p=>!!p.repeat).length,done:completed.filter(p=>!p.repeat).length}};
}
export type PointsDashboardData=ReturnType<typeof buildPointsDashboard>;
