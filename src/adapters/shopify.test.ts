// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { agolde, aloYoga, edikted, fashionNova, goodAmerican, princessPolly } from './shopify';
import { loadFixture } from './test-fixtures';

describe('Shopify store adapters', () => {
  it.each([
    [edikted, 'edikted'],
    [fashionNova, 'fashion-nova'],
    [princessPolly, 'princess-polly'],
    [agolde, 'agolde'],
  ] as const)('reads each saved page for %#', (adapter, brandId) => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`${brandId}/${category}.html`);
      expect(extractProductContext(url, doc, [adapter])).toMatchObject({ brandId, category });
    }
  });

  it("leaves Fashion Nova's other departments without a clothing type", () => {
    const { url, doc } = loadFixture('fashion-nova/jeans.html');
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replace('"women"', '"men"');
    expect(fashionNova.getCategory(url, doc)).toBeNull();
  });

  it('reads the saved Good American jeans page', () => {
    const { url, doc } = loadFixture('good-american/jeans.html');
    expect(extractProductContext(url, doc, [goodAmerican])).toMatchObject({ brandId: 'good-american', category: 'jeans' });
  });

  it('leaves Good American Always Fits styles without a clothing type', () => {
    const { url, doc } = loadFixture('good-american/jeans.html');
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replace('SOFT TECH GOOD', 'ALWAYS FITS GOOD');
    expect(goodAmerican.getCategory(url, doc)).toBeNull();
  });

  it("leaves AGOLDE men's products without a clothing type", () => {
    const { url, doc } = loadFixture('agolde/jeans.html');
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replace('"AGOLDE"', '"AGOLDE MENS"');
    expect(agolde.getCategory(url, doc)).toBeNull();
  });

  it('reads the saved Alo Yoga pages', () => {
    for (const category of ['tops', 'dresses']) {
      const { url, doc } = loadFixture(`alo-yoga/${category}.html`);
      expect(extractProductContext(url, doc, [aloYoga])).toMatchObject({ brandId: 'alo-yoga', category });
    }
  });

  it("leaves Alo Yoga men's products without a clothing type", () => {
    const { url, doc } = loadFixture('alo-yoga/tops.html');
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replace('"female"', '"male"');
    expect(aloYoga.getCategory(url, doc)).toBeNull();
  });

  it('ignores collection pages', () => {
    const { doc } = loadFixture('edikted/tops.html');
    expect(edikted.isProductPage(new URL('https://edikted.com/collections/tops'), doc)).toBe(false);
  });
});
