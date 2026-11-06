import { categoryFromText, defaultProductName } from './common';
import type { BrandAdapter } from './types';

// American Eagle and Aerie share ae.com but publish different size charts.
// Product URLs look like /us/en/p/<department>/<type>/.../<sku>, where the
// department is "women", "men", or "aerie". Pages have no JSON-LD breadcrumbs.
const PRODUCT_PATH = /^\/[a-z]{2}\/[a-z]{2}\/p\/([^/]+)\/([^/]+)\//;

export const americanEagle: BrandAdapter = {
  brandId: 'american-eagle',
  hostnames: ['ae.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getBrandId: (url) => (PRODUCT_PATH.exec(url.pathname)?.[1] === 'aerie' ? 'aerie' : 'american-eagle'),
  getProductName: defaultProductName,
  getCategory(url) {
    const [, department, type] = PRODUCT_PATH.exec(url.pathname) ?? [];
    // Only women's sizing is supported; other departments fall through to "choose clothing type".
    if (department !== 'women' && department !== 'aerie') return null;
    // Only the type segment: a product slug like "jean-jacket" must not read as jeans.
    return categoryFromText(type);
  },
};
