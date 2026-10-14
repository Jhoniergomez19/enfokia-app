
import {questions,answerOptions,recommendationRules} from "./data.js";
import {loadState,saveState,clearState,exportState,validateState,isStorageAvailable,SCHEMA_VERSION} from "./storage.js";
import {calculateDimensionScores,inferPriority,resolvedGoal} from "./assessment.js";
import {uid,nowIso,sanitizeText,validateTask,sortTasks,filterTasks,priorityWeight} from "./tasks.js";
import {createTimerController} from "./timer.js";

let state=loadState();
let assessmentIndex=0;
let progressPeriod=7;
let activeTimerSession = restoreActiveTimerFromState();

const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>[...root.querySelectorAll(sel)];
const escapeHtml=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));

function persist(){
  saveState(state);
  $("#storageNotice").hidden=isStorageAvailable();
}

function applySettings(){
  document.body.classList.toggle("large-text",!!state.settings.largeText);
  document.body.classList.toggle("reduce-motion",!!state.settings.reduceMotion);
  $("#largeTextToggle").checked=!!state.settings.largeText;
  $("#reduceMotionToggle").checked=!!state.settings.reduceMotion;
}

function route(){
  const raw=location.hash.replace(/^#\/?/,"") || (state.profile.createdAt ? "inicio" : "bienvenida");
  const routeName=$(`.view[data-route="${CSS.escape(raw)}"]`) ? raw : "inicio";
  $$(".view").forEach(v=>v.hidden=v.dataset.route!==routeName);
  const onboarding=["bienvenida","preferencias","mapa","resultados","plan"].includes(routeName);
  $("#bottomNav").hidden=onboarding;
  $("#backButton").hidden=["bienvenida","inicio"].includes(routeName);
  $$("[data-nav]").forEach(a=>a.classList.toggle("active",a.dataset.nav===routeName));
  renderRoute(routeName);
  $("#main").focus({preventScroll:true});
  window.scrollTo({top:0,behavior:document.body.classList.contains("reduce-motion")?"auto":"smooth"});
}

function go(name){ location.hash=`#/${name}`; }

function renderRoute(name){
  if(name==="preferencias") renderPreferences();
  if(name==="mapa") renderAssessment();
  if(name==="resultados") renderResults();
  if(name==="plan") renderPlan();
  if(name==="inicio") renderHome();
  if(name==="primer-paso") renderStep();
  if(name==="pendientes") renderTasks();
  if(name==="foco") renderTimerUI();
  if(name==="progreso") renderProgress();
  if(name==="ayuda") renderHelp();
  if(name==="ajustes") applySettings();
}

function renderPreferences(){
  $("#adultCheck").checked=!!state.profile.adultConfirmed;
  $("#goalSelect").value=state.profile.goal||"";
  const radio=$(`input[name="preferredDuration"][value="${state.profile.preferredDuration||10}"]`);
  if(radio) radio.checked=true;
}

function renderAssessment(){
  if(assessmentIndex>=questions.length){ $("#assessmentForm").hidden=true; $("#assessmentExtras").hidden=false; renderExtras(); return; }
  $("#assessmentForm").hidden=false; $("#assessmentExtras").hidden=true;
  const q=questions[assessmentIndex];
  const current=(q.id in state.assessment.answers)?state.assessment.answers[q.id]:undefined;
  $("#assessmentQuestion").innerHTML=`
    <div class="eyebrow">${escapeHtml(q.dimension)}</div>
    <h2>${escapeHtml(q.text)}</h2>
    <div class="answers" role="radiogroup" aria-label="${escapeHtml(q.text)}">
      ${answerOptions.map((opt,i)=>{
        const v=opt.value===null?"null":String(opt.value);
        const checked=(opt.value===null?current===null:current===opt.value)?"checked":"";
        return `<label class="answer-option"><input type="radio" name="answer" value="${v}" ${checked}><span><strong>${opt.value===null?"":opt.value+" "}</strong>${escapeHtml(opt.label)}</span></label>`;
      }).join("")}
    </div>`;
  const number=assessmentIndex+1;
  $("#assessmentProgressText").textContent=`Pregunta ${number} de ${questions.length}`;
  $("#assessmentProgressPercent").textContent=`${Math.round(number/questions.length*100)}%`;
  $("#assessmentProgressBar").style.width=`${number/questions.length*100}%`;
  $("#assessmentPrev").disabled=assessmentIndex===0;
  $("#assessmentNext").textContent=assessmentIndex===questions.length-1?"Continuar":"Siguiente";
}

function saveCurrentAnswer(){
  if(assessmentIndex>=questions.length) return true;
  const selected=$('input[name="answer"]:checked');
  if(!selected) return false;
  state.assessment.answers[questions[assessmentIndex].id]=selected.value==="null"?null:Number(selected.value);
  persist(); return true;
}

function renderExtras(){
  $("#impactSelect").value=state.assessment.impact||"";
  $$("#contextsGroup input").forEach(c=>c.checked=(state.assessment.contexts||[]).includes(c.value));
  $("#prioritySelect").value=state.assessment.priority||"";
  $("#orientationSelect").value=state.assessment.orientation||"Ahora no";
  $("#assessmentProgressText").textContent="Cuestionario completado";
  $("#assessmentProgressPercent").textContent="100%"; $("#assessmentProgressBar").style.width="100%";
}

function renderResults(){
  const scores=calculateDimensionScores(state.assessment.answers||{});
  $("#resultsGrid").innerHTML=Object.entries(scores).map(([name,value])=>`
    <article class="metric-card">
      <div class="metric-label">${escapeHtml(name)}</div>
      <div class="metric-value">${value===null?"—":value.toFixed(1)}</div>
      <div class="metric-note">${value===null?"Información insuficiente":"Frecuencia declarada · 0 a 4"}</div>
    </article>`).join("");

  $("#answersReview").innerHTML=questions.map(q=>{
    const v=state.assessment.answers[q.id];
    const label=v===null?"Prefiero no responder":typeof v==="number"?`${v} · ${answerOptions.find(o=>o.value===v)?.label||""}`:"Sin respuesta";
    return `<div class="answer-review-item"><strong>${q.id}</strong> ${escapeHtml(q.text)}<br><span class="muted">${escapeHtml(label)}</span></div>`;
  }).join("");

  const resolved=resolvedGoal(state);
  const inferred=inferPriority(scores);
  $("#priorityExplanation").textContent=resolved.goal
    ? `${resolved.goal}. ${resolved.source==="manual"?"Elegido manualmente; esta elección tiene prioridad.":"Sugerido a partir de la dimensión con mayor media."}`
    : "No hay información suficiente. Puedes elegir un objetivo manualmente en Mi plan.";
  $("#tiesNotice").textContent=inferred.goals.length>1 ? `Empate descriptivo entre: ${inferred.goals.join(", ")}. No se fuerza una clasificación.` : "";
  $("#highImpactNotice").hidden=!["Bastante","Muchísimo"].includes(state.assessment.impact);
}

function renderPlan(){
  const resolved=resolvedGoal(state);
  $("#planGoalSelect").value=state.plan.goal||resolved.goal||state.profile.goal||"Empezar tareas";
  renderRecommendations();
}
function renderRecommendations(){
  const goal=$("#planGoalSelect").value;
  const defaults=recommendationRules[goal]||[];
  const selected=(state.plan.goal===goal && state.plan.recommendations.length)?state.plan.recommendations:defaults;
  const all=["Primer paso","Modo foco","Mis pendientes","Revisión diaria en Inicio"];
  $("#recommendationsList").innerHTML=all.map(tool=>`
    <label class="recommendation">
      <span><strong>${escapeHtml(tool)}</strong><small>${defaults.includes(tool)?"Recomendada para este objetivo":"Opcional"}</small></span>
      <input type="checkbox" value="${escapeHtml(tool)}" ${selected.includes(tool)?"checked":""} aria-label="Usar ${escapeHtml(tool)}">
    </label>`).join("");
}

function renderHome(){
  const open=state.tasks.filter(t=>t.status!=="completado").sort((a,b)=>priorityWeight(b.priority)-priorityWeight(a.priority) || String(a.dueDate||"9999").localeCompare(String(b.dueDate||"9999")))[0];
  const activeStep=[...state.steps].reverse().find(s=>!["completada"].includes(s.status));
  let html;
  if(activeStep){
    html=`<div class="eyebrow">Siguiente acción</div><h2>${escapeHtml(activeStep.firstStep)}</h2><p>De “${escapeHtml(activeStep.taskName)}” · ${activeStep.duration} min</p><a class="button" href="#/primer-paso">Retomar primer paso</a>`;
  }else if(open){
    html=`<div class="eyebrow">Tarea prioritaria</div><h2>${escapeHtml(open.title)}</h2><p>${open.firstStep?`Primer paso: ${escapeHtml(open.firstStep)}`:"Define un primer paso pequeño antes de empezar."}</p><a class="button" href="#/pendientes">Ver pendiente</a>`;
  }else{
    html=`<div class="eyebrow">Siguiente acción</div><h2>Empieza con algo pequeño</h2><p>Aún no tienes pendientes activos. Puedes crear un primer paso o registrar una tarea.</p><a class="button" href="#/primer-paso">Crear primer paso</a>`;
  }
  $("#nextActionCard").innerHTML=html;
  const goal=state.plan.goal||state.profile.goal;
  $("#dailyReviewCard").hidden=goal!=="Recordar compromisos";
}

function renderStep(){
  const active=[...state.steps].reverse().find(s=>s.status!=="completada");
  const card=$("#activeStepCard");
  if(!active){card.hidden=true;return;}
  card.hidden=false;
  card.innerHTML=`
    <div class="eyebrow">Paso actual</div><h2>${escapeHtml(active.firstStep)}</h2>
    <p><strong>${escapeHtml(active.taskName)}</strong> · ${active.duration} min · ${escapeHtml(active.status)}</p>
    <div class="stack-inline">
      ${active.status!=="en curso"?`<button class="button primary" data-step-action="start" data-id="${active.id}">Iniciar</button>`:"<span class='pill'>En curso</span>"}
      <button class="button secondary" data-step-action="complete" data-id="${active.id}">Completar paso</button>
      <button class="button ghost" data-step-action="pause" data-id="${active.id}">Retomar después</button>
    </div>`;
}

function renderTasks(){
  const view=$("#taskViewFilter").value, status=$("#taskStatusFilter").value, sort=$("#taskSort").value;
  const list=sortTasks(filterTasks(state.tasks,view,status),sort);
  $("#taskList").innerHTML=list.length?list.map(t=>`
    <article class="task-card ${t.status==="completado"?"completed":""}">
      <div class="task-top"><div><h3>${escapeHtml(t.title)}</h3>${t.description?`<p>${escapeHtml(t.description)}</p>`:""}</div><span class="pill ${t.priority==="alta"?"high":""}">${escapeHtml(t.priority)}</span></div>
      <div class="task-meta"><span class="pill">${escapeHtml(t.status)}</span>${t.dueDate?`<span class="pill">${escapeHtml(t.dueDate)}</span>`:"<span class='pill'>Sin fecha</span>"}</div>
      ${t.firstStep?`<p><strong>Primer paso:</strong> ${escapeHtml(t.firstStep)}</p>`:""}
      <div class="task-actions">
        <button data-task-action="edit" data-id="${t.id}">Editar</button>
        ${t.status==="completado"?`<button data-task-action="reopen" data-id="${t.id}">Reabrir</button>`:`<button data-task-action="complete" data-id="${t.id}">Completar</button>`}
        <button data-task-action="delete" data-id="${t.id}">Eliminar</button>
      </div>
    </article>`).join(""):`<div class="card empty-state"><strong>No hay tareas en esta vista.</strong><p>Crea una cuando necesites sacar algo de tu cabeza y darle un lugar.</p></div>`;
}

function openTaskDialog(task=null){
  $("#taskDialogTitle").textContent=task?"Editar tarea":"Nueva tarea";
  $("#taskId").value=task?.id||""; $("#taskTitle").value=task?.title||""; $("#taskDescription").value=task?.description||"";
  $("#taskPriority").value=task?.priority||"media"; $("#taskDueDate").value=task?.dueDate||""; $("#taskStatus").value=task?.status||"pendiente"; $("#taskFirstStep").value=task?.firstStep||"";
  $("#taskDialog").showModal(); $("#taskTitle").focus();
}

function restoreActiveTimerFromState(){
  return [...(state.focusSessions||[])].reverse().find(s=>["running","paused"].includes(s.status)) || null;
}
function saveActiveTimer(session){
  activeTimerSession=session;
  const idx=state.focusSessions.findIndex(s=>s.id===session.id);
  if(idx>=0) state.focusSessions[idx]=session; else state.focusSessions.push(session);
  persist();
}
const timer=createTimerController({
  getState:()=>activeTimerSession,
  setState:saveActiveTimer,
  onTick:(session,remaining)=>paintTimer(session,remaining),
  onComplete:(session)=>{paintTimer(session,0); $("#timerCompletionMessage").hidden=false; $("#timerCompletionMessage").textContent="Bloque de foco finalizado. Tu tarea no fue marcada como completada; decide tú qué sigue.";}
});
function fmt(ms){ const sec=Math.max(0,Math.ceil(ms/1000)); return `${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`; }
function paintTimer(session,remaining){
  const status=session?.status||"idle";
  const labels={idle:"Listo",running:"En curso",paused:"Pausado",completed:"Completado",cancelled:"Interrumpido"};
  $("#timerStateLabel").textContent=labels[status]||status;
  $("#timerDisplay").textContent=fmt(status==="idle"?(Number($("#customMinutes").value)||10)*60000:remaining);
  $("#timerStart").textContent=status==="paused"?"Reanudar":status==="running"?"En curso":"Iniciar";
  $("#timerStart").disabled=status==="running";
  $("#timerPause").disabled=status!=="running";
  $("#timerCancel").disabled=!["running","paused"].includes(status);
}
function renderTimerUI(){ timer.restore(); if(!activeTimerSession) paintTimer(null,(Number($("#customMinutes").value)||10)*60000); }

function periodStart(days){ const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-(days-1)); return d; }
function inPeriod(iso,days){ return iso && new Date(iso)>=periodStart(days); }
function renderProgress(){
  const days=progressPeriod;
  const steps=state.steps.filter(s=>s.completedAt && inPeriod(s.completedAt,days));
  const tasks=state.tasks.filter(t=>t.completedAt && inPeriod(t.completedAt,days));
  const sessions=state.focusSessions.filter(s=>s.status==="completed" && inPeriod(s.completedAt,days));
  const interrupted=state.focusSessions.filter(s=>s.status==="cancelled" && inPeriod(s.cancelledAt,days));
  const elapsed=[...sessions,...interrupted].reduce((sum,s)=>sum+Number(s.elapsedMs||0),0);
  const resumed=state.steps.filter(s=>Number(s.resumeCount||0)>0 && inPeriod(s.updatedAt,days)).length;
  const metrics=[
    ["Primeros pasos",steps.length],["Tareas completadas",tasks.length],["Sesiones de foco",sessions.length],
    ["Tiempo registrado",`${Math.round(elapsed/60000)} min`],["Tareas retomadas",resumed],["Registros de utilidad",(state.utilities||[]).filter(u=>inPeriod(u.createdAt,days)).length]
  ];
  $("#progressMetrics").innerHTML=metrics.map(([label,value])=>`<article class="metric-card"><div class="metric-value">${escapeHtml(value)}</div><div class="metric-label">${escapeHtml(label)}</div><div class="metric-note">Últimos ${days} días</div></article>`).join("");
  $$(".period-tabs button").forEach(b=>b.classList.toggle("active",Number(b.dataset.period)===days));
}

