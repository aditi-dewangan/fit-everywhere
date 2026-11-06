// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { hm } from './hm';
import { loadFixture } from './test-fixtures';

describe('H&M adapter', () => {
  it('reads a women\'s top', () => {
    const { url, doc } = loadFixture('hm/tops.html');
    expect(extractProductContext(url, doc, [hm])).toEqual({
      brandId: 'hm',
      category: 'tops',
      productName: 'Layered Camisole Top',
      cut: 'regular',
      url: url.href,
    });
  });

  it("reads women's jeans", () => {
    const { url, doc } = loadFixture('hm/jeans.html');
    expect(extractProductContext(url, doc, [hm])).toEqual({
      brandId: 'hm',
      category: 'jeans',
      productName: 'Harper High Rise Wide Leg Jeans',
      cut: 'regular',
      url: url.href,
    });
  });

  it("reads a women's dress", () => {
    const { url, doc } = loadFixture('hm/dresses.html');
    expect(extractProductContext(url, doc, [hm])).toMatchObject({
      category: 'dresses',
      productName: 'Tie-Shoulder-Strap Smocked Dress',
      cut: 'regular',
    });
  });

  it('ignores non-product pages', () => {
    const { doc } = loadFixture('hm/tops.html');
    expect(hm.isProductPage(new URL('https://www2.hm.com/en_us/women/products/tops.html'), doc)).toBe(false);
  });

  it("returns no category outside the women's department", () => {
    const doc = new DOMParser().parseFromString(
      `<script type="application/ld+json">${JSON.stringify({
        '@type': 'BreadcrumbList',
        itemListElement: [{ name: 'HM.com' }, { name: 'Men' }, { name: 'Jeans' }],
      })}</script>`,
      'text/html',
    );
    expect(hm.getCategory(new URL('https://www2.hm.com/en_us/productpage.1.html'), doc)).toBeNull();
  });
});
