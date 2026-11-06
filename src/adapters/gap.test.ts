// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { gap, oldNavy } from './gap';
import { extractProductContext, findAdapterForUrl } from './index';
import { loadFixture } from './test-fixtures';

describe('Gap and Old Navy adapters', () => {
  it("reads Gap women's jeans", () => {
    const { url, doc } = loadFixture('gap/jeans.html');
    expect(extractProductContext(url, doc, [gap])).toEqual({
      brandId: 'gap',
      category: 'jeans',
      productName: 'Mid Rise Lean Barrel Jeans',
      cut: 'regular',
      url: url.href,
    });
  });

  it('reads a Gap top and dress', () => {
    const top = loadFixture('gap/tops.html');
    expect(extractProductContext(top.url, top.doc, [gap])?.category).toBe('tops');
    const dress = loadFixture('gap/dresses.html');
    expect(extractProductContext(dress.url, dress.doc, [gap])?.category).toBe('dresses');
  });

  it('reads Old Navy pages as Old Navy', () => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`old-navy/${category}.html`);
      expect(extractProductContext(url, doc, [oldNavy])).toMatchObject({ brandId: 'old-navy', category });
    }
  });

  it('routes each host to its own brand, and never gives a sister brand Gap sizes', () => {
    expect(findAdapterForUrl('https://www.gap.com/browse/product.do?pid=1')?.brandId).toBe('gap');
    expect(findAdapterForUrl('https://oldnavy.gap.com/browse/product.do?pid=1')?.brandId).toBe('old-navy');
    expect(findAdapterForUrl('https://bananarepublic.gap.com/browse/product.do?pid=1')).toBeNull();
    expect(findAdapterForUrl('https://athleta.gap.com/browse/product.do?pid=1')).toBeNull();
  });

  it('does not read a skirt filed under "Dresses & Skirts" as a dress', () => {
    const { url, doc } = loadFixture('old-navy/dresses.html');
    doc.querySelector('h1')!.textContent = 'Midi Skirt';
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replace(/SoSoft[^"]*Dress/, 'Midi Skirt');
    expect(oldNavy.getCategory(url, doc)).toBeNull();
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('gap/jeans.html');
    expect(gap.isProductPage(new URL('https://www.gap.com/browse/women/jeans?cid=5664'), doc)).toBe(false);
  });
});
