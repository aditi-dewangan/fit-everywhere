// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { jCrew, madewell } from './jcrew-madewell';
import { loadFixture } from './test-fixtures';

describe('J.Crew and Madewell adapters', () => {
  it.each([
    [jCrew, 'j-crew'],
    [madewell, 'madewell'],
  ] as const)('reads each saved page for %#', (adapter, brandId) => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`${brandId}/${category}.html`);
      expect(extractProductContext(url, doc, [adapter])).toMatchObject({ brandId, category });
    }
  });

  it("leaves men's products without a clothing type", () => {
    const { doc } = loadFixture('j-crew/jeans.html');
    expect(jCrew.getCategory(new URL('https://www.jcrew.com/p/mens/categories/clothing/jeans/x/AB123'), doc)).toBeNull();
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('j-crew/jeans.html');
    expect(jCrew.isProductPage(new URL('https://www.jcrew.com/plp/womens/categories/clothing/jeans'), doc)).toBe(false);
  });
});
