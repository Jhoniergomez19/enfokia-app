# ENFOKIA — Migración a Abacus.AI

## Objetivo

Partir del MVP existente de Enfokia y convertirlo en una app con inicio de sesión y datos persistentes por usuario **sin rediseñar la interfaz ni reescribir funcionalidades que ya funcionan**.

## Identidad que debe conservarse

- Nombre visible: **Enfokia**
- Eslogan: **Tu atención, a tu manera**
- Logo oficial: `assets/logo-enfokia.png`
- Iconos PWA:
  - `assets/icon-192.png`
  - `assets/icon-512.png`
  - `assets/apple-touch-icon.png`
- Paleta:
  - Verde principal: `#117C79`
  - Menta: `#B7E5DB`
  - Marfil: `#F7F8F5`
  - Azul tinta: `#233746`
  - Ámbar: `#F2BD73`
- Dirección visual: wellness minimalista + dashboard personal
- Mobile-first, accesible y tranquila
- Mantener navegación inferior: Inicio, Pendientes, Mi progreso, Mi espacio

## Regla principal para Abacus AI Agent

**Trabaja sobre el código existente. No reconstruyas Enfokia desde cero y no cambies el diseño general salvo que sea necesario para autenticación.**

Antes de modificar:
1. Revisa `README.md`.
2. Revisa todos los archivos de `js/`.
3. Revisa `styles.css`.
4. Revisa `manifest.webmanifest`.
5. Revisa el flujo actual completo.

## Cambio solicitado — Fase 1

Agregar únicamente:
1. Inicio de sesión/registro usando la autenticación nativa disponible en Abacus.AI.
2. Sesión persistente.
3. Cierre de sesión.
4. Protección de datos por usuario.
5. Base de datos real para sincronizar los datos personales de cada cuenta.

No agregar todavía:
- pagos;
- IA generativa;
- chat;
- notificaciones;
- gamificación;
- analítica;
- funciones médicas;
- nuevas pantallas no solicitadas.

## Datos actuales a migrar

El MVP actual guarda localmente:

- `settings`
- `profile`
- `assessment`
- `plan`
- `tasks`
- `steps`
- `focusSessions`
- `reviews`
- `utilities`

Actualmente están en `localStorage` bajo la clave `enfokia.v1`.

### Requisito de migración

Al primer inicio de sesión de un usuario:

- detectar si existen datos locales de `enfokia.v1`;
- mostrar una opción clara para **importarlos a su cuenta**;
- no borrar los datos locales hasta confirmar que la migración fue exitosa;
- evitar duplicados si la migración se repite;
- mantener exportación JSON como copia de seguridad.

## Modelo de datos sugerido

Usa el sistema de base de datos que Abacus.AI cree para la app, con aislamiento por usuario.

Tablas/colecciones sugeridas:

### user_settings
- user_id
- large_text
- reduce_motion
- updated_at

### user_profile
- user_id
- adult_confirmed
- goal
- preferred_duration
- created_at
- updated_at

### assessments
- id
- user_id
- answers_json
- impact
- contexts_json
- priority
- orientation
- completed_at
- updated_at

### plans
- id
- user_id
- goal
- recommendations_json
- updated_at

### tasks
- id
- user_id
- title
- description
- priority
- due_date
- status
- first_step
- created_at
- updated_at
- completed_at

### steps
- id
- user_id
- task_name
- description
- first_step
- duration
- due_date
- status
- started_at
- completed_at
- resume_count
- created_at
- updated_at

### focus_sessions
- id
- user_id
- minutes
- break_minutes
- planned_ms
- elapsed_ms
- status
- started_at
- completed_at
- cancelled_at

### reviews
- id
- user_id
- useful
- difficulty
- goal
- created_at

### utilities
- id
- user_id
- value
- created_at

## Seguridad obligatoria

- Cada usuario solo puede leer/escribir sus propios datos.
- Nunca confiar en un `user_id` enviado libremente por el navegador.
- Asociar registros al usuario autenticado en servidor/backend.
- No exponer secretos en el frontend.
- Validar entradas también en el backend.
- Mantener los límites médicos y de privacidad actuales.

## Reglas funcionales que NO deben cambiar

- El cuestionario “Mi mapa” tiene 18 preguntas.
- `null` significa “Prefiero no responder”.
- Media descriptiva 0–4.
- Mínimo 2 respuestas válidas por dimensión.
- Sin categorías clínicas.
- Sin probabilidades diagnósticas.
- Conservar empates.
- La prioridad manual gana sobre el resultado descriptivo.
- El temporizador nunca completa tareas automáticamente.
- El usuario puede usar la app sin completar la evaluación.
- El progreso muestra datos reales, no inventados.

## Primera tarea recomendada para Abacus AI Agent

Haz una sola fase:

> Importa/usa este repositorio existente como base de Enfokia. No reconstruyas la app desde cero. Conserva exactamente su identidad visual, logo, paleta, navegación, PWA y lógica funcional. Agrega autenticación nativa de Abacus.AI y una base de datos real aislada por usuario. Migra la persistencia desde localStorage a datos sincronizados por cuenta, manteniendo localStorage solo como caché/fallback y ofreciendo al primer login importar `enfokia.v1`. No agregues ninguna función adicional. Primero revisa la arquitectura y enumera los archivos/tablas que vas a modificar; después implementa y prueba registro, login, logout, aislamiento entre dos usuarios, CRUD de tareas y recuperación de datos al volver a iniciar sesión.

## Estrategia para ahorrar créditos

1. **No vuelvas a pegar el brief completo en cada conversación.**
   Mantén este archivo y `README.md` dentro del repositorio.

2. **Usa GitHub como fuente de verdad.**
   Conecta el repositorio a Abacus AI Agent y pídele cambios sobre el código existente.

3. **Una función por tarea.**
   Ejemplo:
   - tarea 1: Auth + base de datos;
   - tarea 2: migración localStorage → cuenta;
   - tarea 3: pruebas y correcciones;
   - tarea 4: deployment.

4. **No pidas “mejora todo”.**
   Eso hace que el agente reanalice y regenere partes innecesarias.

5. **Antes de cada modificación pide que conserve lo ya funcional.**

6. **Prueba en el preview después de cada checkpoint.**
   Si una versión funciona, continúa desde ella; si falla, revierte.

7. **No actives IA generativa, pagos ni integraciones hasta necesitarlas.**

## Criterio de aceptación de la primera migración

La fase está terminada únicamente cuando:

- un usuario A puede registrarse/iniciar sesión;
- un usuario B puede registrarse/iniciar sesión;
- A no puede ver datos de B;
- las tareas, evaluación, plan, progreso y sesiones permanecen tras cerrar sesión y volver;
- los datos locales previos pueden importarse una sola vez;
- la app conserva el diseño actual;
- el logo oficial sigue siendo el icono PWA;
- no se han introducido diagnósticos, recomendaciones clínicas ni datos ficticios.
