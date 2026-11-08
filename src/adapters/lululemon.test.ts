// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { lululemon } from './lululemon';
import { loadFixture } from './test-fixtures';

describe('lululemon adapter', () => {
  it('reads each saved page', () => {
    for (const category of ['tops', 'dresses']) {
      const { url, doc } = loadFixture(`lululemon/${category}.html`);
      expect(extractProductContext(url, doc, [lululemon])).toMatchObject({ brandId: 'lululemon', category });
    }
  });

  it("leaves men's products without a clothing type", () => {
    const { url, doc } = loadFixture('lululemon/tops.html');
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replace("Women's Clothes", "Men's Clothes");
    expect(lululemon.getCategory(url, doc)).toBeNull();
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('lululemon/tops.html');
    expect(lululemon.isProductPage(new URL('https://shop.lululemon.com/c/women-t-shirts/n1wx7w'), doc)).toBe(false);
  });
});
