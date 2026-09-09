import { ASSETS } from './showroom-catalog.js';

// The three fullscreen stages are static HTML: no duplicate hero or gallery canvas.
const chapterNav = document.createElement('nav');
chapterNav.className = 'experience-nav';
chapterNav.setAttribute('aria-label', 'Descubre nuestra historia');
chapterNav.hidden = true;
chapterNav.innerHTML = ASSETS.map((asset, index) => `<a href="#design-${asset.id}" data-chapter-link="${asset.id}"><span>${String(index + 1).padStart(2, '0')}</span> ${asset.short}</a>`).join('');
document.body.append(chapterNav);

const picker = document.querySelector('#model-picker');
ASSETS.forEach((asset, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.inspect = asset.id;
  button.innerHTML = `<span class="picker-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${asset.label}</strong><small>VER DE CERCA</small></span><span aria-hidden="true">↗</span>`;
  picker.append(button);
});

import('./scene3d.js').catch(error => {
  console.error('No se pudo iniciar el visor 3D', error);
  document.querySelector('#scene-status-copy').textContent = 'Puedes disfrutar de las imágenes. La vista de cerca no está disponible en este momento.';
  document.querySelectorAll('.slot-state').forEach(label => { label.hidden = false; label.textContent = 'Vista previa disponible'; });
  document.querySelectorAll('[data-inspect]').forEach(button => { button.disabled = true; button.title = 'La vista de cerca no está disponible en este momento.'; });
});
