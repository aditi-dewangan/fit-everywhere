import { categoryFromText, textOf } from './common';
import type { BrandAdapter } from './types';

// Product URLs name the department and type: /us/en/p/women/jeans/flare/high-waist-flared-jeans/37015862/TO/00.
// The pages have no product JSON-LD or breadcrumbs, so both come from the URL.
const PRODUCT_PATH = /^\/[a-z]{2}\/[a-z]{2}\/p\/([^/]+)\/([^/]+)\/.+\/\d+\/[^/]+\/\d+\/?$/;

export const mango: BrandAdapter = {
  brandId: 'mango',
  hostnames: ['shop.mango.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: (doc) => textOf(doc, 'h1') ?? (doc.title.split('|')[0]?.trim() || null),
  getCategory(url) {
    const match = PRODUCT_PATH.exec(url.pathname);
    // Only women's regular sizing is supported; plus sizes have their own measurements.
    if (!match || match[1] !== 'women' || url.pathname.includes('/plus-sizes/')) return null;
    return categoryFromText(match[2]?.replace(/-+/g, ' '));
  },
};
