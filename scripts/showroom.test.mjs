import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { PerspectiveCamera, Vector3, Euler, Group, AnimationMixer, AnimationClip, NumberKeyframeTrack } from 'three';
import { ASSETS, STORY_IDS, SOURCE_DIRECTORY, assetUrl, assetById } from '../assets/js/showroom-catalog.js';
import { chapterProgress, scrollAngle, dampProgress, fitDistance, chooseScreen, screenFocus, fitRotatedDistance } from '../assets/js/showroom-math.js';
import { createScrollPlayback, applyScrollPose } from '../assets/js/showroom-scroll.js';
import { inspectGlb } from './inventory-glb.mjs';

const root = resolve(import.meta.dirname, '..');
const digest = path => createHash('sha256').update(readFileSync(path)).digest('hex');

test('only the three selected files are active and shipped', () => {
  assert.deepEqual(ASSETS.map(a => a.source).sort(), ['binary_globe_astra_v03.glb', 'devsmanager_atelier_v07.glb', 'devsmanager_logo_premium_v03.glb']);
  assert.deepEqual(STORY_IDS, ['logo', 'globe', 'atelier']);
  assert.equal(new Set(ASSETS.map(a => a.id)).size, 3);
  for (const directory of ['public/models', 'dist/models']) {
    assert.deepEqual(readdirSync(resolve(root, directory)).filter(n => n.endsWith('.glb')).sort(), ASSETS.map(a => a.file).sort());
  }
  for (const asset of ASSETS) {
    const input = resolve(SOURCE_DIRECTORY, asset.source);
    const model = resolve(root, 'public/models', asset.file);
    assert.equal(digest(input), digest(model));
    assert.equal(digest(model), digest(resolve(root, 'dist/models', asset.file)));
    assert.ok(existsSync(resolve(root, 'public/posters', asset.poster)));
    assert.ok(inspectGlb(model).triangles > 0);
    assert.equal(assetById(asset.id), asset);
    assert.equal(assetUrl(asset), `/models/${asset.file}`);
  }
});

test('logo is front-facing in its existing Y-up coordinates, not tipped onto its edge', () => {
  assert.deepEqual(assetById('logo').orientation, [0, 0, 0]);
  const { size } = inspectGlb(resolve(root, 'public/models/logo.glb'));
  assert.ok(size[1] > size[2] * 3);
  assert.ok(size[0] > size[1] * 2);
});

test('scroll covers 0–360 degrees and reverses when the visitor scrolls up', () => {
  const heights = [667, 844, 1080];
  for (const viewport of heights) {
    const chapterHeight = viewport * 1.9;
    const endTop = viewport - chapterHeight;
    assert.equal(chapterProgress(90, chapterHeight, viewport), 0);
    assert.equal(chapterProgress(endTop, chapterHeight, viewport), 1);
    const progress = [90, 0, endTop / 2, endTop].map(top => chapterProgress(top, chapterHeight, viewport));
    for (let i = 1; i < progress.length; i++) assert.ok(progress[i] >= progress[i - 1]);
  }
  assert.equal(scrollAngle(0), 0);
  assert.equal(scrollAngle(1), Math.PI * 2);
  assert.ok(scrollAngle(.7) > scrollAngle(.3));
  assert.equal(scrollAngle(-1), 0);
  assert.equal(scrollAngle(2), Math.PI * 2);
});

test('scroll works immediately with either system motion preference, without activation', () => {
  for (const reduced of [false, true]) {
    const playback = createScrollPlayback(reduced);
    assert.equal(playback.enabled, true);
    assert.equal(playback.secondaryMotion, !reduced);
    let progress = playback.sample(undefined, 0, 1 / 60);
    const afterDown = playback.sample(progress, .4, 1 / 60);
    assert.ok(afterDown > progress, 'first scroll must change the pose');
    progress = playback.sample(afterDown, 0, 1 / 60);
    assert.ok(progress < afterDown, 'scrolling back must reverse the pose');
    playback.setReducedMotion(!reduced);
    assert.equal(playback.enabled, true, 'OS preference changes must not pause deliberate scroll input');
    assert.ok(playback.sample(progress, .8, 1 / 60) > progress);
  }
});

test('reduced motion tracks scroll exactly, without inertia or secondary motion', () => {
  const playback = createScrollPlayback(true);
  for (const target of [0, .05, .3, .8, 1, .4, 0]) {
    const progress = playback.sample(.1, target, 0);
    assert.equal(progress, target);
    assert.equal(scrollAngle(progress), target * Math.PI * 2);
  }
  assert.equal(playback.secondaryMotion, false);
});

