
export function createTimerController({getState,setState,onTick,onComplete}){
  let interval=null;

  function remainingMs(session, now=Date.now()){
    if(!session || session.status==="idle" || session.status==="cancelled" || session.status==="completed") return 0;
    if(session.status==="paused") return Math.max(0,session.remainingMs||0);
    return Math.max(0,(session.endsAt||now)-now);
  }

  function stopLoop(){ if(interval){clearInterval(interval);interval=null;} }

  function tick(){
    const session=getState();
    if(!session || session.status!=="running"){ stopLoop(); onTick(session, remainingMs(session)); return; }
    const remaining=remainingMs(session);
    onTick(session,remaining);
    if(remaining<=0){
      stopLoop();
      const completed={...session,status:"completed",completedAt:new Date().toISOString(),elapsedMs:session.plannedMs};
      setState(completed);
      onComplete(completed);
    }
  }

  function start(minutes,breakMinutes=0){
    const now=Date.now(); const plannedMs=minutes*60000;
    const session={
      id:`focus_${now}`,minutes,breakMinutes,plannedMs,status:"running",
      startedAt:new Date(now).toISOString(),endsAt:now+plannedMs,remainingMs:plannedMs,
      elapsedMs:0,completedAt:null,cancelledAt:null
    };
    setState(session); stopLoop(); interval=setInterval(tick,500); tick(); return session;
  }

  function pause(){
    const s=getState(); if(!s || s.status!=="running") return;
    const rem=remainingMs(s); const now=Date.now();
    setState({...s,status:"paused",remainingMs:rem,elapsedMs:Math.max(0,s.plannedMs-rem),pausedAt:new Date(now).toISOString()});
    stopLoop(); tick();
  }

  function resume(){
    const s=getState(); if(!s || s.status!=="paused") return;
    const now=Date.now();
    setState({...s,status:"running",endsAt:now+s.remainingMs,resumedAt:new Date(now).toISOString()});
    stopLoop(); interval=setInterval(tick,500); tick();
  }

  function cancel(){
    const s=getState(); if(!s || !["running","paused"].includes(s.status)) return;
    const rem=remainingMs(s); const elapsed=Math.max(0,s.plannedMs-rem);
    setState({...s,status:"cancelled",remainingMs:rem,elapsedMs:elapsed,cancelledAt:new Date().toISOString()});
    stopLoop(); tick();
  }

  function restore(){
    const s=getState();
    if(s?.status==="running"){ stopLoop(); interval=setInterval(tick,500); tick(); }
    else tick();
  }

  return {start,pause,resume,cancel,restore,remainingMs};
}
