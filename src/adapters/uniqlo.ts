import { categoryFromCrumbsAndName, textOf } from './common';
import type { BrandAdapter } from './types';

// Product URLs look like /us/en/products/E465760-000/00. Pages have no product
// JSON-LD. The title names the department: "Women's Mini T-Shirt | UNIQLO US".
const PRODUCT_PATH = /\/products\/E[\w-]+(\/\d+)?\/?$/;

export const uniqlo: BrandAdapter = {
  brandId: 'uniqlo',
  hostnames: ['uniqlo.com'],
  isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
  getProductName: (doc) => textOf(doc, 'h1'),
  getCategory(_url, doc) {
    // Only women's sizing is supported, plus unisex styles sold in the women's department.
    if (!/^(women|unisex)/i.test(doc.title.trim())) return null;
    return categoryFromCrumbsAndName(doc);
  },
};
