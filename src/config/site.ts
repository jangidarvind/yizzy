/**
 * Site-level placeholders that need real values before launch.
 *
 * These are deliberately named as placeholders so they can't be mistaken for
 * verified figures. Swap them for the real numbers when available.
 */

/** Hero counter target. PLACEHOLDER — replace with the live onboarded-driver count. */
export const DRIVER_COUNT_PLACEHOLDER = 1_200;

/** Words cycled inside the hero headline — the three vehicle categories Yizzy serves. */
export const HERO_CYCLE_WORDS = ['Bike', 'Auto', 'Cab'] as const;

/** Shown instead of the cycle when the visitor prefers reduced motion. */
export const HERO_STATIC_WORD = 'Gig';

/** Milliseconds each cycled word stays on screen. */
export const HERO_CYCLE_MS = 2_000;
