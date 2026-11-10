// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { baseSize, listKind, listedAs, normalizeSize, readPageSizes, sizeKind } from './page-sizes';

const page = (body: string) => new DOMParser().parseFromString(`<body>${body}</body>`, 'text/html');

describe('readPageSizes', () => {
  it("reads the main product's size buttons, not a later quick-shop panel", () => {
    // Shaped like PacSun's product page (live, 2026-11-09).
    const doc = page(`
      <div class="grouped-attribute-tiles" id="grouped-attribute-tiles-size">
        <div class="attribute-tiles" id="size-1">
          ${['XS', 'SML', 'MED', 'LRG', 'XLG'].map((s) => `<div class="attribute-tile"><span>${s}</span></div>`).join('')}
        </div>
      </div>
      <div class="js-quick-shop-attribute-size">${['24', '25', '26'].map((s) => `<button>${s}</button>`).join('')}</div>`);
    expect(readPageSizes(doc)).toEqual(['XS', 'SML', 'MED', 'LRG', 'XLG']);
  });

  it('reads radio inputs marked as sizes', () => {
    // Shaped like Everlane's Shopify theme (live, 2026-11-09).
    const doc = page(`<fieldset class="product-form__input">${['24', '25', '26']
      .map((s) => `<input type="radio" name="Size-1" value="${s}" data-option-name="Size"><label>${s}</label>`)
      .join('')}</fieldset>`);
    expect(readPageSizes(doc)).toEqual(['24', '25', '26']);
  });

  it('reads a size dropdown', () => {
    const doc = page('<select name="size"><option>Select a size</option><option>00</option><option>0</option><option>2</option></select>');
    expect(readPageSizes(doc)).toEqual(['00', '0', '2']);
  });

  it('ignores size guide tables, dialogs and listing filters', () => {
    const doc = page(`
      <table class="size-table"><tr><td>XS</td><td>S</td></tr></table>
      <div role="dialog" class="size-modal"><span>24</span><span>25</span></div>
      <ul class="filter-size"><li>S</li><li>M</li></ul>`);
    expect(readPageSizes(doc)).toEqual([]);
  });

  it('ignores short text outside size containers', () => {
    expect(readPageSizes(page('<div class="qty"><button>1</button><button>2</button></div>'))).toEqual([]);
  });
});

describe('size kinds', () => {
  it.each([
    ['MED', 'letter'],
    ['XXS', 'letter'],
    ['S/M', 'letter'],
    ['2X', 'letter'],
    ['24', 'numeric'],
    ['000', 'numeric'],
    ['8/29', 'numeric'],
    ['XXS/00', 'mixed'],
    ['20-22/2X', null],
    ['Select a size', null],
  ])('%s is %s', (label, kind) => expect(sizeKind(label)).toBe(kind));

  it('gives a list one kind only when every label agrees', () => {
    expect(listKind(['XS', 'S', 'M'])).toBe('letter');
    expect(listKind(['23', '24'])).toBe('numeric');
    expect(listKind(['XS', '0'])).toBe('mixed');
    expect(listKind([])).toBeNull();
  });

  it('treats spellings of the same size as equal', () => {
    expect(normalizeSize('MED')).toBe(normalizeSize('M'));
    expect(normalizeSize('XLG')).toBe('xl');
    expect(normalizeSize('2XL')).toBe(normalizeSize('XXL'));
  });
});

describe('matching chart sizes to page sizes', () => {
  it.each([
    ['M', ['XS', 'SML', 'MED'], ['MED']], // PacSun
    ['S/4', ['00', '0', '2', '4', '6'], ['4']], // Ann Taylor dresses
    ['00/24', ['24', '25', '26'], ['24']], // Banana Republic jeans
    ['M (7/9)', ['5', '7', '9', '11'], ['7', '9']], // Fashion Nova jeans
    ['2XS', ['2XS', 'XS'], ['2XS']], // adidas
    ['5', ['0', '2', '4', '6'], []], // Hollister's odd-numbered chart vs even sizes sold
  ])('%s on a page listing %j', (chart, page, expected) => expect(listedAs(chart, page)).toEqual(expected));

  it('drops length words and bracketed equivalents', () => {
    expect(baseSize('2 Regular')).toBe('2'); // American Eagle jeans
    expect(baseSize('00 X-Short')).toBe('00');
    expect(baseSize('XS (2-4)')).toBe('XS'); // Alo Yoga
  });
});
