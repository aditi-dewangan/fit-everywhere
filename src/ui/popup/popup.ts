// Popup UI, following the design from Anya and Heesu (Canva, "Fit Everywhere -
// Project Sprints", page 2). It renders every state in state.ts and only needs
// the functions imported below.

import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import './popup.css';
import { findAdapterForUrl } from '../../adapters';
import { listKind, listedAs } from '../../adapters/page-sizes';
import { getChart, supportedCharts } from '../../data';
import { CATEGORY_WEIGHTS } from '../../engine/config';
import { FIT_LABEL_TEXT, isProfileComplete, recommend } from '../../engine';
import { NOTE_FITS } from '../../engine/explanation';
import { getActiveTab, getProductContext } from '../../extension/messages';
import { clearProfile, getProfile, saveProfile } from '../../extension/storage';
import { CATEGORIES, DIMENSIONS, PREFERRED_FITS } from '../../types';
import type { Category, FitLabel, FitProfile, PreferredFit, ProductContext, RecommendResponse } from '../../types';
import { popupStateFor } from './state';
import type { PopupState } from './state';

interface PageInfo {
  profile: FitProfile | null;
  product: ProductContext | null;
  /** The tab is on a supported brand's site, even if it isn't a product page. */
  onSupportedSite: boolean;
}

const app = document.getElementById('app')!;
let page: PageInfo = { profile: null, product: null, onSupportedSite: false };
let chosenCategory: Category | null = null;
let editingProfile = false;

async function load() {
  const [profile, tab] = await Promise.all([getProfile(), getActiveTab()]);
  const product = tab ? await getProductContext(tab.id) : null;
  page = { profile, product, onSupportedSite: !!tab && !!findAdapterForUrl(tab.url) };
  render();
}

function currentProduct(): ProductContext | null {
  return page.product && chosenCategory ? { ...page.product, category: chosenCategory } : page.product;
}

function currentResponse(): RecommendResponse {
  const product = currentProduct();
  return recommend({
    profile: page.profile,
    product,
    chart: product ? getChart(product.brandId) : null,
    ownedItemChart: page.profile?.ownedItem ? getChart(page.profile.ownedItem.brandId) : null,
  });
}

function render() {
  const response = currentResponse();
  const state = editingProfile ? 'setup_needed' : popupStateFor(response);
  const productState = state === 'choose_category' || state === 'unsupported_item' || state === 'result';
  const body = (() => {
    if (productState && page.product?.otherDepartment) return otherDepartment();
    if (state === 'result' && sizesMismatch()) return sizeMismatch();
    switch (state) {
      case 'setup_needed':
        return profileForm();
      case 'fix_profile':
        return [fixProfileMessage(response), profileForm()];
      case 'unsupported_site':
        return unsupportedSite();
      case 'choose_category':
        return chooseCategory();
      case 'unsupported_item':
        return unsupportedItem();
      case 'result':
        return result(response);
    }
  })();
  app.replaceChildren(header(state), ...[body].flat().filter((n): n is HTMLElement => n !== null));
}

function header(state: PopupState) {
  const profile = page.profile;
  const showEdit = profile && !editingProfile && state !== 'setup_needed' && state !== 'fix_profile';
  return h('header', { 'data-state': state }, [
    h('h1', { class: 'wordmark' }, ['Fit Everywhere']),
    showEdit
      ? button(`Profile: ${capitalize(profile.preferredFit)} fit`, () => ((editingProfile = true), render()), 'profile-link', {
          'aria-label': 'Edit profile',
          title: 'Edit profile',
        })
      : null,
  ]);
}

// ---- States ----

