// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrandSizeChart, FitProfile, ProductContext } from '../../types';

// Drives the popup through every state with the browser APIs
// stubbed out. The brand below is test data, not a real chart.

const chart: BrandSizeChart = {
  brandId: 'example',
  brandName: 'Example Brand',
  sourceUrl: 'https://example.com/size-chart',
  collectedOn: '2026-11-03',
  charts: {
    dresses: [
      { size: 'S', bust: { min: 33.5, max: 34.5 }, waist: { min: 26.5, max: 27.5 }, hips: { min: 36.5, max: 37.5 } },
      { size: 'M', bust: { min: 35.5, max: 36.5 }, waist: { min: 28.5, max: 29.5 }, hips: { min: 38.5, max: 39.5 } },
      { size: 'L', bust: { min: 37.5, max: 38.5 }, waist: { min: 30.5, max: 31.5 }, hips: { min: 40.5, max: 41.5 } },
    ],
  },
};
const dress: ProductContext = { brandId: 'example', category: 'dresses', productName: 'Wrap Dress', cut: 'regular', url: '' };
const measured: FitProfile = { measurements: { bust: 35.5, waist: 28, hips: 38.5 }, preferredFit: 'regular', updatedAt: '' };

let stored: FitProfile | null;
let tabUrl: string;
let product: ProductContext | null;
const saved = () => stored; // read through a function so TS does not narrow it

vi.mock('../../data', () => ({
  getChart: (id: string) => (id === 'example' ? chart : null),
  supportedCharts: [chart],
}));
vi.mock('../../adapters', () => ({ findAdapterForUrl: (url: string) => (url.includes('example.com') ? {} : null) }));
vi.mock('../../extension/messages', () => ({
  getActiveTab: async () => ({ id: 1, url: tabUrl }),
  getProductContext: async () => product,
}));
vi.mock('../../extension/storage', () => ({
  getProfile: async () => stored,
  saveProfile: async (p: FitProfile) => void (stored = p),
  clearProfile: async () => void (stored = null),
}));

async function openPopup() {
  vi.resetModules();
  document.body.innerHTML = '<main id="app"></main>';
  await import('./popup');
  await vi.waitFor(() => expect(document.querySelector('header')).not.toBeNull());
}

