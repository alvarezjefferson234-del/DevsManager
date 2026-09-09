import { Euler, Vector3 } from 'three';
export const clamp01 = n => Math.max(0, Math.min(1, n));
export function chooseScreen(screens, viewportHeight, header = 86) {
  return screens.filter(screen => screen.bottom > header && screen.top < viewportHeight)
    .reduce((best, screen) => !best || Math.abs(screen.top - header) < Math.abs(best.top - header) ? screen : best, null);
}
export function screenFocus(top, viewportHeight, header = 86) {
  const t = clamp01(Math.abs(top - header) / Math.max((viewportHeight - header) * .5, 1));
  return 1 - t * t * (3 - 2 * t);
}
export function chapterProgress(top, height, viewportHeight, header = 90) {
  return clamp01((header - top) / Math.max(height - viewportHeight + header, 1));
}
export function scrollAngle(progress) {
  return clamp01(progress) * Math.PI * 2;
}
export function dampProgress(current, target, deltaSeconds) {
  return current + (target - current) * (1 - Math.exp(-Math.max(0, deltaSeconds) * 10));
}
// A sphere fit remains safe during orbiting, unlike a single-axis width fit.
export function fitDistance(size, aspect, fov = 38, wide = false) {
  const vertical = fov * Math.PI / 360;
  const horizontal = Math.atan(Math.tan(vertical) * Math.max(aspect, 0.1));
  if (wide) return Math.max(size[0] / (2 * Math.tan(horizontal)), size[1] / (2 * Math.tan(vertical))) * 1.18 + size[2];
  const radius = Math.hypot(...size) / 2;
  return radius / Math.sin(Math.min(vertical, horizontal)) * 1.08;
}
// Exact corner fit for the flat logo as it turns; no edge-on clipping or tiny front view.
export function fitRotatedDistance(size, aspect, rotation, fov = 38) {
  const tanV = Math.tan(fov * Math.PI / 360), tanH = tanV * Math.max(.1, aspect);
  const euler = new Euler(...rotation);
  let distance = 0;
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    const p = new Vector3(x * size[0] / 2, y * size[1] / 2, z * size[2] / 2).applyEuler(euler);
    distance = Math.max(distance, p.z + Math.abs(p.x) / tanH, p.z + Math.abs(p.y) / tanV);
  }
  return distance * 1.16 + .08;
}
