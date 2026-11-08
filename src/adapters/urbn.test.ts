// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { loadFixture } from './test-fixtures';
import { anthropologie, freePeople, urbanOutfitters } from './urbn';

function renamed(path: string, from: string, to: string) {
  const { url, doc } = loadFixture(path);
  for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replaceAll(from, to);
  return { url, doc };
}

describe('URBN adapters', () => {
  it.each([
    [urbanOutfitters, 'urban-outfitters', ['jeans', 'tops', 'dresses']],
    [freePeople, 'free-people', ['jeans', 'tops', 'dresses']],
    [anthropologie, 'anthropologie', ['tops', 'dresses']],
  ] as const)('reads each saved page for %#', (adapter, brandId, categories) => {
    for (const category of categories) {
      const { url, doc } = loadFixture(`${brandId}/${category}.html`);
      expect(extractProductContext(url, doc, [adapter])).toMatchObject({ brandId, category });
    }
  });

  it('accepts a trailing slash but not category pages', () => {
    const { doc } = loadFixture('free-people/tops.html');
    expect(freePeople.isProductPage(new URL('https://www.freepeople.com/shop/some-top/'), doc)).toBe(true);
    expect(freePeople.isProductPage(new URL('https://www.freepeople.com/tops/'), doc)).toBe(false);
  });

  it('does not read a jean jacket as jeans, even in a jeans breadcrumb', () => {
    const { url, doc } = renamed('urban-outfitters/jeans.html', 'BDG Keira Low-Rise Slim Jeans', 'BDG Jean Jacket');
    expect(urbanOutfitters.getCategory(url, doc)).toBeNull();
  });

  it("leaves men's products without a clothing type", () => {
    const { url, doc } = renamed('urban-outfitters/tops.html', "Women's", "Men's");
    expect(urbanOutfitters.getCategory(url, doc)).toBeNull();
  });
});