const state = () => document.querySelector('header')!.dataset.state;
const text = () => document.getElementById('app')!.textContent!;
const click = (label: string) => {
  const target = [...document.querySelectorAll('button')].find((b) => b.textContent === label || b.getAttribute('aria-label') === label);
  if (!target) throw new Error(`no button "${label}"`);
  target.click();
};
const input = (name: string) => document.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`)!;

beforeEach(() => {
  stored = measured;
  tabUrl = 'https://example.com/p/wrap-dress';
  product = dress;
  vi.stubGlobal('confirm', () => true);
});

describe('popup states', () => {
  it('Result: shows size, fit label, notes, and chart source', async () => {
    await openPopup();
    expect(state()).toBe('result');
    expect(document.querySelector('.size-value')!.textContent).toBe('M');
    expect(document.querySelector('.pill')!.textContent).toBe('True to size');
    expect(text()).toContain('Detected: Wrap Dress · Dresses');
    const notes = [...document.querySelectorAll('.note')].map((n) => [n.className, n.textContent]);
    expect(notes).toEqual([
      ['note ok', 'Bust fits well'],
      ['note ok', 'Waist fits well'],
      ['note ok', 'Hips fit well'],
    ]);
    expect(document.querySelector<HTMLAnchorElement>('a.button')!.href).toBe('https://example.com/size-chart');
    expect(text()).toContain("Based on Example Brand's size chart.");
    expect(document.querySelector('header')!.textContent).toContain('Profile: Regular fit');
  });

  it('Result: flags snug areas and offers the alternate size', async () => {
    stored = { measurements: { bust: 36.8, waist: 29.8, hips: 39.8 }, preferredFit: 'regular', updatedAt: '' };
    await openPopup();
    expect(document.querySelector('.size-value')!.textContent).toBe('L');
    expect(text()).toContain('M is also a close match if you want a closer fit');
    expect(document.querySelector('.note.warn')!.textContent).toBe('Bust may feel roomy');
  });

  it("Result: uses the page's spelling of the size", async () => {
    product = { ...dress, pageSizes: ['XS', 'SML', 'MED', 'LRG'] };
    await openPopup();
    expect(document.querySelector('.size-value')!.textContent).toBe('MED');
    expect(text()).toContain("M on Example Brand's size chart.");
  });

  it('Result: warns when the recommended size is not on the page', async () => {
    product = { ...dress, pageSizes: ['S', 'L'] };
    await openPopup();
    expect(document.querySelector('.size-value')!.textContent).toBe('M');
    expect(text()).toContain("M isn't listed for this item right now (S and L). It may be sold out, or this item may be sized differently from the chart.");
  });

  it("Size mismatch: doesn't show a chart size the item isn't sold in", async () => {
    product = { ...dress, pageSizes: ['2', '4', '6', '8'] };
    await openPopup();
    expect(document.querySelector('.size-value')).toBeNull();
    expect(text()).toContain("This item's sizes don't match the chart");
    expect(text()).toContain("This item comes in 2, 4, 6 and 8, but Example Brand's dresses chart uses S–L.");
    expect(document.querySelectorAll('.segmented button')).toHaveLength(3);
  });

  it("Men's or kids' item: says only women's sizing is supported", async () => {
    product = { ...dress, category: null, otherDepartment: true };
    await openPopup();
    expect(text()).toContain("Women's clothing only");
    expect(document.querySelectorAll('.segmented button')).toHaveLength(0);
  });

  it('Setup needed: creating a profile leads to a result', async () => {
    stored = null;
    await openPopup();
    expect(state()).toBe('setup_needed');

    click('Fitted');
    click('Save my profile');
    expect(text()).toContain('Add at least one of bust, waist, or hips');

    (input('bust') as HTMLInputElement).value = '35.5';
    (input('waist') as HTMLInputElement).value = '28';
    (input('hips') as HTMLInputElement).value = '38.5';
    click('Save my profile');
    await vi.waitFor(() => expect(state()).toBe('result'));
    expect(saved()?.measurements).toEqual({ bust: 35.5, waist: 28, hips: 38.5 });
    expect(saved()?.preferredFit).toBe('fitted');
  });

  it('Setup needed: an owned item alone is enough', async () => {
    stored = null;
    await openPopup();
    click('Or add an item you own instead');
    click('Save my profile');
    expect(text()).toContain('Pick a brand, type, and size for your item.');
    input('ownedBrand').value = 'example';
    input('ownedBrand').dispatchEvent(new Event('change'));
    input('ownedSize').value = 'M';
    click('Save my profile');
    await vi.waitFor(() => expect(state()).toBe('result'));
    expect(saved()?.ownedItem).toEqual({ brandId: 'example', category: 'dresses', size: 'M' });
    expect(text()).toContain('Adding your measurements gives a more accurate result.');
  });

  it('Unsupported site: lists supported brands', async () => {
    tabUrl = 'https://other-store.com/item';
    product = null;
    await openPopup();
    expect(state()).toBe('unsupported_site');
    expect(text()).toContain("doesn't work on this site");
    expect(text()).toContain('Works on');
    expect(text()).toContain('Example Brand');
  });

  it('Unsupported site: asks for a product page on a supported brand', async () => {
    product = null;
    await openPopup();
    expect(state()).toBe('unsupported_site');
    expect(text()).toContain('Open a product page on this site');
  });

  it('Choose clothing type: picking one gives a result', async () => {
    product = { ...dress, category: null };
    await openPopup();
    expect(state()).toBe('choose_category');
    click('Dresses');
    expect(state()).toBe('result');
    expect(document.querySelector('.size-value')!.textContent).toBe('M');
    click('Change');
    expect(state()).toBe('choose_category');
  });

  it('Unsupported item: the brand chart lacks the clothing type', async () => {
    product = { ...dress, category: 'jeans' };
    await openPopup();
    expect(state()).toBe('unsupported_item');
    expect(text()).toContain('Example Brand has charts for dresses.');
  });

  it('Fix profile: measurements do not cover the item', async () => {
    // Bust only, but jeans are sized by waist and hips.
    stored = { measurements: { bust: 35 }, preferredFit: 'regular', updatedAt: '' };
    chart.charts.jeans = chart.charts.dresses;
    product = { ...dress, category: 'jeans' };
    await openPopup();
    expect(state()).toBe('fix_profile');
    expect(text()).toContain('Sizing jeans uses waist and hips.');
    delete chart.charts.jeans;
  });

  it('Fix profile: owned item size no longer in the chart', async () => {
    stored = { ownedItem: { brandId: 'example', category: 'dresses', size: 'XXL' }, preferredFit: 'regular', updatedAt: '' };
    await openPopup();
    expect(state()).toBe('fix_profile');
    expect(text()).toContain("couldn't find your owned item's size");
  });

  it('Edit and delete profile', async () => {
    await openPopup();
    click('Edit profile');
    expect(state()).toBe('setup_needed');
    expect((input('bust') as HTMLInputElement).value).toBe('35.5');
    click('Delete profile');
    await vi.waitFor(() => expect(saved()).toBeNull());
    expect(text()).toContain('Create your fit profile');
  });
});
