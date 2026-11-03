// Placeholder popup. It exercises every state in the spec so the full flow can
// be tested; the final design from Anya and Heesu replaces this file and
// popup.css, and only needs the functions imported below.

import './popup.css';
import { findAdapterForUrl } from '../../adapters';
import { getChart, supportedCharts } from '../../data';
import { CATEGORY_WEIGHTS } from '../../engine/config';
import { FIT_LABEL_TEXT, isProfileComplete, recommend } from '../../engine';
import { getActiveTab, getProductContext } from '../../extension/messages';
import { clearProfile, getProfile, saveProfile } from '../../extension/storage';
import { CATEGORIES, DIMENSIONS, PREFERRED_FITS } from '../../types';
import type { Category, FitProfile, ProductContext, RecommendResponse } from '../../types';
import { popupStateFor } from './state';

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

function currentResponse(): RecommendResponse {
  const product = page.product && chosenCategory ? { ...page.product, category: chosenCategory } : page.product;
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
  const body = (() => {
    switch (state) {
      case 'setup_needed':
        return profileForm(page.profile ? 'Edit your fit profile' : 'Set up your fit profile');
      case 'fix_profile':
        return [fixProfileMessage(response), profileForm('Update your fit profile')];
      case 'unsupported_site':
        return unsupportedSite();
      case 'choose_category':
        return chooseCategory('What kind of item is this?');
      case 'unsupported_item':
        return unsupportedItem();
      case 'result':
        return result(response);
    }
  })();
  app.replaceChildren(header(state), ...[body].flat().filter((n): n is HTMLElement => n !== null));
}

function header(state: string) {
  const actions: Node[] = [];
  if (page.profile && !editingProfile && state !== 'setup_needed') {
    actions.push(button('Edit profile', () => ((editingProfile = true), render()), 'link'));
  }
  return h('header', { 'data-state': state }, [h('h1', {}, ['Fit Everywhere']), ...actions]);
}

// ---- States ----

function result(response: RecommendResponse) {
  if (!response.ok) return [];
  const r = response.result;
  const chart = page.product ? getChart(page.product.brandId) : null;
  return h('section', { class: 'result' }, [
    page.product?.productName ? h('p', { class: 'muted' }, [page.product.productName]) : null,
    h('p', { class: 'size' }, ['Recommended size: ', h('strong', {}, [r.recommendedSize])]),
    h('p', {}, [`Fit: ${FIT_LABEL_TEXT[r.fitLabel]}`]),
    h('p', {}, [r.explanation]),
    r.alternateSize ? h('p', {}, [`Between sizes: ${r.recommendedSize} or ${r.alternateSize}.`]) : null,
    chart ? h('p', { class: 'muted' }, [`Based on ${chart.brandName}'s size chart.`]) : null,
    chart?.notes ? h('p', { class: 'muted' }, [chart.notes]) : null,
    chosenCategory ? button('Change clothing type', () => ((chosenCategory = null), render()), 'link') : null,
  ]);
}

function unsupportedSite() {
  if (page.onSupportedSite) {
    return h('section', {}, [h('p', {}, ['Open a product page on this site to get a size.'])]);
  }
  return h('section', {}, [
    h('p', {}, ["Fit Everywhere doesn't work on this site."]),
    supportedCharts.length
      ? h('div', {}, [
          h('p', {}, ['Supported brands:']),
          h('ul', {}, supportedCharts.map((c) => h('li', {}, [c.brandName]))),
        ])
      : h('p', { class: 'muted' }, ['No brands are supported yet.']),
  ]);
}

function chooseCategory(prompt: string) {
  return h('section', {}, [
    h('p', {}, [prompt]),
    h(
      'div',
      { class: 'row' },
      CATEGORIES.map((c) => button(capitalize(c), () => ((chosenCategory = c), render()))),
    ),
  ]);
}

function unsupportedItem() {
  const chart = page.product ? getChart(page.product.brandId) : null;
  const available = chart ? CATEGORIES.filter((c) => chart.charts[c]) : [];
  return h('section', {}, [
    h('p', {}, [`We don't have ${chart?.brandName ?? 'this brand'}'s size chart for this item.`]),
    available.length ? h('p', {}, [`Open a product from: ${available.join(', ')}.`]) : null,
    chooseCategory('Wrong clothing type? Pick another:'),
  ]);
}

function fixProfileMessage(response: RecommendResponse) {
  if (response.ok) return null;
  const category = chosenCategory ?? page.product?.category;
  if (response.error === 'NO_USABLE_MEASUREMENTS' && category) {
    const needed = DIMENSIONS.filter((d) => CATEGORY_WEIGHTS[category][d] > 0);
    return h('p', { class: 'notice' }, [`Sizing ${category} uses ${needed.join(' and ')}. Add at least one to get a size.`]);
  }
  return h('p', { class: 'notice' }, [
    "We couldn't find your owned item's size in that brand's chart. Pick it again or add measurements.",
  ]);
}

