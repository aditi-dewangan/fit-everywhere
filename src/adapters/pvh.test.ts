// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { calvinKlein, tommyHilfiger } from './pvh';
import { loadFixture } from './test-fixtures';

describe('Tommy Hilfiger and Calvin Klein adapters', () => {
  it.each([
    [tommyHilfiger, 'tommy-hilfiger', ['jeans', 'tops', 'dresses']],
    [calvinKlein, 'calvin-klein', ['tops', 'dresses']],
  ] as const)('reads each saved page for %#', (adapter, brandId, categories) => {
    for (const category of categories) {
      const { url, doc } = loadFixture(`${brandId}/${category}.html`);
      expect(extractProductContext(url, doc, [adapter])).toMatchObject({ brandId, category });
    }
  });

  it("leaves men's products without a clothing type", () => {
    const { doc } = loadFixture('tommy-hilfiger/jeans.html');
    const url = new URL('https://usa.tommy.com/en/men/clothing/jeans/straight-fit-jean/MW12345-1A6.html');
    expect(tommyHilfiger.getCategory(url, doc)).toBeNull();
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('calvin-klein/tops.html');
    expect(calvinKlein.isProductPage(new URL('https://www.calvinklein.us/en/women/apparel/tops'), doc)).toBe(false);
  });
});
