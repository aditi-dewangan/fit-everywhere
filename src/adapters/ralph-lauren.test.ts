// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { ralphLauren } from './ralph-lauren';
import { loadFixture } from './test-fixtures';

describe('Ralph Lauren adapter', () => {
  it("reads women's jeans", () => {
    const { url, doc } = loadFixture('ralph-lauren/jeans.html');
    expect(extractProductContext(url, doc, [ralphLauren])).toEqual({
      brandId: 'ralph-lauren',
      category: 'jeans',
      productName: 'High-Rise Straight Jean',
      cut: 'regular',
      url: url.href,
    });
  });

  it('reads a top and a dress', () => {
    const top = loadFixture('ralph-lauren/tops.html');
    expect(extractProductContext(top.url, top.doc, [ralphLauren])?.category).toBe('tops');
    const dress = loadFixture('ralph-lauren/dresses.html');
    expect(extractProductContext(dress.url, dress.doc, [ralphLauren])?.category).toBe('dresses');
  });

  it("doesn't apply the Polo chart to the Lauren line", () => {
    const { url, doc } = loadFixture('ralph-lauren/dresses.html');
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replace('Polo Ralph Lauren', 'Lauren Ralph Lauren');
    expect(extractProductContext(url, doc, [ralphLauren])).toBeNull();
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('ralph-lauren/jeans.html');
    expect(ralphLauren.isProductPage(new URL('https://www.ralphlauren.com/women-clothing-jeans'), doc)).toBe(false);
  });
});
