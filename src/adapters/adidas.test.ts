// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { adidas } from './adidas';
import { extractProductContext } from './index';
import { loadFixture } from './test-fixtures';

describe('adidas adapter', () => {
  it('reads the saved tops page', () => {
    const { url, doc } = loadFixture('adidas/tops.html');
    expect(extractProductContext(url, doc, [adidas])).toMatchObject({ brandId: 'adidas', category: 'tops' });
  });

  it.each(['Unisex', 'https://schema.org/Male'])('leaves %s products without a clothing type', (gender) => {
    const { url, doc } = loadFixture('adidas/tops.html');
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replace('https://schema.org/Female', gender);
    expect(adidas.getCategory(url, doc)).toBeNull();
  });

  it('ignores listing pages', () => {
    const { doc } = loadFixture('adidas/tops.html');
    expect(adidas.isProductPage(new URL('https://www.adidas.com/us/women-t_shirts'), doc)).toBe(false);
  });
});
