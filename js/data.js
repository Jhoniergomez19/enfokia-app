
export const dimensions = {
  "Inicio de tareas": ["I1","I2","I3"],
  "Atención": ["A1","A2","A3"],
  "Organización": ["O1","O2","O3"],
  "Gestión del tiempo": ["T1","T2","T3"],
  "Finalización": ["F1","F2","F3"],
  "Recordatorios": ["R1","R2","R3"]
};

export const questions = [
  {id:"I1",dimension:"Inicio de tareas",text:"¿Con qué frecuencia te cuesta empezar una tarea aunque sabes qué debes hacer?"},
  {id:"I2",dimension:"Inicio de tareas",text:"¿Con qué frecuencia aplazas una actividad porque no sabes cuál debería ser el primer paso?"},
  {id:"I3",dimension:"Inicio de tareas",text:"¿Con qué frecuencia terminas haciendo otras cosas cuando intentas comenzar una obligación?"},
  {id:"A1",dimension:"Atención",text:"¿Con qué frecuencia pierdes el hilo de una actividad antes de terminarla?"},
  {id:"A2",dimension:"Atención",text:"¿Con qué frecuencia necesitas volver a leer o revisar información porque te distrajiste?"},
  {id:"A3",dimension:"Atención",text:"¿Con qué frecuencia te desvías hacia otra actividad sin haberlo planeado?"},
  {id:"O1",dimension:"Organización",text:"¿Con qué frecuencia te cuesta decidir qué tarea atender primero?"},
  {id:"O2",dimension:"Organización",text:"¿Con qué frecuencia tienes varias tareas abiertas y te resulta difícil organizarlas?"},
  {id:"O3",dimension:"Organización",text:"¿Con qué frecuencia pierdes tiempo buscando información o materiales necesarios para una tarea?"},
  {id:"T1",dimension:"Gestión del tiempo",text:"¿Con qué frecuencia calculas menos tiempo del que realmente necesitas para una actividad?"},
  {id:"T2",dimension:"Gestión del tiempo",text:"¿Con qué frecuencia comienzas demasiado tarde una tarea con fecha de entrega?"},
  {id:"T3",dimension:"Gestión del tiempo",text:"¿Con qué frecuencia se te pasa el tiempo sin darte cuenta mientras realizas otra actividad?"},
  {id:"F1",dimension:"Finalización",text:"¿Con qué frecuencia dejas actividades empezadas sin terminarlas?"},
  {id:"F2",dimension:"Finalización",text:"¿Con qué frecuencia te cuesta retomar una tarea después de interrumpirla?"},
  {id:"F3",dimension:"Finalización",text:"¿Con qué frecuencia necesitas varios intentos para completar una actividad pendiente?"},
  {id:"R1",dimension:"Recordatorios",text:"¿Con qué frecuencia olvidas una actividad que habías planeado realizar?"},
  {id:"R2",dimension:"Recordatorios",text:"¿Con qué frecuencia recuerdas un compromiso cuando ya es demasiado tarde para prepararte?"},
  {id:"R3",dimension:"Recordatorios",text:"¿Con qué frecuencia olvidas revisar notas o recordatorios que habías preparado?"}
];

export const answerOptions = [
  {value:0,label:"Nunca"}, {value:1,label:"Rara vez"}, {value:2,label:"A veces"},
  {value:3,label:"A menudo"}, {value:4,label:"Casi siempre"}, {value:null,label:"Prefiero no responder"}
];

export const recommendationRules = {
  "Empezar tareas":["Primer paso","Modo foco"],
  "Mantener el foco":["Modo foco","Primer paso"],
  "Organizar pendientes":["Mis pendientes","Primer paso"],
  "Gestionar el tiempo":["Modo foco","Mis pendientes"],
  "Terminar tareas":["Primer paso","Mis pendientes"],
  "Recordar compromisos":["Mis pendientes","Revisión diaria en Inicio"]
};

export const dimensionToGoal = {
  "Inicio de tareas":"Empezar tareas",
  "Atención":"Mantener el foco",
  "Organización":"Organizar pendientes",
  "Gestión del tiempo":"Gestionar el tiempo",
  "Finalización":"Terminar tareas",
  "Recordatorios":"Recordar compromisos"
};
