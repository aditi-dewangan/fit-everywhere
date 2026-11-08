// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { annTaylor, loft } from './ann-inc';
import { extractProductContext } from './index';
import { loadFixture } from './test-fixtures';

describe('Ann Taylor and LOFT adapters', () => {
  it.each([
    [annTaylor, 'ann-taylor'],
    [loft, 'loft'],
  ] as const)('reads each saved page for %#', (adapter, brandId) => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`${brandId}/${category}.html`);
      expect(extractProductContext(url, doc, [adapter])).toMatchObject({ brandId, category });
    }
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('loft/jeans.html');
    expect(loft.isProductPage(new URL('https://www.loft.com/clothing/jeans/catl000015/'), doc)).toBe(false);
  });
});
