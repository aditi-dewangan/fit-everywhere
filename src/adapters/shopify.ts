import { categoryFromCrumbsAndName, defaultProductName, isForWomen, jsonLdBreadcrumbs, jsonLdProduct } from './common';
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

export const princessPolly: BrandAdapter = {
  brandId: 'princess-polly',
  hostnames: ['princesspolly.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  // Princess Polly only sells women's clothing.
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

export const goodAmerican: BrandAdapter = {
  brandId: 'good-american',
  hostnames: ['goodamerican.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory(_url, doc) {
    // Always Fits styles are sold in combined sizes (00-4) that the chart doesn't use.
    if (/\balways fits\b/i.test(defaultProductName(doc) ?? '')) return null;
    return categoryFromCrumbsAndName(doc);
  },
};

export const agolde: BrandAdapter = {
  brandId: 'agolde',
  hostnames: ['agolde.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory(_url, doc) {
    // Men's products carry the brand "AGOLDE MENS"; only women's sizing is supported.
    const brand = (jsonLdProduct(doc)?.brand as { name?: unknown } | undefined)?.name;
    if (typeof brand === 'string' && /\bmens\b/i.test(brand)) return null;
    return categoryFromCrumbsAndName(doc);
  },
};

export const aloYoga: BrandAdapter = {
  brandId: 'alo-yoga',
  hostnames: ['aloyoga.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory(_url, doc) {
    // The product JSON-LD says female, male or unisex. Only women's sizing is supported.
    if (!isForWomen(doc)) return null;
    return categoryFromCrumbsAndName(doc);
  },
};

export const vuori: BrandAdapter = {
  ...aloYoga,
  brandId: 'vuori',
  // The product JSON-LD says female or male, the same as Alo's.
  hostnames: ['vuoriclothing.com'],
};
