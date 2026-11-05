import { defaultCategory, defaultProductName, jsonLdBreadcrumbs } from './common';
import type { BrandAdapter } from './types';

// H&M product URLs look like /en_us/productpage.1359402001.html. Pages carry
// JSON-LD breadcrumbs (HM.com › Women › Tops & T-Shirts › …) and a
// ProductGroup with the name and description.
const PRODUCT_PATH = /\/productpage\.\d+\.html$/;

export const hm: BrandAdapter = {
  brandId: 'hm',
  hostnames: ['hm.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory(url, doc) {
    const breadcrumbs = jsonLdBreadcrumbs(doc);
    // Only women's sizing is supported; let other departments fall through to "choose clothing type".
    if (breadcrumbs.length && !breadcrumbs.some((c) => /^women$/i.test(c.trim()))) return null;
    return defaultCategory(url, doc, defaultProductName(doc), breadcrumbs);
  },
};
