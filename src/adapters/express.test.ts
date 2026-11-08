// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { express } from './express';
import { extractProductContext } from './index';
import { loadFixture } from './test-fixtures';

describe('Express adapter', () => {
  it('reads each saved page', () => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`express/${category}.html`);
      expect(extractProductContext(url, doc, [express])).toMatchObject({ brandId: 'express', category });
    }
  });

  it('reads a short sleeve top as a top, and a relaxed cut from the name', () => {
    const top = loadFixture('express/tops.html');
    expect(express.getCategory(top.url, top.doc)).toBe('tops');
    const jeans = loadFixture('express/jeans.html');
    expect(extractProductContext(jeans.url, jeans.doc, [express])?.cut).toBe('relaxed');
  });

  it("leaves men's products without a clothing type", () => {
    const { doc } = loadFixture('express/jeans.html');
    expect(express.getCategory(new URL('https://www.express.com/clothing/men/some-jeans/pro/123'), doc)).toBeNull();
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('express/jeans.html');
    expect(express.isProductPage(new URL('https://www.express.com/womens-clothing/jeans/cat2005'), doc)).toBe(false);
  });
});
