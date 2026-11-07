import type { ProductContext } from '../types';
import { abercrombie } from './abercrombie';
import { annTaylor, loft } from './ann-inc';
import { aritzia } from './aritzia';
import { americanEagle } from './american-eagle';
import { defaultDescription, detectCut } from './common';
import { express } from './express';
import { forever21 } from './forever-21';
import { garage } from './garage';
import { athleta, bananaRepublic, gap, oldNavy } from './gap';
import { hm } from './hm';
import { hollister } from './hollister';
import { pacsun } from './pacsun';
import { ralphLauren } from './ralph-lauren';
import { edikted, fashionNova, princessPolly } from './shopify';
import { stussy } from './stussy';
import type { BrandAdapter } from './types';
import { uniqlo } from './uniqlo';
import { anthropologie, freePeople, urbanOutfitters } from './urbn';

export type { BrandAdapter } from './types';

// One adapter per supported brand. Each needs a chart in src/data/charts and fixtures in fixtures/<brandId>/.
export const adapters: BrandAdapter[] = [hm, pacsun, hollister, abercrombie, americanEagle, gap, oldNavy, bananaRepublic, athleta, ralphLauren, stussy, urbanOutfitters, freePeople, anthropologie, annTaylor, loft, aritzia, uniqlo, express, forever21, garage, edikted, fashionNova, princessPolly];

export function findAdapter(hostname: string, list: readonly BrandAdapter[] = adapters): BrandAdapter | null {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return list.find((a) => a.hostnames.some((h) => host === h || (!a.exactHostnames && host.endsWith(`.${h}`)))) ?? null;
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
    brandId: adapter.getBrandId?.(url) ?? adapter.brandId,
    category: adapter.getCategory(url, doc),
    productName: productName ?? '',
    cut: detectCut(productName, description),
    url: url.href,
  };
}
