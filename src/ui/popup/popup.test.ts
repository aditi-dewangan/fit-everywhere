// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrandSizeChart, FitProfile, ProductContext } from '../../types';

// Drives the placeholder popup through every state with the browser APIs
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
  const target = [...document.querySelectorAll('button')].find((b) => b.textContent === label);
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
  it('Result: shows size, fit label, explanation, and chart source', async () => {
    await openPopup();
    expect(state()).toBe('result');
    expect(text()).toContain('Recommended size: M');
    expect(text()).toContain('Fit: true to size');
    expect(text()).toContain('Bust, waist, and hips fit well.');
    expect(text()).toContain("Based on Example Brand's size chart.");
  });

  it('Setup needed: creating a profile leads to a result', async () => {
    stored = null;
    await openPopup();
    expect(state()).toBe('setup_needed');

    click('Save profile');
    expect(text()).toContain('Add at least one of bust, waist, or hips');

    (input('bust') as HTMLInputElement).value = '35.5';
    (input('waist') as HTMLInputElement).value = '28';
    (input('hips') as HTMLInputElement).value = '38.5';
    click('Save profile');
    await vi.waitFor(() => expect(state()).toBe('result'));
    expect(saved()?.measurements).toEqual({ bust: 35.5, waist: 28, hips: 38.5 });
  });

  it('Setup needed: an owned item alone is enough', async () => {
    stored = null;
    await openPopup();
    input('ownedBrand').value = 'example';
    input('ownedBrand').dispatchEvent(new Event('change'));
    input('ownedSize').value = 'M';
    click('Save profile');
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
    expect(text()).toContain('Recommended size: M');
  });

  it('Unsupported item: the brand chart lacks the clothing type', async () => {
    product = { ...dress, category: 'jeans' };
    await openPopup();
    expect(state()).toBe('unsupported_item');
    expect(text()).toContain('Open a product from: dresses.');
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
    expect(text()).toContain('Set up your fit profile');
  });
});
