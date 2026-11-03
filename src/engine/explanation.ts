import { DIMENSIONS } from '../types';
import type { Dimension, FitLabel, RecommendationResult } from '../types';
import { DIMENSION_NOTE_THRESHOLDS } from './config';

// Explanation text is built from fixed templates (no LLM). Wording always
// describes how the garment fits, never the user's body.

export const NOTE_SNUG = 'may feel snug';
export const NOTE_FITS = 'fits well';
export const NOTE_ROOMY = 'may feel roomy';
export const NOTE_LENGTH_SHORT = 'may run short';
export const NOTE_LENGTH_LONG = 'may run long';

export const FIT_LABEL_TEXT: Record<FitLabel, string> = {
  small: 'small',
  true_to_size: 'true to size',
  slightly_oversized: 'slightly oversized',
  oversized: 'oversized',
};

export function dimensionNote(gap: number): string {
  if (gap < DIMENSION_NOTE_THRESHOLDS.snugBelow) return NOTE_SNUG;
  if (gap > DIMENSION_NOTE_THRESHOLDS.roomyAbove) return NOTE_ROOMY;
  return NOTE_FITS;
}

/** Returns a length note only when the chart has a height range for the size. */
export function lengthNote(height: number | undefined, range: { min: number; max: number } | undefined): string | undefined {
  if (height === undefined || !range) return undefined;
  if (height > range.max) return NOTE_LENGTH_SHORT;
  if (height < range.min) return NOTE_LENGTH_LONG;
  return undefined;
}

export interface ExplanationInput {
  dimensionNotes: RecommendationResult['dimensionNotes'];
  alternateSize?: string;
  alternateIsLarger?: boolean;
  /** Set when the profile came from an owned item, e.g. "Levi's size 27". */
  ownedItemLabel?: string;
}

export function buildExplanation(input: ExplanationInput): string {
  const sentences: string[] = [];

  const fitsWell: Dimension[] = [];
  const concerns: string[] = [];
  for (const dim of DIMENSIONS) {
    const note = input.dimensionNotes[dim];
    if (!note) continue;
    if (note === NOTE_FITS) fitsWell.push(dim);
    else concerns.push(`${dim} ${note}`);
  }
  if (input.dimensionNotes.length) concerns.push(`length ${input.dimensionNotes.length}`);

  const fitsWellText = fitsWell.length ? `${joinList(fitsWell)} ${fitsWell.length === 1 ? 'fits' : 'fit'} well` : '';
  const concernsText = joinList(concerns);
  if (fitsWellText && concernsText) sentences.push(`${fitsWellText}, but ${concernsText}.`);
  else if (fitsWellText || concernsText) sentences.push(`${fitsWellText || concernsText}.`);

  if (input.alternateSize) {
    const why = input.alternateIsLarger ? 'if you want more room' : 'if you want a closer fit';
    sentences.push(`${input.alternateSize} is also a close match ${why}.`);
  }

  if (input.ownedItemLabel) {
    sentences.push(`Based on your ${input.ownedItemLabel}. Adding your measurements gives a more accurate result.`);
  }

  return sentences.map(capitalize).join(' ');
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
