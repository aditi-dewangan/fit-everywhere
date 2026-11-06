import { defaultCategory, defaultProductName, jsonLdBreadcrumbs } from './common';
import type { BrandAdapter } from './types';

// Gap Inc. brands share one site platform: /browse/product.do?pid=..., with a
// JSON-LD Product and BreadcrumbList. Each brand publishes its own size chart,
// and sister brands live on subdomains of gap.com, so hosts must match exactly.
function gapIncAdapter(brandId: string, hostname: string): BrandAdapter {
  return {
    brandId,
    hostnames: [hostname],
    exactHostnames: true,
    isProductPage: (url) => url.pathname === '/browse/product.do' && url.searchParams.has('pid'),
    getProductName: defaultProductName,
    getCategory(url, doc) {
      const breadcrumbs = jsonLdBreadcrumbs(doc);
      // Only women's sizing is supported; other departments fall through to "choose clothing type".
      if (breadcrumbs[0]?.trim().toLowerCase() !== 'women') return null;
      const name = defaultProductName(doc);
      // Old Navy files skirts under "Dresses & Skirts"; there is no skirt chart.
      if (/\bskirts?\b/i.test(name ?? '') && !/\bdress(es)?\b/i.test(name ?? '')) return null;
      return defaultCategory(url, doc, name, breadcrumbs);
    },
  };
}

export const gap = gapIncAdapter('gap', 'gap.com');
export const oldNavy = gapIncAdapter('old-navy', 'oldnavy.gap.com');
