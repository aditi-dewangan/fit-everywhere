import { defaultCategory, defaultProductName, jsonLdBreadcrumbs } from './common';
import type { BrandAdapter } from './types';

// PacSun product URLs end in a numeric product ID, e.g.
// /pacsun/eco-medium-blue-dad-jeans-0860454210182.html. Pages carry JSON-LD
// breadcrumbs (Women's › Bottoms › Jeans) and a ProductGroup.
const PRODUCT_PATH = /-\d{6,}\.html$/;

export const pacsun: BrandAdapter = {
  brandId: 'pacsun',
  hostnames: ['pacsun.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory(url, doc) {
    const breadcrumbs = jsonLdBreadcrumbs(doc);
    // Only women's sizing is supported; other departments fall through to "choose clothing type".
    if (breadcrumbs.length && !breadcrumbs.some((c) => /^women'?s$/i.test(c.trim()))) return null;
    return defaultCategory(url, doc, defaultProductName(doc), breadcrumbs);
  },
};
