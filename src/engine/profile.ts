import { DIMENSIONS, PREFERRED_FITS } from '../types';
import type { FitProfile, Measurements } from '../types';

export function isUsableNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** True when at least one of bust, waist, or hips is entered. */
export function hasBodyMeasurements(m: Measurements | undefined): boolean {
  return !!m && DIMENSIONS.some((d) => isUsableNumber(m[d]));
}

/**
 * A profile needs a preferred fit, plus either at least one of bust, waist, or
 * hips, or an owned item. Pass supportedBrandIds to also require the owned
 * item to be from a supported brand (the profile form does this).
 */
export function isProfileComplete(profile: FitProfile, supportedBrandIds?: readonly string[]): boolean {
  if (!PREFERRED_FITS.includes(profile.preferredFit)) return false;
  if (hasBodyMeasurements(profile.measurements)) return true;
  const item = profile.ownedItem;
  if (!item || !item.brandId || !item.category || !item.size) return false;
  return !supportedBrandIds || supportedBrandIds.includes(item.brandId);
}
