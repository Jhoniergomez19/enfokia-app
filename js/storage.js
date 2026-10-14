
export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = "enfokia.v1";

const freshState = () => ({
  version: SCHEMA_VERSION,
  settings:{largeText:false,reduceMotion:false},
  profile:{adultConfirmed:false,goal:"",preferredDuration:10,createdAt:null},
  assessment:{answers:{},impact:"",contexts:[],priority:"",orientation:"Ahora no",completedAt:null},
  plan:{goal:"",recommendations:[],updatedAt:null},
  tasks:[],
  steps:[],
  focusSessions:[],
  reviews:[],
  utilities:[]
});

let memoryState = freshState();
let storageAvailable = true;

function clone(v){ return JSON.parse(JSON.stringify(v)); }

export function isStorageAvailable(){ return storageAvailable; }

export function validateState(input){
  if(!input || typeof input!=="object" || Array.isArray(input)) throw new Error("Formato inválido.");
  if(input.version !== SCHEMA_VERSION) throw new Error("Versión de datos no compatible.");
  const required = ["settings","profile","assessment","plan","tasks","steps","focusSessions","reviews"];
  for(const key of required) if(!(key in input)) throw new Error(`Falta la sección ${key}.`);
  if(!Array.isArray(input.tasks) || !Array.isArray(input.steps) || !Array.isArray(input.focusSessions) || !Array.isArray(input.reviews)) throw new Error("Listas inválidas.");
  if(input.utilities !== undefined && !Array.isArray(input.utilities)) throw new Error("Utilidades inválidas.");
  if(!input.assessment || typeof input.assessment.answers !== "object") throw new Error("Evaluación inválida.");
  return true;
}

export function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw){ memoryState=freshState(); return clone(memoryState); }
    const parsed = JSON.parse(raw);
    validateState(parsed);
    memoryState = {...freshState(), ...parsed, utilities: parsed.utilities || []};
    return clone(memoryState);
  }catch(err){
    storageAvailable=false;
    memoryState=freshState();
    return clone(memoryState);
  }
}

export function saveState(state){
  memoryState=clone(state);
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageAvailable=true;
    return true;
  }catch(err){
    storageAvailable=false;
    return false;
  }
}

export function clearState(){
  memoryState=freshState();
  try{ localStorage.removeItem(STORAGE_KEY); storageAvailable=true; }catch(err){ storageAvailable=false; }
  return clone(memoryState);
}

export function exportState(state){ return JSON.stringify(state,null,2); }
