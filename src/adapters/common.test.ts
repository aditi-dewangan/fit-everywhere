// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext, findAdapter, findAdapterForUrl } from './index';
import { categoryFromText, defaultCategory, defaultDescription, defaultProductName, detectCut, jsonLdBreadcrumbs } from './common';
import type { BrandAdapter } from './types';

const page = (html: string) => new DOMParser().parseFromString(html, 'text/html');
const ld = (data: unknown) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`;

describe('product name', () => {
  it('prefers JSON-LD Product name', () => {
    const doc = page(`<title>Shop | Tee</title><h1>Heading</h1>${ld({ '@type': 'Product', name: 'Classic Tee' })}`);
    expect(defaultProductName(doc)).toBe('Classic Tee');
  });

  it('finds the Product inside @graph', () => {
    const doc = page(ld({ '@graph': [{ '@type': 'WebPage' }, { '@type': ['Product'], name: 'Graph Tee' }] }));
    expect(defaultProductName(doc)).toBe('Graph Tee');
  });

  it('falls back to the main heading, then the title', () => {
    expect(defaultProductName(page('<title>T</title><h1> Wrap   Dress </h1>'))).toBe('Wrap Dress');
    expect(defaultProductName(page('<title>Only Title</title>'))).toBe('Only Title');
  });

  it('survives broken JSON-LD', () => {
    const doc = page('<script type="application/ld+json">{not json</script><h1>Fallback</h1>');
    expect(defaultProductName(doc)).toBe('Fallback');
  });
});

describe('clothing type', () => {
  it.each([
    ['Ribbed Tank Top', 'tops'],
    ['Linen Shirt Dress', 'dresses'],
    ['High Rise Straight Jeans', 'jeans'],
    ['Denim Shirt', 'tops'],
    ['Leather Belt', null],
  ] as const)('%s → %s', (name, category) => {
    expect(categoryFromText(name)).toBe(category);
  });

  it('checks breadcrumbs before the URL and product name', () => {
    const doc = page(ld({ '@type': 'BreadcrumbList', itemListElement: [{ name: 'Women' }, { item: { name: 'Dresses' } }] }));
    expect(jsonLdBreadcrumbs(doc)).toEqual(['Women', 'Dresses']);
    expect(defaultCategory(new URL('https://x.com/jeans/p/1'), doc, 'Tee')).toBe('dresses');
  });

  it('uses the URL path, then the product name', () => {
    const doc = page('');
    expect(defaultCategory(new URL('https://x.com/women/tops-blouses/p/1'), doc, 'Item')).toBe('tops');
    expect(defaultCategory(new URL('https://x.com/p/123'), doc, 'Skinny Jeans')).toBe('jeans');
    expect(defaultCategory(new URL('https://x.com/p/123'), doc, 'Scarf')).toBeNull();
  });
});

describe('cut', () => {
  it.each([
    ['Oversized Crew Tee', null, 'oversized'],
    ['Relaxed Fit Shirt', null, 'relaxed'],
    ['Boyfriend Jeans', null, 'relaxed'],
    ['Skinny Jeans', null, 'slim'],
    ['Crew Tee', 'A slim, fitted silhouette.', 'slim'],
    ['Crew Tee', null, 'regular'],
  ] as const)('%s / %s → %s', (name, description, cut) => {
    expect(detectCut(name, description)).toBe(cut);
  });

  it('trusts the product name over the description', () => {
    expect(detectCut('Oversized Tee', 'Pairs well with slim jeans')).toBe('oversized');
  });

  it('reads the description from JSON-LD, then meta tags', () => {
    expect(defaultDescription(page(ld({ '@type': 'Product', description: 'Relaxed linen' })))).toBe('Relaxed linen');
    expect(defaultDescription(page('<meta name="description" content="Slim knit">'))).toBe('Slim knit');
  });
});

describe('adapter lookup', () => {
  const adapter: BrandAdapter = {
    brandId: 'example',
    hostnames: ['example.com'],
    isProductPage: (url) => url.pathname.startsWith('/p/'),
    getProductName: defaultProductName,
    getCategory: (url, doc) => defaultCategory(url, doc, defaultProductName(doc)),
  };

  it('matches the hostname, www, and subdomains', () => {
    expect(findAdapter('example.com', [adapter])).toBe(adapter);
    expect(findAdapter('www.example.com', [adapter])).toBe(adapter);
    expect(findAdapter('shop.example.com', [adapter])).toBe(adapter);
    expect(findAdapter('notexample.com', [adapter])).toBeNull();
  });

  it('ignores non-web URLs', () => {
    expect(findAdapterForUrl('chrome://extensions', [adapter])).toBeNull();
    expect(findAdapterForUrl('not a url', [adapter])).toBeNull();
  });

  it('builds a ProductContext on product pages only', () => {
    const doc = page(`${ld({ '@type': 'Product', name: 'Relaxed Linen Dress' })}`);
    expect(extractProductContext(new URL('https://example.com/p/1'), doc, [adapter])).toEqual({
      brandId: 'example',
      category: 'dresses',
      productName: 'Relaxed Linen Dress',
      cut: 'relaxed',
      url: 'https://example.com/p/1',
    });
    expect(extractProductContext(new URL('https://example.com/cart'), doc, [adapter])).toBeNull();
    expect(extractProductContext(new URL('https://other.com/p/1'), doc, [adapter])).toBeNull();
  });
});
