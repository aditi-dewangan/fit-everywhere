// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { abercrombie } from './abercrombie';
import { extractProductContext, findAdapterForUrl } from './index';
import { loadFixture } from './test-fixtures';

describe('Abercrombie adapter', () => {
  it("reads women's jeans", () => {
    const { url, doc } = loadFixture('abercrombie/jeans.html');
    expect(extractProductContext(url, doc, [abercrombie])).toEqual({
      brandId: 'abercrombie',
      category: 'jeans',
      productName: 'High Rise Wide Leg Velvet Jean',
      cut: 'relaxed', // from "relaxed at the waist and hips" in the description
      url: url.href,
    });
  });

  it("reads a women's dress", () => {
    const { url, doc } = loadFixture('abercrombie/dresses.html');
    expect(extractProductContext(url, doc, [abercrombie])).toMatchObject({
      category: 'dresses',
      productName: 'Fine Wool-Blend Draped Maxi Dress',
      cut: 'regular',
    });
  });

  it("reads a women's top", () => {
    const { url, doc } = loadFixture('abercrombie/tops.html');
    expect(extractProductContext(url, doc, [abercrombie])).toMatchObject({
      category: 'tops',
      productName: 'Burnout Satin Fringe Top',
      cut: 'regular',
    });
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('abercrombie/jeans.html');
    expect(abercrombie.isProductPage(new URL('https://www.abercrombie.com/shop/us/womens-jeans-bottoms'), doc)).toBe(false);
  });

  it('is registered for abercrombie.com', () => {
    expect(findAdapterForUrl('https://www.abercrombie.com/shop/us/p/x-1')?.brandId).toBe('abercrombie');
  });
});
