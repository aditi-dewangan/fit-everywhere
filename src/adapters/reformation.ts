import { categoryFromCrumbsAndName, defaultProductName } from './common';
import type { BrandAdapter } from './types';

// Product URLs look like /products/heaven-silk-dress/1320942ALO.html. There are no breadcrumbs,
// so the clothing type comes from the product name.
const PRODUCT_PATH = /^\/products\/[^/]+\/[A-Z0-9]+\.html$/;

export const reformation: BrandAdapter = {
  brandId: 'reformation',
  hostnames: ['thereformation.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  // Reformation sells women's clothing (plus a small kids' line, which isn't detected).
  getCategory: (_url, doc) => categoryFromCrumbsAndName(doc),
};