// ---- Profile form ----

function profileForm(title: string) {
  const existing = page.profile;
  const m = existing?.measurements ?? {};
  const owned = existing?.ownedItem;
  const error = h('p', { class: 'error', role: 'alert' }, []);

  const fit = h(
    'select',
    { name: 'preferredFit' },
    PREFERRED_FITS.map((f) => option(f, capitalize(f), (existing?.preferredFit ?? 'regular') === f)),
  ) as HTMLSelectElement;

  const numberInput = (name: string, value?: number) =>
    h('input', { type: 'number', name, min: '1', step: '0.25', inputmode: 'decimal', value: value?.toString() ?? '' }) as HTMLInputElement;
  const inputs = {
    bust: numberInput('bust', m.bust),
    waist: numberInput('waist', m.waist),
    hips: numberInput('hips', m.hips),
    height: numberInput('height', m.height),
  };

  // Owned item pickers only offer supported brands and the sizes in their charts.
  const brandSelect = h('select', { name: 'ownedBrand' }, [
    option('', 'None'),
    ...supportedCharts.map((c) => option(c.brandId, c.brandName, owned?.brandId === c.brandId)),
  ]) as HTMLSelectElement;
  const categorySelect = h('select', { name: 'ownedCategory' }, []) as HTMLSelectElement;
  const sizeSelect = h('select', { name: 'ownedSize' }, []) as HTMLSelectElement;
  const productInput = h('input', { type: 'text', name: 'ownedName', placeholder: 'e.g. 501 jeans', value: owned?.productName ?? '' }) as HTMLInputElement;

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

  const save = async () => {
    const measurements = Object.fromEntries(
      Object.entries(inputs)
        .map(([k, input]) => [k, input.valueAsNumber] as const)
        .filter(([, v]) => Number.isFinite(v) && v > 0),
    );
    const profile: FitProfile = {
      preferredFit: fit.value as FitProfile['preferredFit'],
      updatedAt: new Date().toISOString(),
    };
    if (Object.keys(measurements).length) profile.measurements = measurements;
    if (brandSelect.value && sizeSelect.value) {
      profile.ownedItem = {
        brandId: brandSelect.value,
        category: categorySelect.value as Category,
        size: sizeSelect.value,
        ...(productInput.value.trim() ? { productName: productInput.value.trim() } : {}),
      };
    }
    if (!isProfileComplete(profile, supportedCharts.map((c) => c.brandId))) {
      error.textContent = 'Add at least one of bust, waist, or hips, or pick an item you own.';
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
    h('h2', {}, [title]),
    field('Preferred fit', fit),
    h('fieldset', {}, [
      h('legend', {}, ['Your measurements (inches)']),
      field('Bust', inputs.bust),
      field('Waist', inputs.waist),
      field('Hips', inputs.hips),
      field('Height (optional)', inputs.height),
    ]),
    h('fieldset', {}, [
      h('legend', {}, ['Or: an item you own that fits well']),
      supportedCharts.length
        ? h('div', {}, [field('Brand', brandSelect), field('Type', categorySelect), field('Size', sizeSelect), field('Item name (optional)', productInput)])
        : h('p', { class: 'muted' }, ['Available once brands are added.']),
    ]),
    h('p', { class: 'muted' }, ['Your profile stays on this device.']),
    error,
    h('div', { class: 'row' }, [
      h('button', { type: 'submit' }, ['Save profile']),
      editingProfile ? button('Cancel', () => ((editingProfile = false), render())) : null,
      existing ? button('Delete profile', () => void remove(), 'danger') : null,
    ]),
  ]);
}

// ---- Tiny DOM helpers ----

type Child = Node | string | null | undefined;

function h(tag: string, props: Record<string, unknown>, children: Child[] = []): HTMLElement {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value as EventListener);
    else if (key === 'value') (el as HTMLInputElement).value = String(value);
    else el.setAttribute(key, String(value));
  }
  for (const child of children) if (child != null) el.append(child);
  return el;
}

function button(label: string, onClick: () => void, variant?: string) {
  return h('button', { type: 'button', onclick: onClick, ...(variant ? { class: variant } : {}) }, [label]);
}

function option(value: string, label: string, selected = false) {
  const el = h('option', { value }, [label]) as HTMLOptionElement;
  el.selected = selected;
  return el;
}

function field(label: string, control: HTMLElement) {
  return h('label', {}, [h('span', {}, [label]), control]);
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

void load();
