import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { assetById, assetUrl } from './showroom-catalog.js';
import { chapterProgress, fitDistance, chooseScreen, screenFocus, fitRotatedDistance } from './showroom-math.js';
import { createScrollPlayback, applyScrollPose } from './showroom-scroll.js';

const canvas = document.querySelector('#brand-canvas');
const layer = document.querySelector('#webgl-layer');
const slots = [...document.querySelectorAll('.scene-slot')];
const dialog = document.querySelector('#inspection-dialog');
const viewport = document.querySelector('#inspection-viewport');
const loading = viewport.querySelector('.inspection-loading');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const playback = createScrollPlayback(motion.matches);
const motionToggle = document.querySelector('#motion-toggle');
function updateMotionToggle() {
  motionToggle.hidden = false;
  motionToggle.setAttribute('aria-pressed', String(!playback.enabled));
  motionToggle.setAttribute('aria-label', 'Pausar animación');
  motionToggle.textContent = playback.enabled ? 'Ⅱ Pausar' : '▷ Reanudar';
  motionToggle.title = playback.enabled ? 'Pausar animación' : 'Reanudar animación';
}
function setMotion(enabled) {
  playback.setEnabled(enabled);
  updateMotionToggle();
}
motionToggle.addEventListener('click', () => setMotion(!playback.enabled));
motion.addEventListener('change', () => playback.setReducedMotion(motion.matches));
updateMotionToggle();
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setClearColor(0, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.autoClear = false;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, .01, 100);
const environment = new RoomEnvironment();
const pmrem = new THREE.PMREMGenerator(renderer);
const envTarget = pmrem.fromScene(environment, .025);
scene.environment = envTarget.texture;
scene.environmentIntensity = .8;
environment.dispose();
pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xdbefff, 0x586480, 1));
const key = new THREE.DirectionalLight(0xffffff, 2.5);
key.position.set(2, 4, 5);
scene.add(key);
const rim = new THREE.DirectionalLight(0x81cfff, 2);
rim.position.set(-3, 1, -2);
scene.add(rim);
const controls = new OrbitControls(camera, canvas);
controls.enabled = false;
controls.enableDamping = true;
controls.dampingFactor = .09;
controls.enablePan = false;
controls.minPolarAngle = .015;
controls.maxPolarAngle = Math.PI - .015;
const loader = new GLTFLoader();
const cache = new Map();
const pending = new Map();
const failures = new Set();
let protectedIds = new Set();
let inspectionId = null;
let returnFocus = null;
let playing = false;
let activeInspection = null;
let lastSize = '';
let lastTime = performance.now();
let lost = false;
let requestVersion = 0;
const smoothedProgress = new WeakMap();
const chapters = [...document.querySelectorAll('.story-step')];
const chapterNav = document.querySelector('.experience-nav');
const chapterLinks = [...document.querySelectorAll('[data-chapter-link]')];
let headerHeight = 86;

function visibleBounds(root, id) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const point = new THREE.Vector3();
  root.traverseVisible(object => {
    if (!object.isMesh) return;
    if (id === 'globe' && !object.name.startsWith('GLOBE_')) return;
    // Exported merged meshes have inflated local AABBs; measure actual vertices once.
    const positions = object.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) box.expandByPoint(point.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld));
  });
  return box;
}

function disposeRecord(record) {
  scene.remove(record.pivot);
  record.mixer?.stopAllAction();
  record.mixer?.uncacheRoot(record.gltf.scene);
  const geometries = new Set(), materials = new Set(), textures = new Set();
  record.pivot.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of (Array.isArray(object.material) ? object.material : [object.material])) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  geometries.forEach(value => value.dispose());
  materials.forEach(value => value.dispose());
  textures.forEach(value => { value.source.data?.close?.(); value.dispose(); });
}

