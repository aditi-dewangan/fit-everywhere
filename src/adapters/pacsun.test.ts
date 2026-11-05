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
    });
  });

  it('ignores category and search pages', () => {
    const { doc } = loadFixture('pacsun/jeans.html');
    expect(pacsun.isProductPage(new URL('https://www.pacsun.com/womens/jeans/'), doc)).toBe(false);
    expect(pacsun.isProductPage(new URL('https://www.pacsun.com/sizechart-womens-jeans.html'), doc)).toBe(false);
  });
});
