// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { michaelKors } from './michael-kors';
import { loadFixture } from './test-fixtures';

describe('Michael Kors adapter', () => {
  it('reads each saved page', () => {
    for (const category of ['tops', 'dresses']) {
      const { url, doc } = loadFixture(`michael-kors/${category}.html`);
      expect(extractProductContext(url, doc, [michaelKors])).toMatchObject({ brandId: 'michael-kors', category });
    }
  });

  it("leaves men's products without a clothing type", () => {
    const { url, doc } = loadFixture('michael-kors/tops.html');
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replace('"Women"', '"Men"');
    expect(michaelKors.getCategory(url, doc)).toBeNull();
  });

  it('ignores category and info pages', () => {
    const { doc } = loadFixture('michael-kors/tops.html');
    expect(michaelKors.isProductPage(new URL('https://www.michaelkors.com/women/clothing/tops/'), doc)).toBe(false);
    expect(michaelKors.isProductPage(new URL('https://www.michaelkors.com/info/shipping-terms.html'), doc)).toBe(false);
  });
});
