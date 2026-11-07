import { categoryFromCrumbsAndName, defaultProductName } from './common';
import type { BrandAdapter } from './types';

// Product URLs look like /products/01408623. The title names the department:
// "Women's Ribbed Turtleneck Mini Sweater Dress | Forever 21".
const PRODUCT_PATH = /^\/products\/[^/]+\/?$/;

export const forever21: BrandAdapter = {
  brandId: 'forever-21',
  hostnames: ['forever21.com'],
  // Plus sizes have their own chart, which hasn't been collected.
  isProductPage: (url, doc) => PRODUCT_PATH.test(url.pathname) && !/^plus\b/i.test(defaultProductName(doc) ?? ''),
  getProductName: defaultProductName,
  getCategory(_url, doc) {
    // Only women's sizing is supported; other departments fall through to "choose clothing type".
    // Men's titles carry no prefix, so require the women's one rather than rejecting "Men's".
    if (!/^women/i.test(doc.title.trim())) return null;
    return categoryFromCrumbsAndName(doc);
  },
};
