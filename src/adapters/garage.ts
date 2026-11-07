import { categoryFromCrumbsAndName, defaultProductName } from './common';
import type { BrandAdapter } from './types';

// Product URLs look like /us/p/high-rise-lift-jeans/10010703807O.html. Garage
// only sells women's clothing, and pages have no JSON-LD breadcrumbs.
const PRODUCT_PATH = /\/p\/[^/]+\/\w+\.html$/;

export const garage: BrandAdapter = {
  brandId: 'garage',
  hostnames: ['garageclothing.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory: (_url, doc) => categoryFromCrumbsAndName(doc),
};
