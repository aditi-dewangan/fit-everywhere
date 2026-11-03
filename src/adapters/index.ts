import type { ProductContext } from '../types';
import { defaultDescription, detectCut } from './common';
import type { BrandAdapter } from './types';

export type { BrandAdapter } from './types';

// Add one import per brand once the brands are chosen.
export const adapters: BrandAdapter[] = [];

export function findAdapter(hostname: string, list: readonly BrandAdapter[] = adapters): BrandAdapter | null {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return list.find((a) => a.hostnames.some((h) => host === h || host.endsWith(`.${h}`))) ?? null;
}

export function findAdapterForUrl(url: string, list: readonly BrandAdapter[] = adapters): BrandAdapter | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return findAdapter(parsed.hostname, list);
  } catch {
    return null;
  }
}

/** Reads the product on a page. Returns null if the page isn't a supported product page. */
export function extractProductContext(
  url: URL,
  doc: Document,
  list: readonly BrandAdapter[] = adapters,
): ProductContext | null {
  const adapter = findAdapter(url.hostname, list);
  if (!adapter || !adapter.isProductPage(url, doc)) return null;
  const productName = adapter.getProductName(doc);
  const description = adapter.getDescription ? adapter.getDescription(doc) : defaultDescription(doc);
  return {
    brandId: adapter.brandId,
    category: adapter.getCategory(url, doc),
    productName: productName ?? '',
    cut: detectCut(productName, description),
    url: url.href,
  };
}
