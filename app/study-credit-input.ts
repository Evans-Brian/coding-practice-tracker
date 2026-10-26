export type StudyCreditInput={id:string;pointUnits:1|2;note:string};
export function validCreditId(id:unknown):id is string{return typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);}
export function parseStudyCredit(value:unknown):StudyCreditInput|null {
  if(!value||typeof value!=='object')return null;
  const input=value as Record<string,unknown>;
  if(!validCreditId(input.id)||(input.pointUnits!==1&&input.pointUnits!==2)||typeof input.note!=='string'||input.note.length>500)return null;
  return {id:input.id,pointUnits:input.pointUnits,note:input.note.trim()};
}