function result(response: RecommendResponse) {
  if (!response.ok) return [];
  const r = response.result;
  const product = currentProduct()!;
  const chart = getChart(product.brandId);
  const rows = chart?.charts[product.category!] ?? [];
  const sizeIndex = (size?: string) => rows.findIndex((row) => row.size === size);
  const recommended = asListed(r.recommendedSize);

  const notes: HTMLElement[] = [];
  for (const dim of DIMENSIONS) {
    const note = r.dimensionNotes[dim];
    // "Hips fit well", not "Hips fits well".
    const text = dim === 'hips' && note === NOTE_FITS ? 'fit well' : note;
    if (note) notes.push(noteItem(note === NOTE_FITS ? 'ok' : 'warn', `${capitalize(dim)} ${text}`));
  }
  if (r.dimensionNotes.length) notes.push(noteItem('warn', `Length ${r.dimensionNotes.length} for your height`));
  const listed = product.pageSizes ?? [];
  if (listed.length && !listedAs(r.recommendedSize, listed).length) {
    notes.push(
      noteItem('warn', `${r.recommendedSize} isn't listed for this item right now (${joinList(listed)}). It may be sold out, or this item may be sized differently from the chart.`),
    );
  }
  if (r.alternateSize) {
    const why = sizeIndex(r.alternateSize) > sizeIndex(r.recommendedSize) ? 'if you want more room' : 'if you want a closer fit';
    notes.push(noteItem('info', `${asListed(r.alternateSize)} is also a close match ${why}`));
  }

  return h('section', { class: 'result' }, [
    detected(product),
    h('p', { class: 'eyebrow' }, ['Recommended size']),
    h('div', { class: 'size-row' }, [
      h('span', { class: 'size-value' }, [recommended]),
      h('span', { class: 'pill', 'data-label': r.fitLabel }, [capitalize(FIT_LABEL_TEXT[r.fitLabel])]),
    ]),
    fitScale(r.fitLabel),
    recommended !== r.recommendedSize ? h('p', { class: 'muted' }, [`${r.recommendedSize} on ${chart?.brandName ?? 'the brand'}'s size chart.`]) : null,
    notes.length ? h('ul', { class: 'notes' }, notes) : null,
    r.profileSource === 'owned_item'
      ? h('p', { class: 'muted' }, ['Based on an item you own. Adding your measurements gives a more accurate result.'])
      : null,
    chart
      ? h('a', { class: 'button secondary', href: chart.sourceUrl, target: '_blank', rel: 'noopener noreferrer' }, ['See size chart'])
      : null,
    chart ? h('p', { class: 'muted' }, [`Based on ${chart.brandName}'s size chart.`]) : null,
  ]);
}

/** The chart's size as this page spells it ("MED" for "M", "4" for "S/4"), or unchanged if that isn't one label. */
function asListed(size: string): string {
  const matches = listedAs(size, currentProduct()?.pageSizes ?? []);
  return matches.length === 1 ? matches[0]! : size;
}

/** The page sells this item in letter sizes and the chart uses numbers, or the other way round. */
function sizesMismatch(): boolean {
  const product = currentProduct();
  const pageKind = listKind(product?.pageSizes ?? []);
  const rows = product?.category ? (getChart(product.brandId)?.charts[product.category] ?? []) : [];
  const chartKind = listKind(rows.map((row) => row.size));
  return !!pageKind && !!chartKind && pageKind !== 'mixed' && chartKind !== 'mixed' && pageKind !== chartKind;
}

function sizeMismatch() {
  const product = currentProduct()!;
  const chart = getChart(product.brandId)!;
  const rows = chart.charts[product.category!]!;
  return h('section', { class: 'message' }, [
    detected(product),
    h('h2', {}, ["This item's sizes don't match the chart"]),
    h('p', {}, [
      `This item comes in ${joinList(product.pageSizes!)}, but ${chart.brandName}'s ${product.category} chart uses ${rows[0]!.size}–${rows.at(-1)!.size}.`,
    ]),
    h('p', { class: 'muted' }, ['Wrong clothing type? Pick another:']),
    categoryButtons(),
  ]);
}

function otherDepartment() {
  const product = page.product;
  return h('section', { class: 'message' }, [
    product?.productName ? h('p', { class: 'detected' }, ['Detected: ', h('strong', {}, [product.productName])]) : null,
    h('h2', {}, ["Women's clothing only"]),
    h('p', {}, ["This looks like a men's or kids' item. Fit Everywhere only has women's size charts, so it can't recommend a size here."]),
  ]);
}

