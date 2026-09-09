# Corrección del scroll — 2026-09-08

## Fallos encontrados en el código

1. `prefers-reduced-motion: reduce` inicializaba `motionEnabled=false`. El render fijaba tanto el ángulo como el tiempo de las animaciones en cero. Un valor antiguo en `sessionStorage` podía mantenerlo desactivado aunque cambiara la preferencia del sistema.
2. `overflow-x:hidden` heredado en `body` introducía un ancestro de desplazamiento para las pantallas sticky. Ahora Inicio usa `overflow-x:clip; overflow-y:visible`, sin alterar las otras páginas. El diálogo conserva su bloqueo explícito de scroll.

## Comportamiento vigente

- El scroll directo está activo al entrar: no hay activación previa ni preferencia antigua que pueda congelarlo.
- Movimiento reducido elimina inercia, inclinación secundaria y desvanecimientos; el ángulo sigue directamente la posición elegida por el usuario al desplazarse.
- Pausar 3D conserva la última pose, no devuelve el objeto bruscamente a cero. Es una decisión explícita de la visita actual. La navegación no deshace esa pausa.
- El controlador está en `assets/js/showroom-scroll.js`. El render utiliza el mismo controlador y `applyScrollPose` que se prueban en Node. El logo y el estudio rotan; la esfera usa su clip para no rotar el fondo binario.
- Se conservan los tres modelos originales, la disposición de una pantalla por modelo y el visor libre.

## Checkpoint reversible

`checkpoints/scroll-fix-20260908-205850/before.zip`: scene3d.js, showroom-math.js, home.css, showroom.test.mjs e index.html anteriores. `showroom-scroll.js` es un archivo nuevo de esta revisión. No se modificaron GLB ni proyectos externos.

## Verificación

- `npm run build`: correcto, cinco páginas.
- `npm test`: 15 correctos, 0 fallos. Nuevas regresiones para activación inmediata con ambas preferencias del sistema, giro sin inercia, pausa/reanudación, poses de los tres modelos y avance reversible de AnimationMixer real de Three.js con un clip de prueba.
- HTTP 200 en Inicio, módulo 3D y los tres GLB. El módulo servido contiene el nuevo controlador y no lee la antigua pausa de sessionStorage; el CSS servido contiene la corrección de overflow.
- Estas pruebas no son una reproducción visual del navegador ni usan el clip completo de cada GLB. No se realizaron screenshots ni interacción automatizada de navegador en esta revisión. Pendiente confirmar visualmente el scroll real y dispositivos físicos.
- Entorno mantenido en http://127.0.0.1:5173/, sin publicación ni push.
