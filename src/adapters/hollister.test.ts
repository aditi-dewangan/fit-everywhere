// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { jsonLdBreadcrumbs } from './common';
import { hollister } from './hollister';
import { extractProductContext } from './index';
import { loadFixture } from './test-fixtures';

describe('Hollister adapter', () => {
  it("reads women's jeans", () => {
    const { url, doc } = loadFixture('hollister/jeans.html');
    expect(extractProductContext(url, doc, [hollister])).toEqual({
      brandId: 'hollister',
      category: 'jeans',
      productName: 'High-Rise Light Wash Straight Jeans',
      cut: 'regular',
      url: url.href,
    });
  });

  it('finds breadcrumbs nested inside the WebPage node', () => {
    const { doc } = loadFixture('hollister/jeans.html');
    expect(jsonLdBreadcrumbs(doc)[0]).toBe("Women's");
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('hollister/jeans.html');
    expect(hollister.isProductPage(new URL('https://www.hollisterco.com/shop/us/womens-jeans'), doc)).toBe(false);
  });
});