function detected(product: ProductContext) {
  const parts: (Node | string)[] = ['Detected: '];
  if (product.productName) parts.push(h('strong', {}, [product.productName]), ' · ');
  parts.push(product.category ? capitalize(product.category) : 'Clothing type unknown');
  if (chosenCategory) parts.push(' ', button('Change', () => ((chosenCategory = null), render()), 'link'));
  return h('p', { class: 'detected' }, parts);
}

// Where the marker sits on the "Runs small → Oversized" bar for each label.
const SCALE_POSITION: Record<FitLabel, number> = { small: 8, true_to_size: 50, slightly_oversized: 70, oversized: 92 };

function fitScale(label: FitLabel) {
  return h('div', { class: 'scale', role: 'img', 'aria-label': `Fit: ${FIT_LABEL_TEXT[label]}` }, [
    h('div', { class: 'scale-labels', 'aria-hidden': 'true' }, [h('span', {}, ['Runs small']), h('span', {}, ['True to size']), h('span', {}, ['Oversized'])]),
    h('div', { class: 'scale-track', 'aria-hidden': 'true' }, [h('span', { class: 'scale-marker', style: `left: ${SCALE_POSITION[label]}%` })]),
  ]);
}

const ICONS = {
  ok: '<svg viewBox="0 0 20 20" width="18" height="18"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warn: '<svg viewBox="0 0 20 20" width="18" height="18"><path d="M10 3L2 17h16L10 3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 8v4.5M10 14.6v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  info: '<svg viewBox="0 0 20 20" width="18" height="18"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 9v5M10 6.2v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

function noteItem(kind: keyof typeof ICONS, text: string) {
  const icon = h('span', { class: 'note-icon', 'aria-hidden': 'true' });
  icon.innerHTML = ICONS[kind];
  return h('li', { class: `note ${kind}` }, [icon, h('span', {}, [text])]);
}

function unsupportedSite() {
  if (page.onSupportedSite) {
    return h('section', { class: 'message' }, [
      h('h2', {}, ['Open a product page']),
      h('p', {}, ['Open a product page on this site to get a size.']),
    ]);
  }
  return h('section', { class: 'message' }, [
    h('h2', {}, ['Not available here']),
    h('p', {}, ["Fit Everywhere doesn't work on this site yet."]),
    supportedCharts.length
      ? h('div', {}, [
          h('p', { class: 'eyebrow' }, ['Works on']),
          h('ul', { class: 'chips' }, supportedCharts.map((c) => h('li', {}, [c.brandName]))),
        ])
      : h('p', { class: 'muted' }, ['No brands are supported yet.']),
  ]);
}

function categoryButtons() {
  return h(
    'div',
    { class: 'segmented' },
    CATEGORIES.map((c) => button(capitalize(c), () => ((chosenCategory = c), render()))),
  );
}

function chooseCategory() {
  const product = page.product;
  return h('section', { class: 'message' }, [
    product?.productName ? h('p', { class: 'detected' }, ['Detected: ', h('strong', {}, [product.productName])]) : null,
    h('h2', {}, ['What kind of item is this?']),
    categoryButtons(),
  ]);
}

function unsupportedItem() {
  const chart = page.product ? getChart(page.product.brandId) : null;
  const available = chart ? CATEGORIES.filter((c) => chart.charts[c]) : [];
  return h('section', { class: 'message' }, [
    h('h2', {}, ['No size chart for this item']),
    h('p', {}, [`We don't have ${chart?.brandName ?? 'this brand'}'s size chart for this item.`]),
    available.length ? h('p', {}, [`${chart!.brandName} has charts for ${joinList(available)}.`]) : null,
    h('p', { class: 'muted' }, ['Wrong clothing type? Pick another:']),
    categoryButtons(),
  ]);
}

function fixProfileMessage(response: RecommendResponse) {
  if (response.ok) return null;
  const category = chosenCategory ?? page.product?.category;
  if (response.error === 'NO_USABLE_MEASUREMENTS' && category) {
    const needed = DIMENSIONS.filter((d) => CATEGORY_WEIGHTS[category][d] > 0);
    return h('p', { class: 'notice', role: 'status' }, [`Sizing ${category} uses ${needed.join(' and ')}. Add at least one to get a size.`]);
  }
  return h('p', { class: 'notice', role: 'status' }, [
    "We couldn't find your owned item's size in that brand's chart. Pick it again or add measurements.",
  ]);
}

// ---- Profile form ----

function profileForm() {
  const existing = page.profile;
  const m = existing?.measurements ?? {};
  const owned = existing?.ownedItem;
  const error = h('p', { class: 'error', role: 'alert' }, []);

  // Only the visible mode is saved: measurements, or an owned item (plus height).
  let mode: 'measurements' | 'owned' =
    existing && !DIMENSIONS.some((d) => m[d] !== undefined) && owned ? 'owned' : 'measurements';
  let preferredFit: PreferredFit = existing?.preferredFit ?? 'regular';

  const numberInput = (name: string, value?: number, placeholder = '') =>
    h('input', { type: 'number', name, id: name, min: '1', step: '0.25', inputmode: 'decimal', placeholder, value: value?.toString() ?? '' }) as HTMLInputElement;
  const inputs = {
    bust: numberInput('bust', m.bust),
    waist: numberInput('waist', m.waist),
    hips: numberInput('hips', m.hips),
    height: numberInput('height', m.height, 'Optional'),
  };
  const ownedHeight = numberInput('ownedHeight', m.height, 'Optional');

  // Owned item pickers only offer supported brands and the sizes in their charts.
  const brandSelect = h('select', { name: 'ownedBrand', id: 'ownedBrand' }, [
    option('', 'Choose a brand'),
    ...supportedCharts.map((c) => option(c.brandId, c.brandName, owned?.brandId === c.brandId)),
  ]) as HTMLSelectElement;
  const categorySelect = h('select', { name: 'ownedCategory', id: 'ownedCategory' }, []) as HTMLSelectElement;
  const sizeSelect = h('select', { name: 'ownedSize', id: 'ownedSize' }, []) as HTMLSelectElement;
  const productInput = h('input', { type: 'text', name: 'ownedName', id: 'ownedName', placeholder: 'e.g. 90s straight jeans', value: owned?.productName ?? '' }) as HTMLInputElement;

  const fillCategories = () => {
    const chart = getChart(brandSelect.value);
    const cats = chart ? CATEGORIES.filter((c) => chart.charts[c]) : [];
    categorySelect.replaceChildren(...cats.map((c) => option(c, capitalize(c), owned?.category === c)));
    fillSizes();
  };
  const fillSizes = () => {
    const rows = getChart(brandSelect.value)?.charts[categorySelect.value as Category] ?? [];
    sizeSelect.replaceChildren(...rows.map((r) => option(r.size, r.size, owned?.size === r.size)));
  };
  brandSelect.addEventListener('change', fillCategories);
  categorySelect.addEventListener('change', fillSizes);
  fillCategories();

  const measurementSection = h('div', { class: 'grid' }, [
    field('Bust (in)', inputs.bust),
    field('Waist (in)', inputs.waist),
    field('Hips (in)', inputs.hips),
    field('Height (in)', inputs.height),
  ]);
  const ownedSection = h('div', { class: 'grid' }, [
    h('p', { class: 'muted span-2' }, ['Pick something you own from a supported brand that fits you well.']),
    field('Brand', brandSelect),
    field('Type', categorySelect),
    field('Size', sizeSelect),
    field('Height (in)', ownedHeight),
    field('Item name (optional)', productInput, 'span-2'),
  ]);

  const fitButtons = PREFERRED_FITS.map((f) =>
    button(capitalize(f), () => {
      preferredFit = f;
      syncFit();
    }, undefined, { role: 'radio', 'data-fit': f }),
  );
  const syncFit = () => fitButtons.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.fit === preferredFit)));
  syncFit();

  const modeToggle = button('', () => {
    mode = mode === 'measurements' ? 'owned' : 'measurements';
    syncMode();
  }, 'link');
  const syncMode = () => {
    measurementSection.hidden = mode !== 'measurements';
    ownedSection.hidden = mode !== 'owned';
    modeToggle.textContent = mode === 'measurements' ? 'Or add an item you own instead' : 'Use my measurements instead';
    error.textContent = '';
  };
  syncMode();

  const save = async () => {
    const values = mode === 'measurements' ? Object.entries(inputs) : [['height', ownedHeight] as const];
    const measurements = Object.fromEntries(
      values.map(([k, input]) => [k, input.valueAsNumber] as const).filter(([, v]) => Number.isFinite(v) && v > 0),
    );
    const profile: FitProfile = { preferredFit, updatedAt: new Date().toISOString() };
    if (Object.keys(measurements).length) profile.measurements = measurements;
    if (mode === 'owned' && brandSelect.value && sizeSelect.value) {
      profile.ownedItem = {
        brandId: brandSelect.value,
        category: categorySelect.value as Category,
        size: sizeSelect.value,
        ...(productInput.value.trim() ? { productName: productInput.value.trim() } : {}),
      };
    }
    if (!isProfileComplete(profile, supportedCharts.map((c) => c.brandId))) {
      error.textContent =
        mode === 'measurements' ? 'Add at least one of bust, waist, or hips.' : 'Pick a brand, type, and size for your item.';
      return;
    }
    await saveProfile(profile);
    page.profile = profile;
    editingProfile = false;
    render();
  };

  const remove = async () => {
    if (!confirm('Delete your fit profile from this device?')) return;
    await clearProfile();
    page.profile = null;
    editingProfile = false;
    render();
  };

  return h('form', { class: 'profile', onsubmit: (e: Event) => (e.preventDefault(), void save()) }, [
    h('h2', {}, [existing ? 'Your fit profile' : 'Create your fit profile']),
    h('p', { class: 'subtitle' }, ['Takes about a minute. You can edit it anytime.']),
    measurementSection,
    ownedSection,
    h('div', { class: 'field' }, [
      h('span', { class: 'label', id: 'fit-label' }, ['Preferred fit']),
      h('div', { class: 'segmented', role: 'radiogroup', 'aria-labelledby': 'fit-label' }, fitButtons),
    ]),
    modeToggle,
    error,
    h('button', { type: 'submit', class: 'button primary' }, ['Save my profile']),
    h('div', { class: 'form-footer' }, [
      h('span', { class: 'muted' }, ['Your profile stays on this device.']),
      editingProfile ? button('Cancel', () => ((editingProfile = false), render()), 'link') : null,
      existing ? button('Delete profile', () => void remove(), 'link danger') : null,
    ]),
  ]);
}

// ---- Tiny DOM helpers ----

type Child = Node | string | null | undefined;

function h(tag: string, props: Record<string, unknown> = {}, children: Child[] = []): HTMLElement {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value as EventListener);
    else if (key === 'value') (el as HTMLInputElement).value = String(value);
    else el.setAttribute(key, String(value));
  }
  for (const child of children) if (child != null) el.append(child);
  return el;
}

function button(label: string, onClick: () => void, variant?: string, attrs: Record<string, string> = {}) {
  return h('button', { type: 'button', onclick: onClick, ...(variant ? { class: variant } : {}), ...attrs }, [label]);
}

function option(value: string, label: string, selected = false) {
  const el = h('option', { value }, [label]) as HTMLOptionElement;
  el.selected = selected;
  return el;
}

function field(label: string, control: HTMLElement, extraClass = '') {
  return h('div', { class: `field ${extraClass}`.trim() }, [h('label', { for: control.id }, [label]), control]);
}

const joinList = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

void load();
