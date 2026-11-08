import { categoryFromCrumbsAndName, defaultProductName, jsonLdBreadcrumbs } from './common';
import type { BrandAdapter } from './types';

// Product URLs look like /us/en/product/the-farrah-hi-rise-wide-jean/109082.html.
const PRODUCT_PATH = /\/product\/[^/]+\/\d+\.html$/;

export const aritzia: BrandAdapter = {
  brandId: 'aritzia',
  hostnames: ['aritzia.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory(_url, doc) {
    // Only women's sizing is supported; other departments fall through to "choose clothing type".
    if (/^men/i.test(jsonLdBreadcrumbs(doc)[0]?.trim() ?? '')) return null;
    return categoryFromCrumbsAndName(doc);
  },
};