test('explicit pause holds the current pose, respects navigation and can resume', () => {
  const playback = createScrollPlayback(true);
  const before = playback.sample(undefined, .4, 1 / 60);
  playback.setEnabled(false);
  assert.equal(playback.sample(before, .9, 1 / 60), before);
  assert.equal(playback.sample(undefined, .6, 1 / 60), 0, 'new stage starts at rest when paused');
  playback.setReducedMotion(false);
  assert.equal(playback.enabled, false);
  assert.equal(playback.sample(before, .1, 1 / 60), before);
  playback.setEnabled(true);
  assert.ok(playback.sample(before, .9, 1 / 60) > before);
  assert.equal(createScrollPlayback(true).enabled, true, 'a new visit must not inherit a stale pause');
});

test('scroll poses rotate all three models and scrub real Three.js animation mixers', () => {
  for (const asset of ASSETS) {
    const pivot = new Group(), animated = new Group();
    animated.name = 'animatedPart';
    pivot.add(animated);
    const mixer = new AnimationMixer(animated);
    mixer.clipAction(new AnimationClip('scroll', 10, [new NumberKeyframeTrack('.rotation[y]', [0, 10], [0, Math.PI * 2])])).play();
    const record = { asset, pivot, mixer, duration: 10 };
    const playback = createScrollPlayback(true);
    for (const target of [0, .25, .65, 1, .2, 0]) {
      const progress = playback.sample(undefined, target, 1 / 60);
      const angle = applyScrollPose(record, progress, playback.secondaryMotion);
      assert.equal(angle, target * Math.PI * 2);
      assert.equal(pivot.rotation.y, asset.yaw + (asset.scrub ? 0 : angle));
      assert.ok(Math.abs(animated.rotation.y - progress * 9.999 / 10 * Math.PI * 2) < 1e-6);
      if (asset.id === 'logo') assert.equal(pivot.rotation.x, 0, 'no secondary tilt in reduced motion');
    }
  }
});

test('runtime uses scroll playback and the document remains the sticky scroll container', () => {
  const source = readFileSync(resolve(root, 'assets/js/scene3d.js'), 'utf8');
  assert.ok(source.includes('createScrollPlayback(motion.matches)'));
  assert.ok(source.includes('playback.sample(smoothedProgress.get(slot), targetProgress, delta)'));
  assert.ok(source.includes('applyScrollPose(record, progress, playback.secondaryMotion)'));
  assert.ok(!source.includes('sessionStorage'), 'legacy stored false must not disable the scroll');
  assert.ok(!source.includes('let motionEnabled = !motion.matches'));
  const css = readFileSync(resolve(root, 'assets/css/home.css'), 'utf8');
  const bodyRule = css.match(/body\.immersive-home\s*\{([^}]+)\}/)[1];
  assert.match(bodyRule, /overflow-x:\s*clip/);
  assert.match(bodyRule, /overflow-y:\s*visible/);
  assert.match(css, /body\.is-inspecting\s*\{\s*overflow:hidden/);
});

test('smoothing is frame-rate independent, bounded and reversible', () => {
  let fine = 0, coarse = 0;
  for (let i = 0; i < 60; i++) fine = dampProgress(fine, 1, 1 / 60);
  for (let i = 0; i < 30; i++) coarse = dampProgress(coarse, 1, 1 / 30);
  assert.ok(Math.abs(fine - coarse) < 1e-10);
  assert.ok(fine > .99 && fine <= 1);
  const reversed = dampProgress(fine, 0, .016);
  assert.ok(reversed < fine && reversed > 0);
  assert.equal(dampProgress(.5, 1, 0), .5);
});

test('orbit fit keeps normalized bounds inside desktop and narrow viewports', () => {
  for (const aspect of [.55, .85, 1.4, 2.4]) {
    for (const size of [[2.4, .7, .18], [2.1, 2.4, 2.1], [1, 2.4, .5]]) {
      const camera = new PerspectiveCamera(38, aspect, .01, 100);
      camera.position.set(0, 0, fitDistance(size, aspect));
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      for (let angle = 0; angle <= 360; angle += 15) {
        for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
          const point = new Vector3(x * size[0] / 2, y * size[1] / 2, z * size[2] / 2);
          point.applyEuler(new Euler(.1, angle * Math.PI / 180, 0)).project(camera);
          assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1, `Out of frame: ${aspect}, ${angle}`);
          assert.ok(point.z > -1 && point.z < 1);
        }
      }
    }
  }
});

test('front logo fit is legible without cropping', () => {
  const size = [2.4, .701, .18];
  for (const aspect of [.8, 1.5, 2.8]) {
    const camera = new PerspectiveCamera(38, aspect, .01, 100);
    camera.position.z = fitRotatedDistance(size, aspect, [0, 0, 0]);
    camera.updateMatrixWorld();
    const corner = new Vector3(size[0]/2, size[1]/2, size[2]/2).project(camera);
    assert.ok(corner.x > .5 && corner.x < 1);
    assert.ok(corner.y > 0 && corner.y < 1);
  }
});

