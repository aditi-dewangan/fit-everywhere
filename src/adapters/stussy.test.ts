// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { getChart } from '../data';
import { extractProductContext } from './index';
import { stussy } from './stussy';
import { loadFixture } from './test-fixtures';

describe('Stüssy adapter', () => {
  it('reads a tee', () => {
    const { url, doc } = loadFixture('stussy/tops.html');
    expect(extractProductContext(url, doc, [stussy])).toEqual({
      brandId: 'stussy',
      category: 'tops',
      productName: 'BULLDOG TEE',
      cut: 'relaxed',
      url: url.href,
    });
  });

  it('reads jeans by name, which the chart leaves out as unsupported', () => {
    const { url, doc } = loadFixture('stussy/tops.html');
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replace('BULLDOG TEE', "BIG OL' JEAN DENIM");
    expect(stussy.getCategory(url, doc)).toBe('jeans');
    expect(getChart('stussy')?.charts.jeans).toBeUndefined();
  });

  it('ignores collection pages', () => {
    const { doc } = loadFixture('stussy/tops.html');
    expect(stussy.isProductPage(new URL('https://www.stussy.com/collections/tees'), doc)).toBe(false);
  });
});
