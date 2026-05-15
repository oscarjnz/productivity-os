/**
 * Motion tokens — mirror globals.css CSS vars in TS for Framer Motion / inline use.
 * Edit one, edit the other. CSS is the source for static styles; TS for animations.
 */

export const duration = {
  instant: 0.08,
  fast: 0.14,
  base: 0.2,
  slow: 0.32,
  layout: 0.42,
} as const;

export const easing = {
  standard: [0.2, 0, 0, 1],
  decelerate: [0, 0, 0, 1],
  accelerate: [0.4, 0, 1, 1],
  overshoot: [0.34, 1.56, 0.64, 1],
} as const;

export const transitions = {
  default: { duration: duration.base, ease: easing.standard },
  fast: { duration: duration.fast, ease: easing.standard },
  slow: { duration: duration.slow, ease: easing.standard },
  spring: { type: "spring" as const, stiffness: 420, damping: 38, mass: 0.6 },
  press: { duration: duration.instant, ease: easing.standard },
} as const;

export const fadeUp = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
  transition: transitions.default,
} as const;
