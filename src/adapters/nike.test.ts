// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { nike } from './nike';
import { loadFixture } from './test-fixtures';

const renamed = (from: string, to: string) => {
  const { url, doc } = loadFixture('nike/dresses.html');
  for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replace(from, to);
  return nike.getCategory(url, doc);
};

describe('Nike adapter', () => {
  it('reads each saved page', () => {
    for (const category of ['tops', 'dresses']) {
      const { url, doc } = loadFixture(`nike/${category}.html`);
      expect(extractProductContext(url, doc, [nike])).toMatchObject({ brandId: 'nike', category });
    }
  });

  it("leaves kids', men's and plus products without a clothing type", () => {
    expect(renamed("Women's", "Big Kids' (Girls')")).toBeNull();
    expect(renamed("Women's", "Men's")).toBeNull();
    expect(renamed("Dri-FIT Dress", 'Dri-FIT Dress (Plus Size)')).toBeNull();
  });

  it('ignores listing pages', () => {
    const { doc } = loadFixture('nike/tops.html');
    expect(nike.isProductPage(new URL('https://www.nike.com/w/womens-tops-t-shirts-5e1x6z9om13'), doc)).toBe(false);
  });
});