function trimCache() {
  const removable = [...cache.entries()].filter(([id]) => !protectedIds.has(id)).sort((a, b) => a[1].used - b[1].used);
  while (cache.size > 3 && removable.length) {
    const [id, record] = removable.shift();
    disposeRecord(record);
    cache.delete(id);
  }
}

async function getModel(id) {
  if (cache.has(id)) { cache.get(id).used = performance.now(); return cache.get(id); }
  if (pending.has(id)) return pending.get(id);
  if (failures.has(id)) return null;
  const asset = assetById(id);
  if (!asset) return null;
  const promise = (async () => {
    try {
      const gltf = await loader.loadAsync(assetUrl(asset));
      const pivot = new THREE.Group();
      const normalized = new THREE.Group();
      const oriented = new THREE.Group();
      // Logo GLBs already use Y-up, +Z front. Do NOT add a -90° X rotation.
      oriented.rotation.set(...asset.orientation);
      oriented.add(gltf.scene);
      normalized.add(oriented);
      pivot.add(normalized);
      gltf.scene.traverse(object => {
        const name = object.name.toLowerCase();
        if (asset.hide?.some(part => name.includes(part))) object.visible = false;
      });
      const box = visibleBounds(oriented, id);
      const size = box.getSize(new THREE.Vector3());
      if (box.isEmpty() || !Number.isFinite(size.length())) throw new Error('El modelo no tiene geometría válida.');
      const center = box.getCenter(new THREE.Vector3());
      normalized.scale.setScalar(2.4 / Math.max(size.x, size.y, size.z));
      oriented.position.sub(center);
      const fittedSize = size.multiplyScalar(normalized.scale.x).toArray();
      const mixer = gltf.animations.length ? new THREE.AnimationMixer(gltf.scene) : null;
      gltf.animations.forEach(clip => mixer.clipAction(clip).play());
      const record = { asset, gltf, pivot, mixer, size: fittedSize, duration: Math.max(0, ...gltf.animations.map(clip => clip.duration)), used: performance.now() };
      pivot.visible = false;
      scene.add(pivot);
      cache.set(id, record);
      trimCache();
      document.querySelector('#scene-status-copy').textContent = `Ya puedes descubrir «${asset.label}». Elige Ver de cerca para observar los detalles.`;
      return record;
    } catch (error) {
      failures.add(id);
      console.error(`Error al cargar ${asset.label}`, error);
      return null;
    } finally { pending.delete(id); }
  })();
  pending.set(id, promise);
  return promise;
}

function fit(record, width, height, wide = false) {
  camera.aspect = width / Math.max(height, 1);
  camera.up.set(0, 1, 0);
  const distance = wide ? fitRotatedDistance(record.size, camera.aspect, [record.pivot.rotation.x, record.pivot.rotation.y, record.pivot.rotation.z]) : fitDistance(record.size, camera.aspect, camera.fov) * (record.asset.id === 'globe' ? .68 : 1);
  camera.position.set(0, 0, distance);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  return distance;
}

function resetInspection(view = 'front') {
  if (!activeInspection) return;
  controls.enabled = false;
  controls.reset();
  const rect = viewport.getBoundingClientRect();
  const record = activeInspection;
  record.pivot.rotation.set(0, 0, 0);
  record.mixer?.setTime(0);
  const distance = fit(record, rect.width, rect.height, record.asset.layout === 'wide' && view === 'front');
  controls.target.set(0, 0, 0);
  if (view === 'top') camera.position.set(0, distance, .001);
  if (view === 'bottom') camera.position.set(0, -distance, .001);
  camera.lookAt(controls.target);
  controls.minDistance = distance * .25;
  controls.maxDistance = distance * 2.7;
  controls.update();
  controls.saveState();
  controls.enabled = true;
  dialog.dataset.view = view;
}

