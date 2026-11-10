import type { Category, Cut } from '../types';

// Shared helpers for brand adapters. Brand files should prefer these and only
// add brand-specific selectors where a site needs them.

type JsonLdNode = Record<string, unknown>;

/** Every JSON-LD object on the page, with @graph and arrays flattened. */
export function readJsonLd(doc: Document): JsonLdNode[] {
  const nodes: JsonLdNode[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== 'object') return;
    const node = value as JsonLdNode;
    nodes.push(node);
    // Some sites nest breadcrumbs inside a WebPage node.
    if (node['@graph']) visit(node['@graph']);
    if (node.breadcrumb) visit(node.breadcrumb);
  };
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      visit(JSON.parse(script.textContent ?? ''));
    } catch {
      // Sites sometimes ship broken JSON-LD; ignore it and fall back.
    }
  }
  return nodes;
}

const hasType = (node: JsonLdNode, type: string) =>
  node['@type'] === type || (Array.isArray(node['@type']) && node['@type'].includes(type));

export function jsonLdProduct(doc: Document): JsonLdNode | null {
  return readJsonLd(doc).find((n) => hasType(n, 'Product') || hasType(n, 'ProductGroup')) ?? null;
}

/** The product JSON-LD's audience.suggestedGender, such as "female", "https://schema.org/Female" or "Unisex". */
export function jsonLdGender(doc: Document): string {
  const audience = jsonLdProduct(doc)?.audience as { suggestedGender?: unknown } | undefined;
  return typeof audience?.suggestedGender === 'string' ? audience.suggestedGender : '';
}

/** True when the product JSON-LD says the item is for women. */
export const isForWomen = (doc: Document) => /(^|\/)female$/i.test(jsonLdGender(doc).trim());

export function jsonLdBreadcrumbs(doc: Document): string[] {
  const list = readJsonLd(doc).find((n) => hasType(n, 'BreadcrumbList'));
  const items = Array.isArray(list?.itemListElement) ? (list.itemListElement as JsonLdNode[]) : [];
  return items
    .map((item) => {
      const inner = item.item as JsonLdNode | undefined;
      return (item.name ?? inner?.name) as string | undefined;
    })
    .filter((name): name is string => typeof name === 'string');
}

const OTHER_DEPARTMENT = /^(men'?s|men|mens|guys|kids'?|boys'?|girls'?|baby|toddler)$/i;

/**
 * True when the page clearly belongs to a men's or kids' department: a breadcrumb or a
 * URL path segment names it (PacSun's "Men's › Pants", Levi's /clothing/men/). Only
 * women's sizing is supported, so the popup says so instead of offering a women's chart.
 */
export function isOtherDepartment(url: URL, doc: Document): boolean {
  const crumbs = jsonLdBreadcrumbs(doc).slice(0, -1);
  if (crumbs.some((c) => OTHER_DEPARTMENT.test(c.trim()))) return true;
  return decodeURIComponent(url.pathname)
    .split('/')
    .some((segment) => OTHER_DEPARTMENT.test(segment));
}

export function textOf(doc: Document, selector: string): string | null {
  const text = doc.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  return text || null;
}

const meta = (doc: Document, selector: string) => doc.querySelector<HTMLMetaElement>(selector)?.content?.trim() || null;

/** Structured data first, then og:title, the main heading, and the page title. */
export function defaultProductName(doc: Document): string | null {
  const name = jsonLdProduct(doc)?.name;
  if (typeof name === 'string' && name.trim()) return name.trim();
  return meta(doc, 'meta[property="og:title"]') ?? textOf(doc, 'h1') ?? (doc.title.trim() || null);
}

export function defaultDescription(doc: Document): string | null {
  const description = jsonLdProduct(doc)?.description;
  if (typeof description === 'string' && description.trim()) return description.trim();
  return meta(doc, 'meta[name="description"]') ?? meta(doc, 'meta[property="og:description"]');
}

// Order matters: "shirt dress" is a dress, "denim shirt" is a top.
const CATEGORY_KEYWORDS: [Category, RegExp][] = [
  ['dresses', /\b(dress|dresses|gown|jumpsuit)\b/i],
  ['jeans', /\b(jeans?)\b/i],
  ['tops', /\b(tops?|tees?|t-shirts?|shirts?|blouses?|tanks?|camis?|sweaters?|sweatshirts?|tunics?|bodysuits?|cardigans?|polos?)\b/i],
];

export function categoryFromText(text: string | null | undefined): Category | null {
  if (!text) return null;
  return CATEGORY_KEYWORDS.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}

/** Breadcrumbs and URL path first, then keywords in the product name. */
export function defaultCategory(url: URL, doc: Document, productName: string | null, breadcrumbs = jsonLdBreadcrumbs(doc)): Category | null {
  // Walk breadcrumbs from most to least specific.
  for (const crumb of [...breadcrumbs].reverse()) {
    const category = categoryFromText(crumb);
    if (category) return category;
  }
  const path = decodeURIComponent(url.pathname).replace(/[-_/]+/g, ' ');
  return categoryFromText(path) ?? categoryFromText(productName);
}

// Sold on the same sites but not covered by any chart, and easily misread ("jean jacket").
// "shorts" stays plural so a "Short Sleeve Tee" still counts as a top.
const NOT_CHARTED = /\b(jackets?|coats?|shorts|skirts?|skorts?|pants?)\b/i;

/** For sites whose breadcrumbs end in the product's own name, which isn't a category. */
export function categoryFromCrumbsAndName(doc: Document): Category | null {
  const name = defaultProductName(doc);
  if (NOT_CHARTED.test(name ?? '')) return null;
  const crumbs = jsonLdBreadcrumbs(doc).filter((crumb) => crumb.trim() !== name);
  for (const crumb of [...crumbs].reverse()) {
    const category = categoryFromText(crumb);
    if (category) return category;
  }
  return categoryFromText(name);
}

const CUT_KEYWORDS: [Cut, RegExp][] = [
  ['oversized', /\b(oversized?|over-sized)\b/i],
  ['relaxed', /\b(relaxed|loose|baggy|boyfriend|dad)\b/i],
  ['slim', /\b(slim|skinny)\b/i],
];

/** The product name is checked before the description, which is noisier. Defaults to regular. */
export function detectCut(productName: string | null, description: string | null): Cut {
  for (const text of [productName, description]) {
    if (!text) continue;
    const match = CUT_KEYWORDS.find(([, pattern]) => pattern.test(text));
    if (match) return match[0];
  }
  return 'regular';
}
