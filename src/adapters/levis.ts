import { categoryFromCrumbsAndName, defaultProductName } from './common';
import type { BrandAdapter } from './types';

// Product URLs name the department and end in a product code:
// /US/en_US/clothing/women/jeans/straight/501-90s-womens-jeans/p/A19590115.
const PRODUCT_PATH = /^\/[A-Z]{2}\/[a-z]{2}_[A-Z]{2}\/clothing\/([^/]+)\/.*\/p\/[^/]+\/?$/;

export const levis: BrandAdapter = {
  brandId: 'levis',
  hostnames: ['levi.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory(url, doc) {
    // Only women's sizing is supported; other departments fall through to "choose clothing type".
    if (PRODUCT_PATH.exec(url.pathname)?.[1] !== 'women') return null;
    return categoryFromCrumbsAndName(doc);
  },
};
