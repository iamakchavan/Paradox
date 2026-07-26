import type { Transition } from 'framer-motion';

export const MOTION_EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
export const MOTION_EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1];
export const MOTION_EASE_DRAWER: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

export const motionTransitions = {
  overlay: {
    duration: 0.2,
    ease: MOTION_EASE_OUT,
  } satisfies Transition,
  popover: {
    duration: 0.18,
    ease: MOTION_EASE_OUT,
  } satisfies Transition,
  content: {
    duration: 0.2,
    ease: MOTION_EASE_OUT,
  } satisfies Transition,
  contentSwap: {
    duration: 0.28,
    ease: MOTION_EASE_IN_OUT,
  } satisfies Transition,
  item: {
    type: 'spring',
    duration: 0.35,
    bounce: 0.15,
  } satisfies Transition,
  drawer: {
    type: 'tween',
    duration: 0.42,
    ease: MOTION_EASE_DRAWER,
  } satisfies Transition,
  mobileSheetEnter: {
    type: 'tween',
    duration: 0.32,
    ease: MOTION_EASE_OUT,
  } satisfies Transition,
  mobileSheetExit: {
    type: 'tween',
    duration: 0.24,
    ease: [0.4, 0, 1, 1],
  } satisfies Transition,
} as const;
