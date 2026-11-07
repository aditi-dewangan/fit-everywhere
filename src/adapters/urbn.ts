import { categoryFromCrumbsAndName, defaultProductName, jsonLdBreadcrumbs } from './common';
import type { BrandAdapter } from './types';

// URBN brands share one site platform: /shop/<slug>, with JSON-LD breadcrumbs
// that end in the product's own name. Each brand publishes its own size chart.
const PRODUCT_PATH = /^\/shop\/[^/]+\/?$/;
const OTHER_DEPARTMENT = /^(men|kids|girls|boys|baby|home)\b/i;

function urbnAdapter(brandId: string, hostname: string): BrandAdapter {
  return {
    brandId,
    hostnames: [hostname],
    isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
    getProductName: defaultProductName,
    getCategory(_url, doc) {
      // Only women's sizing is supported; other departments fall through to "choose clothing type".
      if (OTHER_DEPARTMENT.test(jsonLdBreadcrumbs(doc)[0]?.trim() ?? '')) return null;
      return categoryFromCrumbsAndName(doc);
    },
  };
}

export const urbanOutfitters = urbnAdapter('urban-outfitters', 'urbanoutfitters.com');
export const freePeople = urbnAdapter('free-people', 'freepeople.com');
export const anthropologie = urbnAdapter('anthropologie', 'anthropologie.com');