test('static entry points have no obsolete model requests or duplicate IDs', () => {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const match of html.matchAll(/data-(?:scene|inspect)="([^"]+)"/g)) assert.ok(assetById(match[1]));
  assert.ok(!html.includes('12 DISEÑOS'));
  for (const page of ['index', 'servicios', 'proceso', 'sobre-mi', 'contacto']) assert.ok(existsSync(resolve(root, `dist/${page}.html`)));
});

test('exactly one static fullscreen stage per authorized model; no repeated hero/gallery viewport', () => {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const slots = [...html.matchAll(/data-scene="([^"]+)"/g)].map(m => m[1]);
  const stages = [...html.matchAll(/class="story-step(?: story-step--intro)?"/g)];
  assert.deepEqual(slots, ['logo', 'globe', 'atelier']);
  assert.equal(stages.length, 3);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.ok(!html.includes('class="home-hero"'));
  assert.ok(!html.includes('id="library-slot"'));
  assert.equal(chapterProgress(0, 1900, 1000, 0), 0, 'initial logo must remain front-facing');
});

test('only one screen is selected throughout all three screen transitions', () => {
  for (const viewport of [667, 844, 1080]) {
    const header = 86, stageHeight = viewport - header, chapterHeight = viewport * 1.9;
    const seen = new Set();
    for (let scroll = 0; scroll < chapterHeight * 3; scroll += 20) {
      const screens = ASSETS.map((asset, index) => {
        const sectionTop = chapterHeight * index - scroll;
        const top = Math.min(Math.max(header, sectionTop), sectionTop + chapterHeight - stageHeight);
        return { id: asset.id, top, bottom: top + stageHeight };
      });
      const chosen = chooseScreen(screens, viewport, header);
      if (chosen) {
        assert.ok(!Array.isArray(chosen));
        seen.add(chosen.id);
        const focus = screenFocus(chosen.top, viewport, header);
        assert.ok(focus >= 0 && focus <= 1);
      }
    }
    assert.deepEqual([...seen], ['logo', 'globe', 'atelier']);
    assert.equal(screenFocus(header, viewport, header), 1);
    assert.equal(screenFocus(header - stageHeight / 2, viewport, header), 0);
    assert.equal(chooseScreen([{ top: viewport + 1, bottom: viewport * 2 }], viewport), null);
  }
});

test('adaptive logo camera fits every turn, including the edge and back views', () => {
  const size = [2.4, .701, .18];
  for (const aspect of [.55, 1, 2.4, 4]) for (let deg = 0; deg <= 360; deg += 10) {
    const rotation = [.1 * Math.sin(deg * Math.PI / 180), deg * Math.PI / 180, 0];
    const camera = new PerspectiveCamera(38, aspect, .01, 100);
    camera.position.z = fitRotatedDistance(size, aspect, rotation);
    camera.updateMatrixWorld();
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
      const point = new Vector3(x * size[0]/2, y * size[1]/2, z * size[2]/2).applyEuler(new Euler(...rotation)).project(camera);
      assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1 && point.z < 1 && point.z > -1);
    }
  }
});

test('customer-facing homepage copy sells benefits, without technical labels or angle counters', () => {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const text = [html, ...['header', 'footer'].map(name => readFileSync(resolve(root, `partials/${name}.html`), 'utf8'))]
    .join(' ').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, ' ');
  const jargon = /\bscroll\b|\b3d\b|360°|\bwebgl\b|configurador|automatizaci[oó]n|agentes de ia|\btecnolog[ií]a\b/i;
  assert.doesNotMatch(text, jargon);
  assert.ok(!html.includes('slot-angle'));
  assert.ok(!html.includes('slot-caption'));
  assert.equal((html.match(/>Ver de cerca ↗<\/button>/g) || []).length, 3);
  for (const heading of ['Imposible de ignorar.', 'Llega más lejos.', 'Le damos vida.', 'Una web que enamora', 'Clientes bien atendidos', 'Más tiempo para crecer']) assert.ok(text.includes(heading));
  for (const asset of ASSETS) assert.doesNotMatch(`${asset.label} ${asset.description}`, jargon);
  for (const file of ['home', 'scene3d']) {
    const source = readFileSync(resolve(root, `assets/js/${file}.js`), 'utf8');
    const uiAssignments = [...source.matchAll(/(?:textContent|innerHTML|title)\s*=\s*([^;]+);/g)].map(match => match[1]).join(' ');
    assert.doesNotMatch(uiAssignments, jargon, `${file}: runtime must not restore technical copy`);
  }
  const source = readFileSync(resolve(root, 'assets/js/scene3d.js'), 'utf8');
  assert.ok(source.includes('state.hidden = true;'), 'loading label disappears after rendering');
  assert.ok(!source.includes("querySelectorAll('.stage-hint')"), 'pause must not replace customer copy');
  assert.ok(source.includes('slot.dataset.angle'), 'rotation diagnostics stay internal');
});
