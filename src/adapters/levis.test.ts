// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { levis } from './levis';
import { loadFixture } from './test-fixtures';

describe("Levi's adapter", () => {
  it('reads each saved page', () => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`levis/${category}.html`);
      expect(extractProductContext(url, doc, [levis])).toMatchObject({ brandId: 'levis', category });
    }
  });

  it("leaves men's products without a clothing type", () => {
    const { doc } = loadFixture('levis/jeans.html');
    const url = new URL('https://www.levi.com/US/en_US/clothing/men/jeans/straight/501-original-fit-mens-jeans/p/005010114');
    expect(levis.getCategory(url, doc)).toBeNull();
  });

  it('leaves skirts in the dresses section without a clothing type', () => {
    const { url, doc } = loadFixture('levis/dresses.html');
    doc.querySelector('h1')!.textContent = 'Icon Skirt';
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replaceAll('Clementine Midi Dress', 'Icon Skirt');
    expect(levis.getCategory(url, doc)).toBeNull();
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('levis/jeans.html');
    expect(levis.isProductPage(new URL('https://www.levi.com/US/en_US/clothing/women/jeans/c/levi_clothing_women_jeans'), doc)).toBe(false);
  });
});