async function openInspection(id, trigger) {
  const asset = assetById(id);
  if (!asset) return;
  const version = ++requestVersion;
  inspectionId = id;
  protectedIds = new Set([id]);
  activeInspection = null;
  playing = false;
  returnFocus = trigger;
  document.querySelector('#play-3d').setAttribute('aria-pressed', 'false');
  document.querySelector('#inspection-title').textContent = asset.label;
  loading.hidden = false;
  loading.textContent = 'Un momento…';
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('is-inspecting');
  viewport.append(canvas);
  canvas.style.opacity = '1';
  canvas.setAttribute('aria-label', `Vista de cerca: ${asset.label}`);
  canvas.setAttribute('role', 'img');
  lastSize = '';
  if (lost) { loading.textContent = 'La vista se ha interrumpido. Recarga la página para continuar.'; return; }
  const record = await getModel(id);
  if (version !== requestVersion || !dialog.open) return;
  if (!record) { loading.textContent = 'No pudimos abrir esta vista. Vuelve a la página y recarga para intentarlo de nuevo.'; return; }
  activeInspection = record;
  loading.hidden = true;
  resetInspection();
}

document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-inspect]');
  if (trigger) openInspection(trigger.dataset.inspect, trigger);
});
document.querySelector('#exit-3d').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  ++requestVersion;
  inspectionId = null;
  activeInspection = null;
  playing = false;
  controls.enabled = false;
  layer.append(canvas);
  document.body.classList.remove('is-inspecting');
  canvas.removeAttribute('role');
  canvas.removeAttribute('aria-label');
  lastSize = '';
  slots.forEach(slot => slot.classList.remove('is-rendered'));
  returnFocus?.focus({ preventScroll: true });
});
document.querySelector('#reset-3d').addEventListener('click', () => resetInspection());
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  if (!activeInspection) return;
  const view = button.dataset.view;
  if (view === 'left' || view === 'right') {
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), view === 'left' ? -.35 : .35);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  } else resetInspection(view);
}));
document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
  if (!activeInspection) return;
  const offset = camera.position.clone().sub(controls.target);
  offset.setLength(THREE.MathUtils.clamp(offset.length() * (button.dataset.zoom === 'in' ? .8 : 1.25), controls.minDistance, controls.maxDistance));
  camera.position.copy(controls.target).add(offset);
  controls.update();
}));
document.querySelector('#play-3d').addEventListener('click', event => {
  playing = !playing;
  event.currentTarget.setAttribute('aria-pressed', String(playing));
});

canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  lost = true;
  slots.forEach(slot => {
    slot.classList.remove('is-rendered', 'is-standby');
    const state = slot.querySelector('.slot-state');
    state.hidden = false;
    state.textContent = 'Vista previa · recarga para continuar';
  });
  chapters.forEach(chapter => chapter.querySelector('.stage-inner').style.setProperty('--screen-focus', '1'));
  loading.hidden = false;
  loading.textContent = 'La vista se ha interrumpido. Recarga la página para continuar.';
});
canvas.addEventListener('webglcontextrestored', () => location.reload());

