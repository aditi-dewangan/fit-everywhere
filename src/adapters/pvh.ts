import { categoryFromCrumbsAndName, defaultProductName } from './common';
import type { BrandAdapter } from './types';

// Tommy Hilfiger and Calvin Klein (both PVH) share a store platform. Product URLs name the
// department and end in a style code: /en/women/clothing/jeans/mid-rise-stretch-bootcut-jean/WW52183-1A6.html.
const PRODUCT_PATH = /^\/[a-z]{2}\/([^/]+)\/.+\/[A-Z0-9]+-[A-Z0-9]+\.html$/;

function adapter(brandId: string, hostname: string): BrandAdapter {
  return {
    brandId,
    hostnames: [hostname],
    isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
    getProductName: defaultProductName,
    getCategory(url, doc) {
      // Only women's sizing is supported; men's, kids' and other lines fall through to "choose clothing type".
      if (PRODUCT_PATH.exec(url.pathname)?.[1] !== 'women') return null;
      return categoryFromCrumbsAndName(doc);
    },
  };
}

export const tommyHilfiger = adapter('tommy-hilfiger', 'usa.tommy.com');
export const calvinKlein = adapter('calvin-klein', 'calvinklein.us');
