export default function DifficultyLabel({difficulty,estimated=false}:{difficulty:string;estimated?:boolean}) {
  return <span className={'difficulty '+difficulty.trim().toLowerCase()}>{difficulty}{estimated?' · estimated':''}</span>;
}
