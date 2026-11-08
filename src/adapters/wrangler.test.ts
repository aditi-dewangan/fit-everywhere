// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { loadFixture } from './test-fixtures';
import { wrangler } from './wrangler';

describe('Wrangler adapter', () => {
  it('reads each saved page', () => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`wrangler/${category}.html`);
      expect(extractProductContext(url, doc, [wrangler])).toMatchObject({ brandId: 'wrangler', category });
    }
  });

  it("leaves men's products without a clothing type", () => {
    const { url, doc } = loadFixture('wrangler/jeans.html');
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replace('"WOMEN"', '"MEN"');
    expect(wrangler.getCategory(url, doc)).toBeNull();
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('wrangler/jeans.html');
    expect(wrangler.isProductPage(new URL('https://www.wrangler.com/shop/women-jeans'), doc)).toBe(false);
  });
});