function renderFrame(now) {
  requestAnimationFrame(renderFrame);
  const delta = Math.min((now - lastTime) / 1000, .06);
  lastTime = now;
  if (lost || document.hidden) return;
  const width = inspectionId ? viewport.clientWidth : innerWidth;
  const height = inspectionId ? viewport.clientHeight : innerHeight;
  if (!width || !height) return;
  const sizeKey = `${width},${height},${inspectionId || 'story'}`;
  if (sizeKey !== lastSize) {
    renderer.setSize(width, height, false);
    lastSize = sizeKey;
    if (inspectionId && activeInspection) resetInspection();
  }
  renderer.setScissorTest(false);
  renderer.clear();
  cache.forEach(record => { record.pivot.visible = false; });
  if (inspectionId) {
    chapterNav.hidden = true;
    if (!activeInspection) return;
    const record = activeInspection;
    record.pivot.visible = true;
    if (playing) {
      if (record.mixer) record.mixer.update(delta);
      else record.pivot.rotation.y += delta * .3;
    }
    controls.update();
    renderer.setViewport(0, 0, width, height);
    renderer.render(scene, camera);
    return;
  }
  const measuredHeader = document.querySelector('.site-header')?.offsetHeight || 86;
  if (measuredHeader !== headerHeight) {
    headerHeight = measuredHeader;
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
  }
  const activeScreen = chooseScreen(chapters.map(chapter => {
    const rect = chapter.querySelector('.stage-inner').getBoundingClientRect();
    return { chapter, top: rect.top, bottom: rect.bottom };
  }), height, headerHeight);
  const currentChapter = activeScreen?.chapter;
  chapterNav.hidden = !currentChapter;
  chapterLinks.forEach(link => {
    if (link.dataset.chapterLink === currentChapter?.dataset.asset) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  // One stage, one visible GLB. The outgoing model fades before the next takes over.
  const activeSlot = currentChapter?.querySelector('.scene-slot');
  const focus = activeScreen ? (playback.secondaryMotion && height > 600 ? screenFocus(activeScreen.top, height, headerHeight) : 1) : 0;
  canvas.style.opacity = String(focus);
  chapters.forEach(chapter => {
    const stage = chapter.querySelector('.stage-inner');
    const rect = stage.getBoundingClientRect();
    stage.style.setProperty('--screen-focus', String(playback.secondaryMotion && height > 600 ? screenFocus(rect.top, height, headerHeight) : 1));
  });
  slots.forEach(slot => slot.classList.toggle('is-standby', slot !== activeSlot));
  const visible = activeSlot ? [{ slot: activeSlot, rect: activeSlot.getBoundingClientRect() }] : [];
  protectedIds = new Set(visible.map(({ slot }) => slot.dataset.scene));
  const rendered = new Set();
  renderer.setScissorTest(true);
  for (const { slot, rect } of visible) {
    const id = slot.dataset.scene;
    const record = cache.get(id);
    const state = slot.querySelector('.slot-state');
    if (!record) {
      slot.classList.remove('is-rendered');
      state.hidden = false;
      if (failures.has(id)) { state.textContent = 'Vista previa disponible'; slot.classList.add('has-error'); }
      else { state.textContent = 'Un momento…'; getModel(id); }
      continue;
    }
    record.used = now;
    const chapter = slot.closest('.story-step');
    const startOffset = chapter?.classList.contains('story-step--intro') ? 0 : headerHeight;
    const targetProgress = chapter ? chapterProgress(chapter.getBoundingClientRect().top, chapter.offsetHeight, height, startOffset) : 0;
    const nextChapter = chapters[chapters.indexOf(chapter) + 1];
    if (targetProgress > .55 && nextChapter && !navigator.connection?.saveData) getModel(nextChapter.dataset.asset);
    const progress = playback.sample(smoothedProgress.get(slot), targetProgress, delta);
    smoothedProgress.set(slot, progress);
    const angle = applyScrollPose(record, progress, playback.secondaryMotion);
    fit(record, rect.width, rect.height, record.asset.layout === 'wide');
    record.pivot.visible = true;
    const bottom = Math.max(0, height - rect.bottom);
    const top = Math.min(height - headerHeight, height - rect.top);
    renderer.setViewport(rect.left, height - rect.bottom, rect.width, rect.height);
    renderer.setScissor(Math.max(0, rect.left), bottom, Math.min(width, rect.right) - Math.max(0, rect.left), Math.max(0, top - bottom));
    renderer.render(scene, camera);
    record.pivot.visible = false;
    slot.classList.add('is-rendered');
    state.textContent = '';
    state.hidden = true;
    slot.dataset.angle = String(Math.round(angle * 180 / Math.PI));
    const bar = chapter?.querySelector('.slot-progress i');
    if (bar) bar.style.transform = `scaleX(${progress})`;
    rendered.add(slot);
  }
  slots.forEach(slot => { if (!rendered.has(slot)) slot.classList.remove('is-rendered'); });
  trimCache();
}
requestAnimationFrame(renderFrame);
