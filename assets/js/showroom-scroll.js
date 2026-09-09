import { clamp01, dampProgress, scrollAngle } from './showroom-math.js';

// Scroll is deliberate input, not an autoplay animation. Reduced motion removes
// inertia/tilt/fades, but must not disconnect that input from the 3D model.
// Pause is explicit and visit-local; old session flags cannot silently freeze it.
export function createScrollPlayback(reducedMotion = false) {
  let enabled = true;
  return {
    get enabled() { return enabled; },
    get secondaryMotion() { return enabled && !reducedMotion; },
    setEnabled(value) { enabled = Boolean(value); },
    setReducedMotion(value) { reducedMotion = Boolean(value); },
    sample(previous, target, deltaSeconds) {
      if (!enabled) return previous ?? 0;
      const next = clamp01(target);
      return reducedMotion || previous === undefined ? next : dampProgress(previous, next, deltaSeconds);
    },
  };
}

export function applyScrollPose(record, progress, secondaryMotion = true) {
  const angle = scrollAngle(progress);
  const { asset, pivot, mixer, duration } = record;
  // The globe contains its own spin clip: rotate that, not its matrix backdrop.
  pivot.rotation.set(asset.pitch, asset.yaw + (asset.scrub ? 0 : angle), 0);
  mixer?.setTime(clamp01(progress) * Math.max(duration - .001, 0));
  if (asset.id === 'logo') pivot.rotation.set(secondaryMotion ? Math.sin(angle) * .1 : 0, angle, 0);
  return angle;
}
