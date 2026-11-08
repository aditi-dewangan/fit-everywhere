import { categoryFromCrumbsAndName, defaultProductName } from './common';
import type { BrandAdapter } from './types';

// Product URLs look like /clothing/women/<slug>/pro/07153269/color/Mid%20Wash.
// JSON-LD has no breadcrumbs, so the department comes from the URL.
const PRODUCT_PATH = /^\/clothing\/([^/]+)\/[^/]+\/pro\/\d+/;

export const express: BrandAdapter = {
  brandId: 'express',
  hostnames: ['express.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory(url, doc) {
    // Only women's sizing is supported; other departments fall through to "choose clothing type".
    if (PRODUCT_PATH.exec(url.pathname)?.[1] !== 'women') return null;
    return categoryFromCrumbsAndName(doc);
  },
};
