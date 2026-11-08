// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { landsEnd } from './lands-end';
import { loadFixture } from './test-fixtures';

describe("Lands' End adapter", () => {
  it('reads each saved page', () => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`lands-end/${category}.html`);
      expect(extractProductContext(url, doc, [landsEnd])).toMatchObject({ brandId: 'lands-end', category });
    }
  });

  it("leaves men's products without a clothing type", () => {
    const { url, doc } = loadFixture('lands-end/tops.html');
    const state = doc.getElementById('app-root-state')!;
    state.textContent = state.textContent!.replace('"Womens"', '"Mens"');
    expect(landsEnd.getCategory(url, doc)).toBeNull();
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('lands-end/tops.html');
    expect(landsEnd.isProductPage(new URL('https://www.landsend.com/shop/womens-tops/S-xfe-xez-y5c-xec'), doc)).toBe(false);
  });
});
