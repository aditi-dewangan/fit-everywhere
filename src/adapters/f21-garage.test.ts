// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { forever21 } from './forever-21';
import { garage } from './garage';
import { extractProductContext } from './index';
import { loadFixture } from './test-fixtures';

describe('Forever 21 adapter', () => {
  it('reads each saved page', () => {
    for (const category of ['tops', 'dresses']) {
      const { url, doc } = loadFixture(`forever-21/${category}.html`);
      expect(extractProductContext(url, doc, [forever21])).toMatchObject({ brandId: 'forever-21', category });
    }
  });

  it('excludes plus-size products, which use a different chart', () => {
    const { url, doc } = loadFixture('forever-21/dresses.html');
    for (const s of doc.querySelectorAll('script')) s.textContent = s.textContent!.replaceAll('Ribbed Turtleneck Mini Sweater Dress', 'Plus Size Ribbed Sweater Dress');
    expect(extractProductContext(url, doc, [forever21])).toBeNull();
  });

  it("leaves men's products without a clothing type", () => {
    const { url, doc } = loadFixture('forever-21/tops.html');
    doc.title = 'Distressed Straight Flare Jeans'; // A men's page: its title has no department prefix.
    expect(forever21.getCategory(url, doc)).toBeNull();
  });

  it('ignores collection pages', () => {
    const { doc } = loadFixture('forever-21/tops.html');
    expect(forever21.isProductPage(new URL('https://www.forever21.com/collections/womens-tops'), doc)).toBe(false);
  });
});

describe('Garage adapter', () => {
  it('reads each saved page', () => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`garage/${category}.html`);
      expect(extractProductContext(url, doc, [garage])).toMatchObject({ brandId: 'garage', category });
    }
  });

  it('ignores other pages', () => {
    const { doc } = loadFixture('garage/tops.html');
    expect(garage.isProductPage(new URL('https://www.garageclothing.com/us/gar-size-chart.html'), doc)).toBe(false);
  });
});
