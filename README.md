# ENFOKIA — MVP Nivel 1 (BLAST)

**Enfokia** es una miniaplicación web local de productividad personal. Ayuda a reconocer dificultades cotidianas, elegir un objetivo, convertir tareas en primeros pasos, organizar pendientes, usar un temporizador de foco y revisar actividad real.

> Enfokia no diagnostica TDAH, no mide gravedad clínica, no prescribe tratamientos y no sustituye una evaluación profesional.

## Arquitectura

- `index.html`: estructura semántica, vistas y diálogos.
- `styles.css`: sistema visual responsive y accesible.
- `js/data.js`: preguntas, dimensiones y reglas de recomendación.
- `js/storage.js`: estado local versionado, exportación e importación.
- `js/assessment.js`: medias por dimensión, empates y prioridad.
- `js/tasks.js`: utilidades de tareas, validación, filtros y orden.
- `js/timer.js`: temporizador basado en marcas temporales.
- `js/app.js`: navegación, eventos y renderizado.
- `assets/logo-enfokia.png`: **debe reemplazarse por el logotipo original aprobado**.

No usa backend, cuentas, APIs, analítica remota ni bibliotecas externas.

## Almacenamiento

Clave: `enfokia.v1`

Esquema principal:
- `settings`
- `profile`
- `assessment`
- `plan`
- `tasks`
- `steps`
- `focusSessions`
- `reviews`
- `utilities`

El almacenamiento es local al navegador. No sincroniza entre dispositivos y puede perderse si el usuario borra los datos del sitio.

## Logotipo e instalación como app

Se incorporó el **logotipo aprobado de Enfokia** como asset oficial del proyecto.

Archivos:
- `assets/logo-enfokia.png`: original aprobado usado dentro de la interfaz.
- `assets/icon-192.png`: icono PWA.
- `assets/icon-512.png`: icono PWA.
- `assets/apple-touch-icon.png`: icono para “Añadir a pantalla de inicio” en iPhone/iPad.
- `manifest.webmanifest`: nombre de instalación `Enfokia`, colores e iconos.
- `sw.js`: service worker para caché básica y funcionamiento offline del shell.

El nombre visible de la app instalada es **Enfokia**.

Si ya habías instalado una versión anterior, puede ser necesario desinstalarla y volver a instalarla, o limpiar los datos del sitio, para que el sistema operativo reemplace el icono anterior.

## Abrir y probar localmente

Por usar módulos ES6, se recomienda un servidor estático local:

### Python
```bash
cd enfokia
python -m http.server 8080
```
Luego abre `http://localhost:8080`.

### Node (alternativa)
Usa cualquier servidor estático local. No se requiere proceso de build.

## Publicación en Netlify

Nivel 1, sin build:
1. Verifica que `index.html` esté en la raíz de la carpeta `enfokia`.
2. Sustituye `assets/logo-enfokia.png` por el logotipo aprobado.
3. Sube la carpeta o el ZIP mediante despliegue manual en Netlify.
4. Directorio de publicación: la raíz de `enfokia`.
5. No hay variables de entorno ni secretos.
6. Abre el enlace HTTPS y prueba navegación, almacenamiento, importación/exportación y temporizador.

Se incluye `_redirects` con fallback a `index.html`, aunque la app usa rutas hash y no depende de él.

## Funciones incluidas

- Bienvenida y límites de uso.
- Preferencias y confirmación 18+.
- Cuestionario “Mi mapa” de 18 preguntas.
- Respuestas omitidas como `null`.
- Media por dimensión con mínimo 2 respuestas válidas.
- Empates conservados.
- Prioridad manual por encima del resultado descriptivo.
- Plan de herramientas editable.
- Inicio con una sola acción destacada.
- Primer paso con estados.
- CRUD de pendientes, prioridad, fecha, filtros y orden.
- Modo foco 1–60 min, pausa, reanudación, cancelación y restauración básica tras recarga.
- Progreso de 7 y 30 días.
- Utilidad percibida.
- Revisión semanal.
- Orientación profesional y resumen imprimible.
- Exportación e importación JSON con validación.
- Borrado total con confirmación.
- Preferencias de texto grande y movimiento reducido.
- Protección básica contra inyección mediante escape de HTML y saneamiento de entradas.

## Pruebas ejecutadas en el entorno de entrega

Se ejecutaron verificaciones automáticas de:
- existencia de archivos esperados;
- sintaxis JavaScript con `node --check`;
- presencia de las 18 preguntas;
- cálculo descriptivo con omisiones e información insuficiente;
- empate de dimensiones;
- prioridad manual;
- reglas de recomendación;
- validación básica de títulos;
- estructura de almacenamiento versionado.

## Pruebas pendientes de verificación manual en navegador

Deben verificarse manualmente en Chrome/Firefox/Safari:
- lector de pantalla real;
- navegación completa solo con teclado;
- pantalla de 320 px y zoom 200%;
- persistencia real tras recarga;
- cambio de pestaña durante temporizador;
- importación/exportación desde el selector de archivos;
- fallos deliberados de `localStorage`;
- impresión del resumen;
- comportamiento en navegadores móviles.

## Limitaciones conocidas

- No hay sincronización entre dispositivos.
- No hay cuentas ni recuperación en la nube.
- No usa notificaciones del sistema.
- El temporizador se recalcula al volver o recargar usando marcas temporales, pero debe validarse manualmente en varios navegadores.
- No hay backend, pagos, IA ni integraciones externas.

## Funciones excluidas del MVP

- Diagnóstico o screening clínico.
- ASRS u otras escalas clínicas.
- Consejos médicos personalizados.
- IA generativa.
- Notificaciones push.
- Cuentas, base de datos, permisos y sincronización.
- Pagos.
- Analítica remota.

## Mejoras futuras

- PWA offline una vez disponible el logotipo aprobado para crear iconos.
- Pruebas automatizadas end-to-end con Playwright.
- Modo de alto contraste adicional.
- Mejoras de exportación imprimible.
- Recordatorios locales opcionales, si se decide incorporar permisos del navegador.
