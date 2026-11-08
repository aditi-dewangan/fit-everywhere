import { categoryFromCrumbsAndName, textOf } from './common';
import type { BrandAdapter } from './types';

// J.Crew and Madewell share a product URL shape that names the department:
// /p/womens/categories/clothing/jeans/.../CZ648 and /p/womens/clothing/jeans/.../OB741/.
const PRODUCT_PATH = /^\/p\/([^/]+)\//;

function adapter(brandId: string, hostname: string): BrandAdapter {
  return {
    brandId,
    hostnames: [hostname],
    isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
    // Some pages have no product JSON-LD, and the page title carries extra words.
    getProductName: (doc) => textOf(doc, 'h1'),
    getCategory(url, doc) {
      // Only women's sizing is supported; other departments fall through to "choose clothing type".
      if (PRODUCT_PATH.exec(url.pathname)?.[1] !== 'womens') return null;
      return categoryFromCrumbsAndName(doc);
    },
  };
}

export const jCrew = adapter('j-crew', 'jcrew.com');
export const madewell = adapter('madewell', 'madewell.com');
