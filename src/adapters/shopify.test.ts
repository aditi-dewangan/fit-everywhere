// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { edikted, fashionNova, princessPolly } from './shopify';
import { loadFixture } from './test-fixtures';

describe('Shopify store adapters', () => {
  it.each([
    [edikted, 'edikted'],
    [fashionNova, 'fashion-nova'],
    [princessPolly, 'princess-polly'],
  ] as const)('reads each saved page for %#', (adapter, brandId) => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`${brandId}/${category}.html`);
      expect(extractProductContext(url, doc, [adapter])).toMatchObject({ brandId, category });
    }
  });

  it("leaves Fashion Nova's other departments without a clothing type", () => {
    const { url, doc } = loadFixture('fashion-nova/jeans.html');
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replace('"women"', '"men"');
    expect(fashionNova.getCategory(url, doc)).toBeNull();
  });

  it('ignores collection pages', () => {
    const { doc } = loadFixture('edikted/tops.html');
    expect(edikted.isProductPage(new URL('https://edikted.com/collections/tops'), doc)).toBe(false);
  });
});
