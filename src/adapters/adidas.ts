import { categoryFromCrumbsAndName, defaultProductName, isForWomen } from './common';
import type { BrandAdapter } from './types';

// Product URLs look like /us/3-stripes-slim-tee/KD7980.html. Neither the URL nor the name
// names the department, but the product JSON-LD has audience.suggestedGender.
const PRODUCT_PATH = /^\/[a-z]{2}(-[a-z]{2})?\/[^/]+\/[A-Z0-9]+\.html$/;

export const adidas: BrandAdapter = {
  brandId: 'adidas',
  hostnames: ['adidas.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: defaultProductName,
  getCategory(_url, doc) {
    // Only women's sizing is supported; unisex items use a different chart.
    if (!isForWomen(doc)) return null;
    return categoryFromCrumbsAndName(doc);
  },
};
