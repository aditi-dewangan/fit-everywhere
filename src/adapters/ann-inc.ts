import { categoryFromCrumbsAndName, defaultProductName } from './common';
import type { BrandAdapter } from './types';

// Ann Taylor and LOFT share one site platform, and both sell only women's clothing.
// Product URLs look like /clothing/jeans/cata000018/straight-jean/855841.html.
const PRODUCT_PATH = /\/\d{5,}\.html$/;

function annIncAdapter(brandId: string, hostname: string): BrandAdapter {
  return {
    brandId,
    hostnames: [hostname],
    isProductPage: (url) => PRODUCT_PATH.test(url.pathname),
    getProductName: defaultProductName,
    getCategory: (_url, doc) => categoryFromCrumbsAndName(doc),
  };
}

export const annTaylor = annIncAdapter('ann-taylor', 'anntaylor.com');
export const loft = annIncAdapter('loft', 'loft.com');
