// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { loadFixture } from './test-fixtures';
import { underArmour } from './under-armour';

describe('Under Armour adapter', () => {
  it('reads the saved tops page', () => {
    const { url, doc } = loadFixture('under-armour/tops.html');
    expect(extractProductContext(url, doc, [underArmour])).toMatchObject({ brandId: 'under-armour', category: 'tops' });
  });

  it("leaves men's products without a clothing type", () => {
    const { url, doc } = loadFixture('under-armour/tops.html');
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replace('"Women"', '"Men"');
    expect(underArmour.getCategory(url, doc)).toBeNull();
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('under-armour/tops.html');
    expect(underArmour.isProductPage(new URL('https://www.underarmour.com/en-us/c/womens/clothing/tops/'), doc)).toBe(false);
  });
});
