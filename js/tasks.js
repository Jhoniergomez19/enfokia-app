
export function uid(prefix="id"){ return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
export function nowIso(){ return new Date().toISOString(); }

export function sanitizeText(value,max=300){
  return String(value??"").replace(/[<>]/g,"").trim().slice(0,max);
}
export function validateTask(input){
  const title=sanitizeText(input.title,120);
  if(title.length<3) return {ok:false,error:"El título debe tener entre 3 y 120 caracteres."};
  return {ok:true,value:{
    ...input,title,
    description:sanitizeText(input.description,300),
    firstStep:sanitizeText(input.firstStep,180)
  }};
}
export function priorityWeight(p){ return p==="alta"?3:p==="media"?2:1; }
export function sortTasks(tasks,mode){
  const copy=[...tasks];
  if(mode==="priority") return copy.sort((a,b)=>priorityWeight(b.priority)-priorityWeight(a.priority) || String(a.dueDate||"9999").localeCompare(String(b.dueDate||"9999")));
  if(mode==="date") return copy.sort((a,b)=>String(a.dueDate||"9999").localeCompare(String(b.dueDate||"9999")));
  return copy.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
export function filterTasks(tasks,view,status){
  const today=new Date(); const ymd=today.toISOString().slice(0,10);
  const result=tasks.filter(t=>{
    if(status!=="all" && t.status!==status) return false;
    if(view==="today") return t.dueDate===ymd;
    if(view==="upcoming") return !!t.dueDate && t.dueDate>ymd;
    if(view==="undated") return !t.dueDate;
    return true;
  });
  return result;
}
