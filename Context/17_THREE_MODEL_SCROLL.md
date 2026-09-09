# Recorrido de tres modelos — 2026-09-08

## Alcance vigente

La fuente exclusiva de GLB es `C:\Users\PLAYER666\Documents\3d`:

| Archivo fuente | Copia servida | Capítulo |
| --- | --- | --- |
| devsmanager_logo_premium_v03.glb | /models/logo.glb | Identidad |
| binary_globe_astra_v03.glb | /models/globe.glb | Conexión |
| devsmanager_atelier_v07.glb | /models/atelier.glb | Creación |

Los originales permanecen intactos. Las copias se verifican por SHA-256. El inventario exacto está en ASSET_INVENTORY.json. Las tres imágenes de espera ya existentes corresponden a esos mismos modelos; no son otros diseños. No se usó generación de IA local ni se modificó Blender.

## Comportamiento

- Portada: logo frontal y completo, sin añadir el antiguo giro incorrecto de −90° sobre X.
- Tres capítulos con escenario fijo durante el scroll, giro 0–360°, avance reversible y suavizado independiente de la frecuencia de pantalla.
- La esfera reproduce su propia animación interna; su fondo no gira con ella. El estudio combina giro global con animación de manos.
- Navegación inferior Identidad / Conexión / Creación e indicador del ángulo.
- Iniciar recorrido 3D activa voluntariamente el movimiento y conserva la elección durante la sesión. La preferencia del sistema de movimiento reducido se respeta inicialmente. También existe Activar/Pausar movimiento.
- Tomar el control abre un diálogo: arrastre, rueda/pellizco, zoom con botones, frente/arriba/abajo, recentrar, animar y Escape para salir. La cámara se restablece al cerrar y reabrir.
- Galería limitada a los mismos tres modelos. Sin calzado ni versiones anteriores de personajes o marcas.

## Implementación

`assets/js/showroom-catalog.js` es la única lista de modelos. `home.js` genera capítulos y selector. `scene3d.js` reutiliza un solo contexto WebGL y recorta el render a los espacios reservados de cada modelo; así no tapa textos. El diálogo reutiliza el mismo canvas. Carga diferida y caché de hasta tres escenas. `showroom-math.js` contiene encuadre y avance comprobables sin navegador.

Las mallas exportadas combinadas tenían cajas locales sobredimensionadas. Se calculan límites a partir de los vértices reales una sola vez por carga. La esfera se encuadra por sus mallas GLOBE_, sin usar la matriz del fondo como límite del objeto principal.

## Recuperación

Estado anterior: `checkpoints/three-models-20260908/before.zip`.

Nueve GLB retirados, seis imágenes y la atribución del zapato están preservados en `checkpoints/three-models-20260908/inactive-assets/`. No se eliminaron definitivamente. No restaurarlos en `public` salvo nueva solicitud: Vite copia todo `public` a producción. Los checkpoints están excluidos de Git.

## Verificación y límites

Ejecutar `npm run build` y luego `npm test`. La suite comprueba los tres archivos permitidos, hashes de origen/copia/build, orientación del logo, vuelta completa y reversibilidad, suavizado, encuadre de órbita en varios formatos, ajuste frontal e integridad de entradas.

Estas pruebas no certifican accesibilidad ni sustituyen pruebas de gestos en dispositivos físicos. La comprobación visual previa confirmó logo frontal, esfera girando al pasar de 50° a 193° y estudio cargado. Tras restringir el catálogo se validaron build, tests y respuestas HTTP; no se repitió una auditoría visual completa. Pendientes: Safari/iOS reales y evaluación de rendimiento con red móvil.

Desarrollo local: `npm run dev` en D:\DevsManager. No se publicó, no se hizo push y no se modificaron los otros proyectos.
