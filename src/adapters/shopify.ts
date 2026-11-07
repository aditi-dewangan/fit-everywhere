import { categoryFromCrumbsAndName, defaultProductName, jsonLdBreadcrumbs } from './common';
import type { BrandAdapter } from './types';

// Shopify stores share /products/<slug> and /collections/<name>/products/<slug>.
const PRODUCT_PATH = /^(\/collections\/[^/]+)?\/products\/[^/]+\/?$/;

export const edikted: BrandAdapter = {
  brandId: 'edikted',
  hostnames: ['edikted.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  // Edikted only sells women's clothing.
  getCategory: (_url, doc) => categoryFromCrumbsAndName(doc),
};

export const fashionNova: BrandAdapter = {
  brandId: 'fashion-nova',
  hostnames: ['fashionnova.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory(_url, doc) {
    // Breadcrumbs start at the department. Only women's sizing is supported.
    if (jsonLdBreadcrumbs(doc)[0]?.trim().toLowerCase() !== 'women') return null;
    return categoryFromCrumbsAndName(doc);
  },
};
