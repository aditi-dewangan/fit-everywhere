import { categoryFromCrumbsAndName, defaultProductName, jsonLdBreadcrumbs } from './common';
import type { BrandAdapter } from './types';

// Product URLs are just /<slug>/<style code>.html, e.g. /brushed-alpaca-blend-sweater/MF661MALFS.html.
// Breadcrumbs name the department first: Women > Clothing > Sweaters > <product name>.
const PRODUCT_PATH = /^\/[^/]+\/[A-Z0-9]{6,}\.html$/;

export const michaelKors: BrandAdapter = {
  brandId: 'michael-kors',
  hostnames: ['michaelkors.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory(_url, doc) {
    // Only women's sizing is supported; other departments fall through to "choose clothing type".
    if (jsonLdBreadcrumbs(doc)[0]?.trim().toLowerCase() !== 'women') return null;
    return categoryFromCrumbsAndName(doc);
  },
};
