import { categoryFromCrumbsAndName, defaultProductName, jsonLdBreadcrumbs } from './common';
import type { BrandAdapter } from './types';

// Product URLs look like /p/little-ribbed-tee/b5a7hl0ba8 and don't name the department,
// but breadcrumbs do: Women's Clothes > Shirts > Short Sleeve Shirts.
const PRODUCT_PATH = /^\/p\/[^/]+\/[^/]+\/?$/;

export const lululemon: BrandAdapter = {
  brandId: 'lululemon',
  hostnames: ['shop.lululemon.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory(_url, doc) {
    // Only women's sizing is supported; other departments fall through to "choose clothing type".
    if (!/^women'?s\b/i.test(jsonLdBreadcrumbs(doc)[0]?.trim() ?? '')) return null;
    return categoryFromCrumbsAndName(doc);
  },
};
