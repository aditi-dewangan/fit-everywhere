import { defaultCategory, defaultProductName, jsonLdBreadcrumbs, jsonLdProduct } from './common';
import type { BrandAdapter } from './types';

// Product URLs look like /women-clothing-jeans/high-rise-straight-jean/100043703.html.
const PRODUCT_PATH = /\/\d{5,}\.html$/;

function isLaurenLine(doc: Document): boolean {
  const brand = jsonLdProduct(doc)?.brand as { name?: unknown } | string | undefined;
  const name = typeof brand === 'string' ? brand : brand?.name;
  return typeof name === 'string' && /^lauren\b/i.test(name.trim());
}

export const ralphLauren: BrandAdapter = {
  brandId: 'ralph-lauren',
  hostnames: ['ralphlauren.com'],
  // The Lauren line isn't covered by the collected Polo chart.
  isProductPage: (url, doc) => PRODUCT_PATH.test(url.pathname) && !isLaurenLine(doc),
  getProductName: defaultProductName,
  getCategory(url, doc) {
    const breadcrumbs = jsonLdBreadcrumbs(doc);
    // Only women's sizing is supported; other departments fall through to "choose clothing type".
    if (breadcrumbs[0]?.trim().toLowerCase() !== 'women') return null;
    return defaultCategory(url, doc, defaultProductName(doc), breadcrumbs);
  },
};