function renderHelp(){
  if(!$("#professionalSummary").value) $("#professionalSummary").placeholder="Pulsa “Generar resumen” cuando quieras crear una versión para copiar o imprimir.";
}
function buildProfessionalSummary(){
  const scores=calculateDimensionScores(state.assessment.answers||{});
  const usedTools=[];
  if(state.steps.length) usedTools.push("Primer paso");
  if(state.focusSessions.length) usedTools.push("Modo foco");
  if(state.tasks.length) usedTools.push("Mis pendientes");
  const lines=[
    "RESUMEN VOLUNTARIO — ENFOKIA",
    `Fecha: ${new Date().toLocaleDateString("es")}`,
    "",
    "Aviso: este resumen es descriptivo y no constituye diagnóstico ni evaluación clínica.",
    `Objetivo actual: ${state.plan.goal||state.profile.goal||"No definido"}`,
    `Impacto declarado: ${state.assessment.impact||"No respondido"}`,
    `Contextos: ${(state.assessment.contexts||[]).join(", ")||"No respondidos"}`,
    "",
    "Medias descriptivas (0–4; mínimo 2 respuestas válidas por dimensión):",
    ...Object.entries(scores).map(([k,v])=>`- ${k}: ${v===null?"Información insuficiente":v.toFixed(1)}`),
    "",
    `Herramientas utilizadas: ${usedTools.join(", ")||"Ninguna registrada"}`,
    "",
    "Respuestas individuales:",
    ...questions.map(q=>{const v=state.assessment.answers[q.id]; return `- ${q.id}: ${v===null?"Prefiero no responder":typeof v==="number"?v:"Sin respuesta"}`;})
  ];
  return lines.join("\n");
}

