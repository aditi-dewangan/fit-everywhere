import { describe, expect, it } from 'vitest';
import { brandSizeChartSchema, fitProfileSchema } from './schema';

const validChart = {
  brandId: 'test-brand',
  brandName: 'Test Brand',
  sourceUrl: 'https://example.com/size-chart',
  collectedOn: '2026-11-03',
  charts: {
    tops: [
      { size: 'S', bust: { min: 33, max: 34 }, waist: { min: 26, max: 27 } },
      { size: 'M', bust: { min: 35, max: 36 }, waist: { min: 28, max: 29 } },
    ],
  },
};

const errorsFor = (chart: unknown) => {
  const r = brandSizeChartSchema.safeParse(chart);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe('brandSizeChartSchema', () => {
  it('accepts a valid chart', () => {
    expect(errorsFor(validChart)).toEqual([]);
  });

  it('accepts a single number entered as min = max', () => {
    const chart = structuredClone(validChart);
    chart.charts.tops[0]!.bust = { min: 34, max: 34 };
    expect(errorsFor(chart)).toEqual([]);
  });

  it('rejects min > max', () => {
    const chart = structuredClone(validChart);
    chart.charts.tops[0]!.bust = { min: 35, max: 34 };
    expect(errorsFor(chart)).toContain('min must be <= max');
  });

  it('rejects sizes out of order', () => {
    const chart = structuredClone(validChart);
    chart.charts.tops.reverse();
    expect(errorsFor(chart).join()).toMatch(/smallest to largest/);
  });

  it('rejects duplicate sizes', () => {
    const chart = structuredClone(validChart);
    chart.charts.tops[1]!.size = 's';
    expect(errorsFor(chart).join()).toMatch(/duplicate size/);
  });

  it('requires a source URL', () => {
    const { sourceUrl: _, ...chart } = validChart;
    expect(errorsFor(chart).length).toBeGreaterThan(0);
    expect(errorsFor({ ...validChart, sourceUrl: 'not a url' }).length).toBeGreaterThan(0);
  });

  it('rejects unknown clothing types and fields', () => {
    expect(errorsFor({ ...validChart, charts: { skirts: validChart.charts.tops } }).length).toBeGreaterThan(0);
    expect(errorsFor({ ...validChart, sizes: [] }).length).toBeGreaterThan(0);
  });

  it('rejects a chart with no clothing types', () => {
    expect(errorsFor({ ...validChart, charts: {} })).toContain('add at least one clothing type');
  });

  it('rejects a size with no body dimensions', () => {
    const chart = structuredClone(validChart);
    chart.charts.tops.push({ size: 'L' } as (typeof chart.charts.tops)[number]);
    expect(errorsFor(chart).join()).toMatch(/at least one of bust, waist, or hips/);
  });
});

describe('fitProfileSchema', () => {
  it('accepts a measurements profile', () => {
    const r = fitProfileSchema.safeParse({
      measurements: { bust: 35.5, waist: 28 },
      preferredFit: 'regular',
      updatedAt: '2026-11-03T00:00:00.000Z',
    });
    expect(r.success).toBe(true);
  });

  it('rejects an unknown preferred fit', () => {
    const r = fitProfileSchema.safeParse({ preferredFit: 'baggy', updatedAt: '' });
    expect(r.success).toBe(false);
  });
});
