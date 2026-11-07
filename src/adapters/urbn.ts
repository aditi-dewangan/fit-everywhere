import { categoryFromText, defaultProductName, jsonLdBreadcrumbs } from './common';
import type { BrandAdapter } from './types';

// URBN brands share one site platform: /shop/<slug>, with JSON-LD breadcrumbs
// that end in the product's own name. Each brand publishes its own size chart.
const PRODUCT_PATH = /^\/shop\/[^/]+\/?$/;
const OTHER_DEPARTMENT = /^(men|kids|girls|boys|baby|home)\b/i;
// Sold in these departments but not covered by any chart, and easily misread ("jean jacket").
// "shorts" stays plural so a "Short Sleeve Tee" still counts as a top.
const NOT_CHARTED = /\b(jackets?|coats?|shorts|skirts?|skorts?|pants?)\b/i;

function urbnAdapter(brandId: string, hostname: string): BrandAdapter {
  return {
    brandId,
    hostnames: [hostname],
    isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
    getProductName: defaultProductName,
    getCategory(_url, doc) {
      const name = defaultProductName(doc);
      const crumbs = jsonLdBreadcrumbs(doc).filter((crumb) => crumb.trim() !== name);
      // Only women's sizing is supported; other departments fall through to "choose clothing type".
      if (OTHER_DEPARTMENT.test(crumbs[0]?.trim() ?? '') || NOT_CHARTED.test(name ?? '')) return null;
      for (const crumb of [...crumbs].reverse()) {
        const category = categoryFromText(crumb);
        if (category) return category;
      }
      return categoryFromText(name);
    },
  };
}

export const urbanOutfitters = urbnAdapter('urban-outfitters', 'urbanoutfitters.com');
export const freePeople = urbnAdapter('free-people', 'freepeople.com');
export const anthropologie = urbnAdapter('anthropologie', 'anthropologie.com');
