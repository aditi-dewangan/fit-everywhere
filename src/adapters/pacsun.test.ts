// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { pacsun } from './pacsun';
import { loadFixture } from './test-fixtures';

describe('PacSun adapter', () => {
  it("reads women's jeans", () => {
    const { url, doc } = loadFixture('pacsun/jeans.html');
    expect(extractProductContext(url, doc, [pacsun])).toEqual({
      brandId: 'pacsun',
      category: 'jeans',
      productName: 'Eco Medium Blue Dad Jeans',
      cut: 'relaxed', // "Dad" in the name wins over "slightly oversized" in the description
      url: url.href,
      pageSizes: ['22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32'],
    });
  });

  it("reads a women's top from a partner brand's URL", () => {
    const { url, doc } = loadFixture('pacsun/tops.html');
    expect(extractProductContext(url, doc, [pacsun])).toMatchObject({
      category: 'tops',
      productName: 'Leila Ruffled Button Babydoll Tank Top',
      cut: 'regular',
    });
  });

  it('ignores category and search pages', () => {
    const { doc } = loadFixture('pacsun/jeans.html');
    expect(pacsun.isProductPage(new URL('https://www.pacsun.com/womens/jeans/'), doc)).toBe(false);
    expect(pacsun.isProductPage(new URL('https://www.pacsun.com/sizechart-womens-jeans.html'), doc)).toBe(false);
  });
});
