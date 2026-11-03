import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { recommend } from '../engine';
import { allCharts, getChart, parseChart, supportedCharts } from './index';

// Runs against every file in src/data/charts, so a new brand chart is checked
// as soon as it is added.
const dir = join(__dirname, 'charts');
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));

describe.each(files)('%s', (file) => {
  const raw = JSON.parse(readFileSync(join(dir, file), 'utf8'));

  it('passes schema validation (min <= max, sizes ascending, source URL)', () => {
    expect(() => parseChart(raw, file)).not.toThrow();
  });

  it('is named after its brandId', () => {
    expect(file).toBe(`${raw.brandId}.json`);
  });

  it('returns a recommendation for every clothing type it lists', () => {
    const chart = parseChart(raw, file);
    for (const category of Object.keys(chart.charts) as (keyof typeof chart.charts)[]) {
      const response = recommend({
        profile: { measurements: { bust: 36, waist: 29, hips: 39 }, preferredFit: 'regular', updatedAt: '' },
        product: { brandId: chart.brandId, category, productName: 'Test', cut: 'regular', url: '' },
        chart,
      });
      expect(response.ok, `${category}`).toBe(true);
    }
  });
});

describe('chart index', () => {
  it('loads every chart file', () => {
    expect(allCharts).toHaveLength(files.length);
  });

  it('has unique brand ids', () => {
    const ids = allCharts.map((c) => c.brandId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps sample charts out of the supported list', () => {
    expect(getChart('sample')?.isSample).toBe(true);
    expect(supportedCharts.some((c) => c.isSample)).toBe(false);
  });
});
