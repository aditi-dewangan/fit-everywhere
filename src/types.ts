// Shared data model from the technical spec. All measurements are in inches.

export type Category = 'tops' | 'dresses' | 'jeans';
export type Dimension = 'bust' | 'waist' | 'hips';
export type PreferredFit = 'fitted' | 'regular' | 'oversized';
export type Cut = 'slim' | 'regular' | 'relaxed' | 'oversized';
export type FitLabel = 'small' | 'true_to_size' | 'slightly_oversized' | 'oversized';

export const CATEGORIES: readonly Category[] = ['tops', 'dresses', 'jeans'];
export const DIMENSIONS: readonly Dimension[] = ['bust', 'waist', 'hips'];
export const PREFERRED_FITS: readonly PreferredFit[] = ['fitted', 'regular', 'oversized'];
export const CUTS: readonly Cut[] = ['slim', 'regular', 'relaxed', 'oversized'];

export interface Measurements {
  bust?: number;
  waist?: number;
  hips?: number;
  height?: number;
}

export interface OwnedItem {
  brandId: string;
  category: Category;
  productName?: string; // e.g. "501 jeans"
  size: string; // e.g. "27"
}

export interface FitProfile {
  measurements?: Measurements;
  ownedItem?: OwnedItem;
  preferredFit: PreferredFit;
  updatedAt: string; // ISO date
}

export interface Range {
  min: number;
  max: number;
}

export interface SizeRow {
  size: string; // e.g. "M" or "27"
  bust?: Range;
  waist?: Range;
  hips?: Range;
  height?: Range;
}

export interface BrandSizeChart {
  brandId: string;
  brandName: string;
  sourceUrl: string; // page the chart was copied from
  collectedOn: string; // ISO date
  charts: Partial<Record<Category, SizeRow[]>>;
  isSample?: boolean; // true only for made-up test data
  notes?: string; // exceptions, e.g. product lines that size differently
}

export interface ProductContext {
  brandId: string;
  category: Category | null;
  productName: string;
  cut: Cut;
  url: string;
}

export interface RecommendationResult {
  recommendedSize: string;
  fitLabel: FitLabel;
  explanation: string;
  dimensionNotes: Partial<Record<Dimension | 'length', string>>;
  alternateSize?: string; // set when the user is between sizes
  profileSource: 'measurements' | 'owned_item';
}

export type RecommendError =
  | 'NO_PROFILE'
  | 'INCOMPLETE_PROFILE'
  | 'UNSUPPORTED_SITE'
  | 'UNKNOWN_CATEGORY'
  | 'UNSUPPORTED_CATEGORY'
  | 'NO_USABLE_MEASUREMENTS'
  | 'OWNED_ITEM_NOT_FOUND';

export type RecommendResponse =
  | { ok: true; result: RecommendationResult }
  | { ok: false; error: RecommendError };
