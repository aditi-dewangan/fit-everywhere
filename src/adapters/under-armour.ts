import { categoryFromCrumbsAndName, defaultProductName, jsonLdBreadcrumbs } from './common';
import type { BrandAdapter } from './types';

// Product URLs look like /en-us/p/the_bouncy_tee_womens_short_sleeve/6017933.html.
// Breadcrumbs name the department first: Women > Shirts & Tops.
const PRODUCT_PATH = /^\/[a-z]{2}-[a-z]{2}\/p\/[^/]+\/[^/]+\.html$/;

export const underArmour: BrandAdapter = {
  brandId: 'under-armour',
  hostnames: ['underarmour.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory(_url, doc) {
    // Only women's sizing is supported; other departments fall through to "choose clothing type".
    if (jsonLdBreadcrumbs(doc)[0]?.trim().toLowerCase() !== 'women') return null;
    return categoryFromCrumbsAndName(doc);
  },
};