function download(filename,text,type){
  const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}

function bind(){
  window.addEventListener("hashchange",route);
  $("#backButton").addEventListener("click",()=>history.length>1?history.back():go("inicio"));
  $("#helpButton").addEventListener("click",()=>go("ayuda"));
  $$("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));

  $("#startAssessmentButton").addEventListener("click",()=>{state.profile.skipAssessment=false;persist();});
  $("#skipAssessmentButton").addEventListener("click",()=>{state.profile.skipAssessment=true;persist();go("preferencias");});

  $("#preferencesForm").addEventListener("submit",e=>{
    e.preventDefault();
    const adult=$("#adultCheck").checked, goal=$("#goalSelect").value;
    $('[data-error-for="adultCheck"]').textContent=adult?"":"Debes confirmar que tienes 18 años o más.";
    $('[data-error-for="goalSelect"]').textContent=goal?"":"Elige un objetivo inicial.";
    if(!adult||!goal) return;
    state.profile={...state.profile,adultConfirmed:true,goal,preferredDuration:Number($('input[name="preferredDuration"]:checked').value),createdAt:state.profile.createdAt||nowIso()};
    persist(); go(state.profile.skipAssessment ? "plan" : "mapa");
  });

  $("#assessmentNext").addEventListener("click",()=>{
    if(!saveCurrentAnswer()){ alert("Selecciona una respuesta o “Prefiero no responder”."); return; }
    assessmentIndex++;
    renderAssessment();
  });
  $("#assessmentPrev").addEventListener("click",()=>{ if(assessmentIndex>0){assessmentIndex--;renderAssessment();} });
  $("#finishAssessmentButton").addEventListener("click",()=>{
    state.assessment.impact=$("#impactSelect").value;
    state.assessment.contexts=$$("#contextsGroup input:checked").map(c=>c.value);
    state.assessment.priority=$("#prioritySelect").value;
    state.assessment.orientation=$("#orientationSelect").value;
    state.assessment.completedAt=nowIso(); state.profile.skipAssessment=false;
    persist(); go("resultados");
  });

  $("#planGoalSelect").addEventListener("change",renderRecommendations);
  $("#savePlanButton").addEventListener("click",()=>{
    state.plan.goal=$("#planGoalSelect").value;
    state.plan.recommendations=$$("#recommendationsList input:checked").map(i=>i.value);
    state.plan.updatedAt=nowIso(); state.profile.goal=state.plan.goal;
    persist(); go("inicio");
  });

  $("#stepForm").addEventListener("submit",e=>{
    e.preventDefault();
    const taskName=sanitizeText($("#stepTaskName").value,120), firstStep=sanitizeText($("#stepAction").value,180);
    const errs=$$("#stepForm .field-error"); errs.forEach(x=>x.textContent="");
    if(taskName.length<3){errs[0].textContent="Escribe entre 3 y 120 caracteres.";return;}
    if(firstStep.length<3){errs[1].textContent="Escribe entre 3 y 180 caracteres.";return;}
    const step={id:uid("step"),taskName,description:sanitizeText($("#stepDescription").value,300),firstStep,duration:Number($("#stepDuration").value),dueDate:$("#stepDueDate").value||null,status:"pendiente",createdAt:nowIso(),updatedAt:nowIso(),startedAt:null,completedAt:null,resumeCount:0};
    state.steps.push(step); persist(); e.target.reset(); $("#stepDuration").value="10"; renderStep();
  });

  $("#activeStepCard").addEventListener("click",e=>{
    const btn=e.target.closest("[data-step-action]"); if(!btn)return;
    const step=state.steps.find(s=>s.id===btn.dataset.id); if(!step)return;
    if(btn.dataset.stepAction==="start"){
      if(step.status==="pausada") step.resumeCount=(step.resumeCount||0)+1;
      step.status="en curso"; step.startedAt=step.startedAt||nowIso(); step.updatedAt=nowIso();
    }
    if(btn.dataset.stepAction==="pause"){ step.status="pausada";step.updatedAt=nowIso(); }
    if(btn.dataset.stepAction==="complete"){ step.status="completada";step.completedAt=nowIso();step.updatedAt=nowIso(); }
    persist();renderStep();
  });

  $("#newTaskButton").addEventListener("click",()=>openTaskDialog());
  $("#cancelTaskDialog").addEventListener("click",()=>$("#taskDialog").close());
  ["taskViewFilter","taskStatusFilter","taskSort"].forEach(id=>$("#"+id).addEventListener("change",renderTasks));
  $("#taskForm").addEventListener("submit",e=>{
    e.preventDefault();
    const payload={title:$("#taskTitle").value,description:$("#taskDescription").value,priority:$("#taskPriority").value,dueDate:$("#taskDueDate").value||null,status:$("#taskStatus").value,firstStep:$("#taskFirstStep").value};
    const valid=validateTask(payload);
    $("#taskForm .field-error").textContent=valid.ok?"":valid.error;
    if(!valid.ok)return;
    const existing=state.tasks.find(t=>t.id===$("#taskId").value);
    if(existing){
      const wasCompleted=existing.status==="completado";
      Object.assign(existing,valid.value,{updatedAt:nowIso()});
      if(!wasCompleted && existing.status==="completado") existing.completedAt=nowIso();
      if(wasCompleted && existing.status!=="completado") existing.completedAt=null;
    }else{
      state.tasks.push({id:uid("task"),...valid.value,createdAt:nowIso(),updatedAt:nowIso(),completedAt:valid.value.status==="completado"?nowIso():null});
    }
    persist();$("#taskDialog").close();renderTasks();
  });
  $("#taskList").addEventListener("click",e=>{
    const btn=e.target.closest("[data-task-action]");if(!btn)return;
    const task=state.tasks.find(t=>t.id===btn.dataset.id);if(!task)return;
    if(btn.dataset.taskAction==="edit"){openTaskDialog(task);return;}
    if(btn.dataset.taskAction==="delete"){
      if(confirm(`¿Eliminar “${task.title}”? Esta acción no se puede deshacer.`)){state.tasks=state.tasks.filter(t=>t.id!==task.id);}
    }
    if(btn.dataset.taskAction==="complete"){task.status="completado";task.completedAt=nowIso();task.updatedAt=nowIso();}
    if(btn.dataset.taskAction==="reopen"){task.status="pendiente";task.completedAt=null;task.updatedAt=nowIso();}
    persist();renderTasks();
  });

  $("#timerPresetGroup").addEventListener("click",e=>{
    const b=e.target.closest("[data-minutes]");if(!b)return;
    $$("#timerPresetGroup button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#customMinutes").value=b.dataset.minutes;
    if(!activeTimerSession || !["running","paused"].includes(activeTimerSession.status)) paintTimer(null,Number(b.dataset.minutes)*60000);
  });
  $("#customMinutes").addEventListener("input",()=>{ const n=Math.max(1,Math.min(60,Number($("#customMinutes").value)||1)); if(!activeTimerSession||!["running","paused"].includes(activeTimerSession.status)) paintTimer(null,n*60000); });
  $("#timerStart").addEventListener("click",()=>{
    if(activeTimerSession?.status==="paused"){timer.resume();return;}
    const preset=Number($("#customMinutes").value)||Number($("#timerPresetGroup .active")?.dataset.minutes)||10;
    const min=Math.max(1,Math.min(60,preset));$("#customMinutes").value=min;$("#timerCompletionMessage").hidden=true;timer.start(min,Number($("#breakMinutes").value)||0);
  });
  $("#timerPause").addEventListener("click",()=>timer.pause());
  $("#timerCancel").addEventListener("click",()=>timer.cancel());
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")timer.restore();});

  $$(".period-tabs button").forEach(b=>b.addEventListener("click",()=>{progressPeriod=Number(b.dataset.period);renderProgress();}));
  $$(".utility-group button").forEach(b=>b.addEventListener("click",()=>{
    state.utilities=state.utilities||[];state.utilities.push({id:uid("utility"),value:b.dataset.utility,createdAt:nowIso()});persist();$("#utilityStatus").textContent=`Registrado: ${b.dataset.utility}.`;renderProgress();
  }));
  $("#weeklyReviewForm").addEventListener("submit",e=>{
    e.preventDefault();
    state.reviews.push({id:uid("review"),useful:sanitizeText($("#reviewUseful").value,300),difficulty:sanitizeText($("#reviewDifficulty").value,300),goal:$("#reviewGoal").value,createdAt:nowIso()});
    if($("#reviewGoal").value){state.profile.goal=$("#reviewGoal").value;state.plan.goal=$("#reviewGoal").value;state.plan.recommendations=recommendationRules[$("#reviewGoal").value]||[];}
    persist();e.target.reset();alert("Revisión guardada.");
  });

  $("#generateSummaryButton").addEventListener("click",()=>{$("#professionalSummary").value=buildProfessionalSummary();});
  $("#printSummaryButton").addEventListener("click",()=>{if(!$("#professionalSummary").value)$("#professionalSummary").value=buildProfessionalSummary();window.print();});

  $("#largeTextToggle").addEventListener("change",e=>{state.settings.largeText=e.target.checked;persist();applySettings();});
  $("#reduceMotionToggle").addEventListener("change",e=>{state.settings.reduceMotion=e.target.checked;persist();applySettings();});
  $("#exportButton").addEventListener("click",()=>download(`enfokia-datos-${new Date().toISOString().slice(0,10)}.json`,exportState(state),"application/json"));
  $("#importInput").addEventListener("change",async e=>{
    const file=e.target.files?.[0]; if(!file)return;
    const status=$("#dataActionStatus");
    try{
      const parsed=JSON.parse(await file.text());validateState(parsed);
      if(!confirm("La importación reemplazará los datos actuales. ¿Continuar?"))return;
      state={...parsed,utilities:parsed.utilities||[]};persist();applySettings();status.textContent="Importación completada.";route();
    }catch(err){status.textContent=`No se importó el archivo: ${err.message}`;}
    finally{e.target.value="";}
  });
  $("#deleteAllButton").addEventListener("click",()=>{
    if(!confirm("¿Borrar todos los datos de Enfokia guardados en este navegador? Esta acción no se puede deshacer."))return;
    state=clearState();activeTimerSession=null;applySettings();$("#dataActionStatus").textContent="Datos locales borrados.";go("bienvenida");
  });
}

function initLogo(){
  const img=$("#brandLogo"),fallback=$("#brandFallback");
  img.addEventListener("load",()=>{img.hidden=false;fallback.hidden=true;});
  img.addEventListener("error",()=>{img.hidden=true;fallback.hidden=false;});
}
function init(){
  initLogo();applySettings();bind();$("#storageNotice").hidden=isStorageAvailable();
  if(!location.hash) location.hash=state.profile.createdAt?"#/inicio":"#/bienvenida"; else route();
  timer.restore();
}
init();
