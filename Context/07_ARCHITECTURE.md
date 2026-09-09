# Arquitectura

- `index.html`: contenido semántico, narrativa, CTA y controles DOM.
- `assets/css/home.css`: sistema visual inmersivo y responsive.
- `assets/js/home.js`: progreso DOM y activación de capítulos.
- `assets/js/scene3d.js`: renderer, asset, luces, scroll, cámara, controles y fallback.
- `assets/js/layout.js`: inserta header/footer compartidos en el bundle.
- `vite.config.js`: entradas multipágina preservadas.

El progreso de scroll se mantiene en variables mutables y el render loop aplica damping; React/state no interviene por frame. Three.js solo se carga en la página principal.
