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

/** "MED" and "M" compare equal, as do "XLG" and "XL". */
export function normalizeSize(label: string): string {
  const lower = label.trim().toLowerCase();
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

const SIZE_ATTR = /size/i;
// Attributes that can mention "size" without marking a size picker (image URLs, inline styles).
const IGNORED_ATTRS = new Set(['href', 'src', 'srcset', 'style', 'content']);
// Size guides, filters on listing pages and fit widgets also say "size" but aren't the options.
const NOT_OPTIONS = /guide|chart|filter|refine|facet|fit-?finder|recommend/i;

function mentionsSize(el: Element): boolean {
  return [...el.attributes].some(
    (a) => !IGNORED_ATTRS.has(a.name) && (SIZE_ATTR.test(a.name) || (a.value.length <= 80 && SIZE_ATTR.test(a.value))),
  );
}

const textOf = (el: Element) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '';

// Length variants share one body size: "2 Regular" and "2 Long" are both a 2.
const LENGTH_WORD = /\s+(x-?short|short|regular|reg|long|x-?long|tall|petite)$/i;

/** The size without a length word or a bracketed equivalent: Alo's "XS (2-4)" is an XS. */
export const baseSize = (label: string) => label.replace(/\s*\([^)]*\)$/, '').replace(LENGTH_WORD, '').trim();

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
  for (const el of doc.querySelectorAll('button, label, option, li, a, span, div, input[type="radio"]')) {
    if (el.children.length) continue;
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
    for (const p of marked) labelsIn.set(p, (labelsIn.get(p) ?? new Set()).add(label));
  }
  // Each label belongs to the innermost marked element holding at least two sizes. Sites mark
  // the picker (PacSun's #size-1), and some also mark each option (adidas's "Size: XS" buttons).
  // The first such picker on the page is the main product's.
  const groups = new Map<Element, string[]>();
  for (const { label, marked } of found) {
    const picker = marked.find((p) => labelsIn.get(p)!.size >= 2);
    if (!picker) continue;
    const group = groups.get(picker) ?? [];
    if (!group.includes(label)) group.push(label);
    groups.set(picker, group);
  }
  return groups.values().next().value ?? [];
}
