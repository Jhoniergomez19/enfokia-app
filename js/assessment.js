
import {dimensions, dimensionToGoal} from "./data.js";

export function calculateDimensionScores(answers){
  const scores={};
  for(const [dimension, ids] of Object.entries(dimensions)){
    const values=ids.map(id=>answers[id]).filter(v=>typeof v==="number" && v>=0 && v<=4);
    scores[dimension]=values.length>=2 ? Number((values.reduce((a,b)=>a+b,0)/values.length).toFixed(1)) : null;
  }
  return scores;
}

export function inferPriority(scores){
  const valid=Object.entries(scores).filter(([,v])=>typeof v==="number");
  if(!valid.length) return {goals:[],max:null};
  const max=Math.max(...valid.map(([,v])=>v));
  const dimensionsAtMax=valid.filter(([,v])=>v===max).map(([d])=>d);
  return {goals:dimensionsAtMax.map(d=>dimensionToGoal[d]),max};
}

export function resolvedGoal(state){
  if(state.assessment.priority) return {goal:state.assessment.priority,source:"manual"};
  if(state.profile.goal) return {goal:state.profile.goal,source:"manual"};
  const inferred=inferPriority(calculateDimensionScores(state.assessment.answers||{}));
  return {goal:inferred.goals[0]||"",source:inferred.goals.length?"resultado":"ninguno",ties:inferred.goals};
}
