import { DIMENSIONS } from '../types';
import type {
  BrandSizeChart,
  Dimension,
  FitLabel,
  FitProfile,
  Measurements,
  ProductContext,
  Range,
  RecommendError,
  RecommendResponse,
  RecommendationResult,
  SizeRow,
} from '../types';
import {
  ALTERNATE_SIZE_THRESHOLD,
  CATEGORY_WEIGHTS,
  CUT_EASE,
  FIT_LABEL_THRESHOLDS,
  PREFERRED_GAP,
  TIE_EPSILON,
  TIGHT_PENALTY_MULTIPLIER,
} from './config';
import { buildExplanation, dimensionNote, lengthNote } from './explanation';
import { hasBodyMeasurements, isProfileComplete, isUsableNumber } from './profile';

// Pure scoring logic. No browser APIs in this folder, so it runs under plain
// unit tests.

export interface RecommendInput {
  profile: FitProfile | null;
  product: ProductContext | null;
  chart: BrandSizeChart | null;
  /** The owned item's brand chart, needed only when it differs from the product's brand. */
  ownedItemChart?: BrandSizeChart | null;
}

export interface SizeScore {
  size: string;
  index: number;
  score: number;
  averageGap: number;
  gaps: Partial<Record<Dimension, number>>;
}

export function recommend(input: RecommendInput): RecommendResponse {
  const { profile, product, chart } = input;
  if (!profile) return fail('NO_PROFILE');
  if (!isProfileComplete(profile)) return fail('INCOMPLETE_PROFILE');
  if (!product || !chart || chart.brandId !== product.brandId) return fail('UNSUPPORTED_SITE');
  if (!product.category) return fail('UNKNOWN_CATEGORY');
  const rows = chart.charts[product.category];
  if (!rows?.length) return fail('UNSUPPORTED_CATEGORY');

  // 1. Get the user's measurements.
  const body = resolveMeasurements(profile, chart, input.ownedItemChart ?? null);
  if (!body.ok) return body;

  // 2–5. Score every size.
  const scores = scoreSizes(rows, body.measurements, product, profile);
  if (!scores.length) return fail('NO_USABLE_MEASUREMENTS');

  // 6. Pick the lowest score.
  const ranked = rankScores(scores, profile.preferredFit === 'fitted');
  const best = ranked[0]!;
  const runnerUp = ranked[1];
  const alternate =
    runnerUp && runnerUp.score - best.score <= ALTERNATE_SIZE_THRESHOLD + TIE_EPSILON ? runnerUp : undefined;

  // 7. Fit label from the chosen size's weighted average gap.
  const fitLabel = fitLabelFor(best.averageGap);

  // 8. Explanation from the per-dimension notes.
  const bestRow = rows[best.index]!;
  const dimensionNotes: RecommendationResult['dimensionNotes'] = {};
  for (const dim of DIMENSIONS) {
    const gap = best.gaps[dim];
    if (gap !== undefined) dimensionNotes[dim] = dimensionNote(gap);
  }
  const length = lengthNote(body.measurements.height, bestRow.height);
  if (length) dimensionNotes.length = length;

  const result: RecommendationResult = {
    recommendedSize: best.size,
    fitLabel,
    explanation: buildExplanation({
      dimensionNotes,
      alternateSize: alternate?.size,
      alternateIsLarger: alternate ? alternate.index > best.index : undefined,
      ownedItemLabel: body.ownedItemLabel,
    }),
    dimensionNotes,
    profileSource: body.source,
  };
  if (alternate) result.alternateSize = alternate.size;
  return { ok: true, result };
}

type ResolvedMeasurements =
  | { ok: true; measurements: Measurements; source: RecommendationResult['profileSource']; ownedItemLabel?: string }
  | { ok: false; error: RecommendError };

/**
 * Entered measurements win. Otherwise use the midpoint of each range for the
 * owned item's size. The owned item is treated as a regular fit.
 */
function resolveMeasurements(
  profile: FitProfile,
  productChart: BrandSizeChart,
  ownedItemChart: BrandSizeChart | null,
): ResolvedMeasurements {
  if (hasBodyMeasurements(profile.measurements)) {
    return { ok: true, measurements: profile.measurements!, source: 'measurements' };
  }
  const item = profile.ownedItem!;
  const chart = item.brandId === productChart.brandId ? productChart : ownedItemChart;
  if (!chart || chart.brandId !== item.brandId) return fail('OWNED_ITEM_NOT_FOUND');
  const wanted = normalizeSize(item.size);
  const row = chart.charts[item.category]?.find((r) => normalizeSize(r.size) === wanted);
  if (!row) return fail('OWNED_ITEM_NOT_FOUND');

  const measurements: Measurements = {};
  for (const dim of DIMENSIONS) {
    const range = row[dim];
    if (range) measurements[dim] = midpoint(range);
  }
  const height = profile.measurements?.height;
  if (isUsableNumber(height)) measurements.height = height;

  const itemName = item.productName?.trim() ? `${item.productName.trim()}, ` : '';
  return {
    ok: true,
    measurements,
    source: 'owned_item',
    ownedItemLabel: `${chart.brandName} ${itemName}size ${row.size}`,
  };
}

export function scoreSizes(
  rows: SizeRow[],
  measurements: Measurements,
  product: ProductContext,
  profile: FitProfile,
): SizeScore[] {
  const weights = CATEGORY_WEIGHTS[product.category!];
  const ease = CUT_EASE[product.cut] ?? 0;
  const preferredGap = PREFERRED_GAP[profile.preferredFit];

  const scores: SizeScore[] = [];
  rows.forEach((row, index) => {
    // Only dimensions with weight, chart data, and a user measurement count.
    const used = DIMENSIONS.filter((d) => weights[d] > 0 && row[d] && isUsableNumber(measurements[d]));
    if (!used.length) return;
    const totalWeight = used.reduce((sum, d) => sum + weights[d], 0);

    let score = 0;
    let averageGap = 0;
    const gaps: SizeScore['gaps'] = {};
    for (const dim of used) {
      const weight = weights[dim] / totalWeight;
      const gap = midpoint(row[dim]!) + ease - measurements[dim]!;
      const difference = gap - preferredGap;
      const penalty = difference < 0 ? -difference * TIGHT_PENALTY_MULTIPLIER : difference;
      score += weight * penalty;
      averageGap += weight * gap;
      gaps[dim] = gap;
    }
    scores.push({ size: row.size, index, score, averageGap, gaps });
  });
  return scores;
}

/** Lowest score first. Exact ties go to the larger size, or the smaller one for a fitted preference. */
export function rankScores(scores: SizeScore[], preferSmallerOnTie: boolean): SizeScore[] {
  return [...scores].sort((a, b) => {
    const diff = a.score - b.score;
    if (Math.abs(diff) > TIE_EPSILON) return diff;
    return preferSmallerOnTie ? a.index - b.index : b.index - a.index;
  });
}

export function fitLabelFor(averageGap: number): FitLabel {
  if (averageGap < FIT_LABEL_THRESHOLDS.smallBelow) return 'small';
  if (averageGap <= FIT_LABEL_THRESHOLDS.trueToSizeUpTo) return 'true_to_size';
  if (averageGap <= FIT_LABEL_THRESHOLDS.slightlyOversizedUpTo) return 'slightly_oversized';
  return 'oversized';
}

const midpoint = (r: Range) => (r.min + r.max) / 2;
const normalizeSize = (s: string) => s.trim().toLowerCase();
const fail = (error: RecommendError) => ({ ok: false, error }) as const;
