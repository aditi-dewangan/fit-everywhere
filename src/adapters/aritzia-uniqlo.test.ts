// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { aritzia } from './aritzia';
import { extractProductContext } from './index';
import { loadFixture } from './test-fixtures';
import { uniqlo } from './uniqlo';

describe('Aritzia adapter', () => {
  it('reads each saved page', () => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`aritzia/${category}.html`);
      expect(extractProductContext(url, doc, [aritzia])).toMatchObject({ brandId: 'aritzia', category });
    }
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('aritzia/jeans.html');
    expect(aritzia.isProductPage(new URL('https://www.aritzia.com/us/en/clothing/jeans'), doc)).toBe(false);
  });
});

describe('UNIQLO adapter', () => {
  it('reads each saved page, using the heading for the name', () => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`uniqlo/${category}.html`);
      expect(extractProductContext(url, doc, [uniqlo])).toMatchObject({ brandId: 'uniqlo', category });
    }
    const { url, doc } = loadFixture('uniqlo/tops.html');
    expect(extractProductContext(url, doc, [uniqlo])?.productName).toBe('Mini T-Shirt');
  });

  it("leaves men's products without a clothing type", () => {
    const { url, doc } = loadFixture('uniqlo/tops.html');
    doc.title = "Men's Mini T-Shirt | UNIQLO US";
    expect(uniqlo.getCategory(url, doc)).toBeNull();
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('uniqlo/tops.html');
    expect(uniqlo.isProductPage(new URL('https://www.uniqlo.com/us/en/women/tops'), doc)).toBe(false);
  });
});
