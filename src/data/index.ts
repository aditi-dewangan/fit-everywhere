import type { BrandSizeChart } from '../types';
import { brandSizeChartSchema } from './schema';

// Every JSON file in ./charts is one brand. Files are validated when loaded,
// and the data tests make sure a bad file never reaches a build.
const files = import.meta.glob<unknown>('./charts/*.json', { eager: true, import: 'default' });

export function parseChart(raw: unknown, file = 'chart'): BrandSizeChart {
  const parsed = brandSizeChartSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
    throw new Error(`${file} is not a valid size chart:\n${issues}`);
  }
  return parsed.data;
}

export const allCharts: BrandSizeChart[] = Object.entries(files).map(([file, raw]) => parseChart(raw, file));

/** Real brands only; sample charts are kept for tests. */
export const supportedCharts: BrandSizeChart[] = allCharts.filter((c) => !c.isSample);

export function getChart(brandId: string): BrandSizeChart | null {
  return allCharts.find((c) => c.brandId === brandId) ?? null;
}
