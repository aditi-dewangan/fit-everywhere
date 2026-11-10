// Reads the size options a product page offers (its size buttons or dropdown), so the
// popup can tell when a brand's chart doesn't match how this item is sized, e.g. a
// numbered jeans chart on sweatpants sold in S, M and L. Works on any site: it looks
// for short size-like labels inside an element whose id, class, aria-label, name or
// data-testid mentions "size", and takes the first such group on the page, which is
// the main product's (recommended-product carousels come later in the page).

const LETTER_SIZE =
  /^(x{0,4}s|x{0,4}l|m|[1-6]x|[2-6]xl|[2-4]xs|sm|md|lg|sml|med|lrg|x{1,3}lg|small|medium|large|x-small|x-large|xx-small|xx-large|one size|os)$/i;
// 0-40 with optional half size, women's W, or a waist/size pair like 8/29. Also 00 and 000.
const NUMERIC_SIZE = /^(0{2,3}|\d{1,2}(\.5)?w?|\d{1,2}\/\d{2})$/i;

export type SizeKind = 'letter' | 'numeric' | 'mixed';

export function sizeKind(label: string): SizeKind | null {
  const parts = label.trim().split(/\s*\/\s*/);
  if (NUMERIC_SIZE.test(label.trim())) return 'numeric';
  const kinds = new Set(parts.map((p) => (LETTER_SIZE.test(p) ? 'letter' : NUMERIC_SIZE.test(p) ? 'numeric' : null)));
  if (kinds.has(null)) return null;
  // Number pairs other than a waist/inseam like 8/29 are counters ("1 / 6" on a photo carousel).
  if (parts.length > 1 && kinds.size === 1 && kinds.has('numeric')) return null;
  return kinds.size === 1 ? [...kinds][0]! : 'mixed';
}

/** One kind for a whole list of labels: 'mixed' unless every label is the same kind. */
export function listKind(labels: string[]): SizeKind | null {
  const kinds = new Set(labels.map(sizeKind));
  if (!labels.length || kinds.has(null)) return null;
  return kinds.size === 1 ? [...kinds][0]! : 'mixed';
}

const SPELLINGS: Record<string, string> = {
  sml: 's', small: 's', med: 'm', medium: 'm', lrg: 'l', large: 'l', xlg: 'xl', xxlg: 'xxl', xxxlg: 'xxxl',
  'x-small': 'xs', 'xx-small': 'xxs', 'x-large': 'xl', 'xx-large': 'xxl', '2xl': 'xxl', '3xl': 'xxxl', '2xs': 'xxs', '3xs': 'xxxs',
  sm: 's', md: 'm', lg: 'l',
};

// UNIQLO writes waist sizes as "25inch", on its pages and its chart.
const INCH = /\s*(inch|")$/i;

/** "MED" and "M" compare equal, as do "XLG" and "XL", and "25inch" and "25". */
export function normalizeSize(label: string): string {
  const lower = label.trim().toLowerCase().replace(INCH, '');
  return SPELLINGS[lower] ?? lower;
}

/**
 * The page's labels for a chart size. Chart labels often combine systems ("S/4", "00/24",
 * "M (7/9)", "4-6/27-28"), and a page lists just one of them, so any part can match.
 */
export function listedAs(chartSize: string, pageSizes: string[]): string[] {
  if (pageSizes.includes(chartSize)) return [chartSize];
  const parts = [chartSize, ...chartSize.split(/[/()-]|\s+/)].map(normalizeSize).filter(Boolean);
  return pageSizes.filter((label) => parts.includes(normalizeSize(label)));
}

// "size" starting or ending a word ("size-1", "sku-size", "selectSize"), not inside one:
// Fashion Nova's sale countdown has the class "body-lg-emphasized".
const SIZE_ATTR = /(?<![a-z])size|size(?![a-z])/i;
// Attributes that can mention "size" without marking a size picker (image URLs, inline styles).
const IGNORED_ATTRS = new Set(['href', 'src', 'srcset', 'style', 'content']);
// Size guides, filters on listing pages, fit widgets and quick-shop panels on recommended
// products also say "size" but aren't this product's options.
const NOT_OPTIONS = /guide|chart|filter|refine|facet|fit-?finder|recommend|quick-?shop/i;

function mentionsSize(el: Element): boolean {
  // Some sites use a custom element instead, like Lands' End's <product-sizes>.
  if (el.localName.includes('-') && SIZE_ATTR.test(el.localName)) return true;
  return [...el.attributes].some(
    (a) => !IGNORED_ATTRS.has(a.name) && (SIZE_ATTR.test(a.name) || (a.value.length <= 80 && SIZE_ATTR.test(a.value))),
  );
}

const textOf = (el: Element) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '';

// Length variants share one body size: "2 Regular" and "2 Long" are both a 2.
const LENGTH_WORD = /\s+(x-?short|short|regular|reg|long|x-?long|tall|petite)$/i;

// A letter size followed by its number equivalent, as Lands' End writes "XS 2-4" and "XL 18".
const LETTER_THEN_NUMBERS = /^(\S+)\s+\d{1,2}(-\d{1,2})?$/;

/** The size without a length word or an equivalent: Alo's "XS (2-4)" and Lands' End's "XS 2-4" are XS. */
export function baseSize(label: string): string {
  // Princess Polly writes "US 4". Other countries' prefixes stay: AU and UK numbers are different sizes.
  const size = label.replace(/^US\s+/i, '').replace(/\s*\([^)]*\)$/, '').replace(LENGTH_WORD, '').replace(INCH, '').trim();
  const letter = LETTER_THEN_NUMBERS.exec(size)?.[1];
  return letter && LETTER_SIZE.test(letter) ? letter : size;
}

