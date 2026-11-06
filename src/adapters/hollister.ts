import { defaultCategory, defaultProductName, jsonLdBreadcrumbs } from './common';
import type { BrandAdapter } from './types';

// Hollister product URLs look like /shop/us/p/high-rise-light-wash-straight-jeans-60466934.
// Pages carry a JSON-LD Product plus breadcrumbs nested in a WebPage node.
const PRODUCT_PATH = /^\/shop\/[a-z]{2}\/p\/[^/]+-\d+\/?$/;

export const hollister: BrandAdapter = {
  brandId: 'hollister',
  hostnames: ['hollisterco.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory(url, doc) {
    const breadcrumbs = jsonLdBreadcrumbs(doc);
    // Only women's sizing is supported; other departments fall through to "choose clothing type".
    if (breadcrumbs.length && !breadcrumbs.some((c) => /^women'?s$/i.test(c.trim()))) return null;
    return defaultCategory(url, doc, defaultProductName(doc), breadcrumbs);
  },
};
