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
      <ul class="filter-size"><li>S</li><li>M</li></ul>
      <div class="js-quick-shop-attribute-size"><button>SML</button><button>MED</button></div>`);
    expect(readPageSizes(doc)).toEqual([]);
  });

  it('reads a label that sits beside an empty icon', () => {
    // Shaped like Lee's size buttons (live, 2026-11-09).
    const doc = page(`<div class="attribute" data-attr-name="Size">${['XS', 'S', 'M']
      .map((s) => `<button aria-label="Select Size ${s}"><span>${s}<i class="icon"></i></span></button>`)
      .join('')}</div>`);
    expect(readPageSizes(doc)).toEqual(['XS', 'S', 'M']);
  });

  it('reads sizes inside a custom size element', () => {
    // Shaped like Lands' End (live, 2026-11-09).
    const doc = page(`<product-sizes><ul>${['XS 2-4', 'S 6-8', 'XL 18']
      .map((s) => `<li><label><span>${s}</span></label></li>`)
      .join('')}</ul></product-sizes>`);
    expect(readPageSizes(doc)).toEqual(['XS', 'S', 'XL']);
  });

  it('reads labels in any tag', () => {
    // Shaped like Ralph Lauren (live, 2026-11-09).
    const doc = page(`<ul class="attribute primarysize sizing">${['XXS', 'XS', 'S']
      .map((s) => `<li><a class="swatchanchor size"><span class="attribute-value"><bdi>${s}</bdi></span></a></li>`)
      .join('')}</ul>`);
    expect(readPageSizes(doc)).toEqual(['XXS', 'XS', 'S']);
  });

  it('lists a size once when the page repeats it in another case', () => {
    // Shaped like Stüssy (live, 2026-11-09).
    const doc = page(`<fieldset class="size-picker">${['xs', 's']
      .map((s) => `<input type="radio" value="${s}"><label>${s.toUpperCase()}</label>`)
      .join('')}</fieldset>`);
    expect(readPageSizes(doc)).toEqual(['xs', 's']);
  });

  it('groups tiles that spell their size two ways', () => {
    // Shaped like lululemon (live, 2026-11-09): each tile has a radio valued "Small" and a visible "S".
    const doc = page(`<div role="radiogroup" aria-label="Select Size">${[['XS', 'Extra Small'], ['S', 'Small'], ['M', 'Medium']]
      .map(([s, v]) => `<label class="size-tile"><input type="radio" value="${v}"><span class="size-tile-size">${s}</span></label>`)
      .join('')}</div>`);
    expect(readPageSizes(doc)).toEqual(['XS', 'S', 'M']);
  });

  it('ignores words that only contain "size", like emphasized', () => {
    // Fashion Nova's sale countdown (live, 2026-11-10).
    const doc = page(`<div class="body-lg-emphasized countdown-wrapper">${['0', '2', '1']
      .map((s) => `<span class="digit">${s}</span>`)
      .join('')}</div>`);
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
    ['1 / 6', null], // SKIMS photo carousel counter
    ['00/24', 'numeric'],
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
    ['25inch', ['24', '25', '26'], ['25']], // UNIQLO jeans
    ['000/23', ['000', '00', '0'], ['000']], // Hollister jeans
  ])('%s on a page listing %j', (chart, page, expected) => expect(listedAs(chart, page)).toEqual(expected));

  it('drops length words and bracketed equivalents', () => {
    expect(baseSize('2 Regular')).toBe('2'); // American Eagle jeans
    expect(baseSize('00 X-Short')).toBe('00');
    expect(baseSize('XS (2-4)')).toBe('XS'); // Alo Yoga
    expect(baseSize('M 10-12')).toBe('M'); // Lands' End
    expect(baseSize('XL 18')).toBe('XL');
    expect(baseSize('US 4')).toBe('4'); // Princess Polly
    expect(baseSize('AU 8')).toBe('AU 8');
    expect(baseSize('25inch')).toBe('25'); // UNIQLO jeans
  });
});
