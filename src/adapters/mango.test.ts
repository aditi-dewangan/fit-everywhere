// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { mango } from './mango';
import { loadFixture } from './test-fixtures';

describe('Mango adapter', () => {
  it('reads each saved page', () => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`mango/${category}.html`);
      expect(extractProductContext(url, doc, [mango])).toMatchObject({ brandId: 'mango', category });
    }
  });

  it('reads the name from the title when there is no heading', () => {
    const { doc } = loadFixture('mango/tops.html');
    expect(mango.getProductName(doc)).toBe('Long-sleeved boat-neck t-shirt');
  });

  it("leaves men's and plus-size products without a clothing type", () => {
    const { doc } = loadFixture('mango/jeans.html');
    expect(mango.getCategory(new URL('https://shop.mango.com/us/en/p/men/jeans/straight/straight-jeans/37000000/TM/00'), doc)).toBeNull();
    expect(mango.getCategory(new URL('https://shop.mango.com/us/en/p/women/jeans/plus-sizes/wide-leg-jeans-with-rhinestones/37005898/TN/00'), doc)).toBeNull();
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('mango/jeans.html');
    expect(mango.isProductPage(new URL('https://shop.mango.com/us/en/c/women/jeans/164d8c42'), doc)).toBe(false);
  });
});
