import { categoryFromCrumbsAndName, defaultProductName, jsonLdBreadcrumbs } from './common';
import type { BrandAdapter } from './types';

// Wrangler and Lee share a store platform. Product URLs look like
// /shop/womens-wrangler-bespoke-high-rise-flare-jean-5BESFL.html; category pages have no .html.
// Breadcrumbs name the department first: WOMEN > JEANS.
const PRODUCT_PATH = /^\/shop\/[^/]+\.html$/;

function adapter(brandId: string, hostname: string): BrandAdapter {
  return {
    brandId,
    hostnames: [hostname],
    isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
    getProductName: defaultProductName,
    getCategory(_url, doc) {
      // Only women's sizing is supported; other departments fall through to "choose clothing type".
      if (jsonLdBreadcrumbs(doc)[0]?.trim().toLowerCase() !== 'women') return null;
      return categoryFromCrumbsAndName(doc);
    },
  };
}

export const wrangler = adapter('wrangler', 'wrangler.com');
export const lee = adapter('lee', 'lee.com');
