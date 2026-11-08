import { categoryFromCrumbsAndName, defaultProductName } from './common';
import type { BrandAdapter } from './types';

// Product URLs look like /t/one-womens-dri-fit-dress-bZZw4RSR/II4516-006, with an optional
// country prefix (/gb/t/...). There are no breadcrumbs, but the product name names the
// department: "Nike One Women's Dri-FIT Dress", "Big Kids' (Girls')", "Men's".
const PRODUCT_PATH = /^(\/[a-z]{2}(-[a-z]{2})?)?\/t\/[^/]+\/[^/]+\/?$/;

export const nike: BrandAdapter = {
  brandId: 'nike',
  hostnames: ['nike.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory(_url, doc) {
    const name = defaultProductName(doc) ?? '';
    // Only women's regular sizing is supported; plus sizes have their own chart.
    if (!/\bwomen'?s\b/i.test(name) || /\bplus\b/i.test(name)) return null;
    return categoryFromCrumbsAndName(doc);
  },
};
