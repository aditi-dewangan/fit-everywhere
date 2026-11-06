// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { americanEagle } from './american-eagle';
import { extractProductContext } from './index';
import { loadFixture } from './test-fixtures';

describe('American Eagle adapter', () => {
  it("reads women's jeans", () => {
    const { url, doc } = loadFixture('american-eagle/jeans.html');
    expect(extractProductContext(url, doc, [americanEagle])).toEqual({
      brandId: 'american-eagle',
      category: 'jeans',
      productName: 'AE Super High-Waisted Flare Jean',
      cut: 'regular',
      url: url.href,
    });
  });

  it("reads a women's top", () => {
    const { url, doc } = loadFixture('american-eagle/tops.html');
    expect(extractProductContext(url, doc, [americanEagle])).toMatchObject({
      brandId: 'american-eagle',
      category: 'tops',
      productName: 'AE Soft & Sexy Waffle Mock Neck Tee',
    });
  });

  it("reads a women's dress", () => {
    const { url, doc } = loadFixture('american-eagle/dresses.html');
    expect(extractProductContext(url, doc, [americanEagle])).toMatchObject({
      brandId: 'american-eagle',
      category: 'dresses',
      productName: 'AE Knit Skater Mini Dress',
    });
  });

  it('reports Aerie products as the Aerie brand, which has its own chart', () => {
    const { url, doc } = loadFixture('aerie/tops.html');
    expect(extractProductContext(url, doc, [americanEagle])).toMatchObject({
      brandId: 'aerie',
      category: 'tops',
      productName: 'Aerie Ribbed Cardigan',
      cut: 'relaxed',
    });
  });

  it('does not treat a jean jacket as jeans', () => {
    const url = new URL('https://www.ae.com/us/en/p/women/tops/jackets-vests/ae-jean-jacket/0000_0000_000');
    expect(americanEagle.getCategory(url, document)).toBe('tops');
  });

  it("leaves men's products without a clothing type", () => {
    const url = new URL('https://www.ae.com/us/en/p/men/jeans/slim-jeans/ae-slim-jean/0000_0000_000');
    expect(americanEagle.getCategory(url, document)).toBeNull();
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('american-eagle/jeans.html');
    expect(americanEagle.isProductPage(new URL('https://www.ae.com/us/en/c/women/dresses/cat1320034'), doc)).toBe(false);
  });
});
