import type { Category, Cut, Dimension, PreferredFit } from '../types';

// Every tunable number the engine uses. These are starting values from the
// spec; adjust them here after user testing.

/** How much room (in inches) the user wants between body and garment. */
export const PREFERRED_GAP: Record<PreferredFit, number> = {
  fitted: -0.5,
  regular: 0,
  oversized: 2,
};

/** Extra room built into the garment's cut, so an oversized item isn't sized up again. */
export const CUT_EASE: Record<Cut, number> = {
  slim: -1,
  regular: 0,
  relaxed: 2,
  oversized: 4,
};

/** How much each body dimension matters per clothing type. Each row sums to 1. */
export const CATEGORY_WEIGHTS: Record<Category, Record<Dimension, number>> = {
  tops: { bust: 0.7, waist: 0.3, hips: 0 },
  dresses: { bust: 0.4, waist: 0.3, hips: 0.3 },
  jeans: { bust: 0, waist: 0.5, hips: 0.5 },
};

/** Too tight is worse than too loose: negative differences are multiplied by this. */
export const TIGHT_PENALTY_MULTIPLIER = 1.5;

/** A runner-up scoring within this much of the best size is returned as alternateSize. */
export const ALTERNATE_SIZE_THRESHOLD = 0.25;

/** Scores closer than this are treated as an exact tie (guards against float rounding). */
export const TIE_EPSILON = 1e-9;

/** Per-dimension notes, based on that dimension's gap. */
export const DIMENSION_NOTE_THRESHOLDS = {
  snugBelow: -0.5, // gap < -0.5 → "may feel snug"
  roomyAbove: 1, //   gap > 1   → "may feel roomy"; otherwise "fits well"
};

/** Fit label, based on the chosen size's weighted average gap. */
export const FIT_LABEL_THRESHOLDS = {
  smallBelow: -0.5, //          < -0.5     → small
  trueToSizeUpTo: 1, //         -0.5 to 1  → true to size
  slightlyOversizedUpTo: 3, //  1 to 3     → slightly oversized; above → oversized
};
