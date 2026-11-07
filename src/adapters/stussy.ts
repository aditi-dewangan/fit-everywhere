import { categoryFromText, defaultProductName } from './common';
import type { BrandAdapter } from './types';

// Product URLs look like /collections/tees/products/1905208-bulldog-tee-black
// or /products/<slug>. Clothing is unisex, so there's no department to check.
const PRODUCT_PATH = /^(\/collections\/[^/]+)?\/products\/[^/]+\/?$/;

export const stussy: BrandAdapter = {
  brandId: 'stussy',
  hostnames: ['stussy.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  // The name alone: "denim" collections also hold jackets, and a jacket isn't jeans.
  getCategory: (_url, doc) => categoryFromText(defaultProductName(doc)),
};