function excluded(el: Element): boolean {
  for (let p: Element | null = el; p; p = p.parentElement) {
    if (p.matches('table, [role="dialog"], dialog, nav, footer')) return true;
    if (NOT_OPTIONS.test(`${p.id} ${p.getAttribute('class') ?? ''}`)) return true;
  }
  return false;
}

function labelOf(el: Element): string {
  return baseSize(textOf(el) || el.getAttribute('value')?.trim() || el.getAttribute('aria-label')?.trim() || '');
}

/** The sizes the main product is offered in, in page order. Empty if none were found. */
export function readPageSizes(doc: Document): string[] {
  // Every size-like label, with the size-marked elements around it, innermost first.
  const found: { label: string; marked: Element[] }[] = [];
  // Any element can hold the label (Ralph Lauren uses <bdi>); only non-content tags are skipped.
  for (const el of doc.querySelectorAll('body *:not(script, style, noscript, template)')) {
    if (el.matches('input:not([type="radio"])')) continue;
    // A radio inside a visible label is read from that label's text instead (lululemon's
    // radios are valued "Small" beside a visible "S").
    if (el.matches('input') && textOf(el.closest('label') ?? el)) continue;
    // The innermost element holding the text; an empty icon beside it (Lee) doesn't count.
    if ([...el.children].some((child) => textOf(child))) continue;
    const label = labelOf(el);
    if (label.length > 12 || !sizeKind(label) || excluded(el)) continue;
    const marked: Element[] = [];
    // Shopify themes mark the radio or option itself (name="Size"), so its parent is the picker.
    if (el.matches('input, option') && mentionsSize(el) && el.parentElement) marked.push(el.parentElement);
    for (let p = el.parentElement; p; p = p.parentElement) if (mentionsSize(p) && !marked.includes(p)) marked.push(p);
    if (marked.length) found.push({ label, marked });
  }
  const labelsIn = new Map<Element, Set<string>>();
  for (const { label, marked } of found) {
    // Spellings of one size count once: a lululemon tile holds "S" and a radio valued "Small".
    for (const p of marked) labelsIn.set(p, (labelsIn.get(p) ?? new Set()).add(normalizeSize(label)));
  }
  // Each label belongs to the innermost marked element holding at least two sizes. Sites mark
  // the picker (PacSun's #size-1), and some also mark each option (adidas's "Size: XS" buttons).
  // The first such picker on the page is the main product's.
  const groups = new Map<Element, string[]>();
  for (const { label, marked } of found) {
    const picker = marked.find((p) => labelsIn.get(p)!.size >= 2);
    if (!picker) continue;
    const group = groups.get(picker) ?? [];
    // Stüssy repeats each size in lower case ("xs" beside "XS").
    if (!group.some((l) => l.toLowerCase() === label.toLowerCase())) group.push(label);
    groups.set(picker, group);
  }
  return groups.values().next().value ?? [];
}
