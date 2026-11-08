import { categoryFromCrumbsAndName, textOf } from './common';
import type { BrandAdapter } from './types';

// Product URLs are /<department>/<slug>, e.g. /women/cotton-modal-relaxed-long-sleeve-tee;
// category pages live under /shop/. The pages have no product JSON-LD, so the name comes from the h1.
const PRODUCT_PATH = /^\/([a-z-]+)\/[^/]+\/?$/;

export const quince: BrandAdapter = {
  brandId: 'quince',
  hostnames: ['quince.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname) && !url.pathname.startsWith('/shop/'),
  getProductName: (doc) => textOf(doc, 'h1'),
  getCategory(url, doc) {
    // Only women's sizing is supported; other departments fall through to "choose clothing type".
    if (PRODUCT_PATH.exec(url.pathname)?.[1] !== 'women') return null;
    return categoryFromCrumbsAndName(doc);
  },
};
