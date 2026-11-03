import type { Category } from '../types';

/** One per supported brand, so a site change only affects that brand's file. */
export interface BrandAdapter {
  brandId: string;
  hostnames: string[];
  isProductPage(url: URL, doc: Document): boolean;
  getProductName(doc: Document): string | null;
  getCategory(url: URL, doc: Document): Category | null;
  /** Optional: text searched for cut words. Defaults to JSON-LD or meta description. */
  getDescription?(doc: Document): string | null;
}
