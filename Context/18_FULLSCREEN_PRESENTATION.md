# Presentación de pantalla completa — 2026-09-08

Sustituye la composición del documento 17, manteniendo los mismos tres archivos autorizados de Documents/3d.

## Diseño vigente

- Tres pantallas: logo, esfera y estudio, en ese orden. Exactamente un `data-scene` por modelo, presente en el HTML estático.
- Se eliminó la portada duplicada y el visor adicional de la galería. El selector final abre directamente el diálogo 360°; no agrega otro canvas a la página.
- Cada capítulo mantiene una composición de altura de pantalla bajo la cabecera: título y descripción arriba, escenario 3D a todo el ancho en el centro y acciones abajo. El scroll del capítulo (190svh de recorrido) mantiene la pantalla mientras gira el objeto.
- Solo una escena WebGL seleccionada por frame. La escena saliente y sus textos se desvanecen al abandonar su pantalla; no se renderizan dos modelos simultáneamente. Las imágenes de espera de las pantallas inactivas permanecen ocultas mientras funciona WebGL.
- El logo empieza frontal a 0° y la cámara se ajusta a sus ocho esquinas a medida que gira, para mantener legibilidad y evitar recortes.
- El siguiente GLB se precarga al superar el 55% del capítulo, salvo ahorro de datos del navegador. No se añaden modelos ni dependencias.
- No se interceptan eventos wheel/touch ni se bloquea el desplazamiento. En pantallas muy bajas se usa flujo normal para mantener los controles accesibles. Movimiento reducido y visor libre se conservan.

## Recuperación

`checkpoints/full-screen-20260908/before.zip` contiene el estado anterior a esta revisión. Los modelos originales no fueron modificados.

## Verificación

`npm run build` y `npm test`. La suite añade unicidad de las tres pantallas, selección de una sola escena durante transiciones y encuadre adaptativo del logo en todas las rotaciones y diferentes proporciones de pantalla. Las pruebas matemáticas/estructurales no equivalen a auditoría visual ni WCAG. No se solicitó una nueva prueba de navegador en esta revisión.

El entorno continúa siendo local; sin publicación ni push.
