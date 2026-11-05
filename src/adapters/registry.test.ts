// @vitest-environment jsdom
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getChart } from '../data';
import { recommend } from '../engine';
import { extractProductContext } from './index';
import { loadFixture } from './test-fixtures';
import { adapters } from './index';

// Fixtures we couldn't get from the Wayback Machine yet. Save these from a
// browser (see fixtures/README.md) and remove them from this list.
const MISSING_FIXTURES = ['hm/dresses.html', 'pacsun/tops.html'];

describe.each(adapters.map((a) => [a.brandId, a] as const))('%s adapter', (brandId, adapter) => {
  it('has a size chart', () => {
    expect(getChart(brandId)?.isSample).toBeFalsy();
    expect(getChart(brandId)).not.toBeNull();
  });

  it('has a fixture for every clothing type in its chart', () => {
    for (const category of Object.keys(getChart(brandId)!.charts)) {
      if (MISSING_FIXTURES.includes(`${brandId}/${category}.html`)) continue;
      expect(existsSync(join(__dirname, '../../fixtures', brandId, `${category}.html`)), `${brandId}/${category}.html`).toBe(true);
    }
  });

  it('returns a recommendation from every saved product page', () => {
    for (const category of Object.keys(getChart(brandId)!.charts)) {
      const path = `${brandId}/${category}.html`;
      if (MISSING_FIXTURES.includes(path)) continue;
      const { url, doc } = loadFixture(path);
      const product = extractProductContext(url, doc, [adapter]);
      expect(product?.category, path).toBe(category);
      const response = recommend({
        profile: { measurements: { bust: 35, waist: 28, hips: 38 }, preferredFit: 'regular', updatedAt: '' },
        product,
        chart: getChart(brandId),
      });
      expect(response.ok, path).toBe(true);
    }
  });

  it('lists hostnames without www', () => {
    for (const host of adapter.hostnames) expect(host).not.toMatch(/^www\./);
  });
});
