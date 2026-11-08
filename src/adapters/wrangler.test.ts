// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { loadFixture } from './test-fixtures';
import { lee, wrangler } from './wrangler';

describe('Wrangler and Lee adapters', () => {
  it.each([
    [wrangler, 'wrangler'],
    [lee, 'lee'],
  ] as const)('reads each saved page for %#', (adapter, brandId) => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`${brandId}/${category}.html`);
      expect(extractProductContext(url, doc, [adapter])).toMatchObject({ brandId, category });
    }
  });

  it("leaves men's products without a clothing type", () => {
    const { url, doc } = loadFixture('wrangler/jeans.html');
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replace('"WOMEN"', '"MEN"');
    expect(wrangler.getCategory(url, doc)).toBeNull();
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('lee/jeans.html');
    expect(lee.isProductPage(new URL('https://www.lee.com/shop/women-clothing-jeans'), doc)).toBe(false);
  });
});
