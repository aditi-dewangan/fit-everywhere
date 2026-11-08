// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { quince } from './quince';
import { loadFixture } from './test-fixtures';

describe('Quince adapter', () => {
  it('reads each saved page', () => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`quince/${category}.html`);
      expect(extractProductContext(url, doc, [quince])).toMatchObject({ brandId: 'quince', category });
    }
  });

  it("leaves men's products without a clothing type", () => {
    const { doc } = loadFixture('quince/tops.html');
    expect(quince.getCategory(new URL('https://www.quince.com/men/cotton-modal-tee'), doc)).toBeNull();
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('quince/jeans.html');
    expect(quince.isProductPage(new URL('https://www.quince.com/shop/women/jeans'), doc)).toBe(false);
  });
});
