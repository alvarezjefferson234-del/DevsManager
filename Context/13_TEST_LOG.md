# Registro de pruebas

## TEST-001 — Build multipágina

- Estado: PASS.
- Resultado: Vite 7.3.6 generó Inicio, Servicios, Proceso, Sobre mí y Contacto.

## TEST-002 — Dependencias

- Estado: PASS.
- Resultado: `npm audit --omit=dev` reportó cero vulnerabilidades.

## TEST-003 — Comprobaciones estáticas históricas (no auditoría de accesibilidad)

- Estado: PASS.
- Resultado: el validador comprobó canvas, control libre, vuelta 360°, reduced motion, fallback WebGL, cabecera GLB válida e IDs únicos.
- Alcance: comprobaba presencia de cadenas, no interacción real ni cumplimiento WCAG. Sustituido por la suite de TEST-005.

## TEST-004 — Entorno local

- Estado: PASS.
- Resultado: Inicio, Servicios, módulo 3D y GLB respondieron HTTP 200 en `http://127.0.0.1:5173/`.

## Pendiente fuera de esta ejecución

- Pruebas en dispositivos físicos y Safari/iOS reales.

## TEST-005 — Tres modelos exclusivos y matemáticas del recorrido

- 2026-09-08: `npm run build` correcto; `npm test`: 7 tests correctos, 0 fallos.
- Hashes origen/public/dist coincidentes; exactamente logo, esfera y estudio en public/models y dist/models.
- 0–360°, regreso al subir, suavizado, ajuste frontal y órbita probados para relaciones de aspecto de escritorio y estrechas.
- Ver `17_THREE_MODEL_SCROLL.md` para límites de esta validación.

## TEST-006 — Una pantalla por modelo

- 2026-09-08: build multipágina correcto; 10 tests correctos y 0 fallos.
- Tres escenas en HTML estático, una por archivo; sin portada/visor de galería duplicados.
- Selector de una sola pantalla probado durante transiciones y cámara del logo comprobada cada 10° en cuatro relaciones de aspecto.
- Sin nueva auditoría visual de navegador en esta revisión. Ver `18_FULLSCREEN_PRESENTATION.md`.

## TEST-007 — Scroll directo sin activación previa

- 2026-09-08: build correcto; 15 tests correctos, 0 fallos.
- Pruebas del controlador usado por el render: ambas preferencias de movimiento, reversibilidad, pausa que conserva pose y reanudación; poses y AnimationMixer real con clip de prueba.
- HTTP 200 y comprobación de que el servidor entrega el controlador nuevo, CSS corregido y los tres modelos autorizados.
- Sin reproducción visual de navegador. Detalles y checkpoint: `19_SCROLL_INPUT_FIX.md`.
