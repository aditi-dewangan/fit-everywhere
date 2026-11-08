import { categoryFromCrumbsAndName, textOf } from './common';
import type { BrandAdapter } from './types';

// Product URLs look like /products/supima-cotton-crew-neck-t-shirt/id_234877. The pages have no
// product JSON-LD or breadcrumbs, and not every name says "Women's", but the embedded
// app-root-state JSON has the product's "gender" ("Womens", "Mens", ...).
const PRODUCT_PATH = /^\/products\/[^/]+\/id_\d+\/?$/;

function gender(doc: Document): string | null {
  const state = doc.getElementById('app-root-state')?.textContent ?? '';
  return /"gender"\s*:\s*"([^"]*)"/.exec(state)?.[1] ?? null;
}

export const landsEnd: BrandAdapter = {
  brandId: 'lands-end',
  hostnames: ['landsend.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: (doc) => textOf(doc, 'h1'),
  getCategory(_url, doc) {
    // Only women's sizing is supported; other departments fall through to "choose clothing type".
    if (gender(doc) !== 'Womens') return null;
    return categoryFromCrumbsAndName(doc);
  },
};
