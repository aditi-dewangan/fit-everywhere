import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { BrandSizeChart, FitProfile, ProductContext, RecommendResponse, SizeRow } from '../types';
import { buildExplanation, fitLabelFor, isProfileComplete, rankScores, recommend, scoreSizes } from './index';

// Worked example from the spec. Made-up numbers to test the math.
const around = (mid: number) => ({ min: mid - 0.5, max: mid + 0.5 });
const exampleRows: SizeRow[] = [
  { size: 'S', bust: around(34), waist: around(27), hips: around(37) },
  { size: 'M', bust: around(36), waist: around(29), hips: around(39) },
  { size: 'L', bust: around(38), waist: around(31), hips: around(41) },
];
const exampleChart: BrandSizeChart = {
  brandId: 'example',
  brandName: 'Example Brand',
  sourceUrl: 'https://example.com/size-chart',
  collectedOn: '2026-11-03',
  charts: { dresses: exampleRows },
};
const dress: ProductContext = {
  brandId: 'example',
  category: 'dresses',
  productName: 'Wrap dress',
  cut: 'regular',
  url: 'https://example.com/wrap-dress',
};
const profile = (overrides: Partial<FitProfile> = {}): FitProfile => ({
  measurements: { bust: 35.5, waist: 28, hips: 38.5 },
  preferredFit: 'regular',
  updatedAt: '2026-11-03T00:00:00.000Z',
  ...overrides,
});

function ok(response: RecommendResponse) {
  if (!response.ok) throw new Error(`expected a result, got ${response.error}`);
  return response.result;
}

describe('worked example', () => {
  it('regular fit → M, true to size, average gap 0.65', () => {
    const result = ok(recommend({ profile: profile(), product: dress, chart: exampleChart }));
    expect(result.recommendedSize).toBe('M');
    expect(result.fitLabel).toBe('true_to_size');
    expect(result.alternateSize).toBeUndefined();
    expect(result.profileSource).toBe('measurements');

    const scores = scoreSizes(exampleRows, profile().measurements!, dress, profile());
    expect(scores.find((s) => s.size === 'M')!.averageGap).toBeCloseTo(0.65);
  });

  it('oversized fit → L, slightly oversized, average gap 2.65', () => {
    const p = profile({ preferredFit: 'oversized' });
    const result = ok(recommend({ profile: p, product: dress, chart: exampleChart }));
    expect(result.recommendedSize).toBe('L');
    expect(result.fitLabel).toBe('slightly_oversized');

    const scores = scoreSizes(exampleRows, p.measurements!, dress, p);
    expect(scores.find((s) => s.size === 'L')!.averageGap).toBeCloseTo(2.65);
  });

  it('matches every score in the spec table', () => {
    const expected = { regular: [2.025, 0.65, 2.65], oversized: [5.025, 2.025, 0.65] } as const;
    for (const preferredFit of ['regular', 'oversized'] as const) {
      const p = profile({ preferredFit });
      const scores = scoreSizes(exampleRows, p.measurements!, dress, p).map((s) => s.score);
      scores.forEach((score, i) => expect(score).toBeCloseTo(expected[preferredFit][i]!));
    }
  });

  it('explains the result per dimension', () => {
    const result = ok(recommend({ profile: profile(), product: dress, chart: exampleChart }));
    expect(result.dimensionNotes).toEqual({ bust: 'fits well', waist: 'fits well', hips: 'fits well' });
    expect(result.explanation).toBe('Bust, waist, and hips fit well.');
  });
});

describe('scoring', () => {
  it('ignores missing dimensions and rescales the remaining weights', () => {
    // Only waist entered: dress weights become waist = 1.
    const p = profile({ measurements: { waist: 28 } });
    const scores = scoreSizes(exampleRows, p.measurements!, dress, p);
    expect(scores.map((s) => s.score)).toEqual([1.5, 1, 3]);
    expect(ok(recommend({ profile: p, product: dress, chart: exampleChart })).dimensionNotes).toEqual({
      waist: 'fits well',
    });
  });

  it('ignores chart rows missing a dimension', () => {
    const rows: SizeRow[] = [
      { size: 'S', bust: around(34) },
      { size: 'M', bust: around(36), waist: around(29) },
    ];
    const scores = scoreSizes(rows, profile().measurements!, dress, profile());
    expect(scores[0]!.gaps).toEqual({ bust: -1.5 });
    expect(scores[1]!.gaps).toEqual({ bust: 0.5, waist: 1 });
  });

  it('skips dimensions with zero weight (hips for tops)', () => {
    const top = { ...dress, category: 'tops' as const };
    const chart = { ...exampleChart, charts: { tops: exampleRows } };
    const result = ok(recommend({ profile: profile(), product: top, chart }));
    expect(result.dimensionNotes.hips).toBeUndefined();
  });

  it('penalizes too tight 1.5× more than too loose', () => {
    const rows: SizeRow[] = [
      { size: 'S', waist: around(27) }, // 1 in tight
      { size: 'M', waist: around(29) }, // 1 in loose
    ];
    const scores = scoreSizes(rows, { waist: 28 }, { ...dress, category: 'jeans' }, profile());
    expect(scores.map((s) => s.score)).toEqual([1.5, 1]);
  });

  it('applies cut ease so oversized items are not sized up again', () => {
    const regular = ok(recommend({ profile: profile(), product: dress, chart: exampleChart }));
    const oversized = ok(recommend({ profile: profile(), product: { ...dress, cut: 'oversized' }, chart: exampleChart }));
    const slim = ok(recommend({ profile: profile(), product: { ...dress, cut: 'slim' }, chart: exampleChart }));
    expect(regular.recommendedSize).toBe('M');
    expect(oversized.recommendedSize).toBe('S');
    expect(slim.recommendedSize).toBe('M');
    expect(slim.fitLabel).toBe('true_to_size');
  });

  it('relaxed cut adds 2 inches of ease to every gap', () => {
    const relaxed = { ...dress, cut: 'relaxed' as const };
    const [plain, eased] = [dress, relaxed].map((p) => scoreSizes(exampleRows, profile().measurements!, p, profile()));
    eased!.forEach((s, i) => expect(s.averageGap).toBeCloseTo(plain![i]!.averageGap + 2));
  });
});

describe('tie-breaks and alternates', () => {
  const tied = [
    { size: 'S', index: 0, score: 1, averageGap: 0, gaps: {} },
    { size: 'M', index: 1, score: 1, averageGap: 0, gaps: {} },
  ];

  it('picks the larger size on an exact tie', () => {
    expect(rankScores(tied, false)[0]!.size).toBe('M');
  });

  it('picks the smaller size on an exact tie when the preferred fit is fitted', () => {
    expect(rankScores(tied, true)[0]!.size).toBe('S');
  });

  it('treats float rounding noise as a tie', () => {
    const noisy = [tied[0]!, { ...tied[1]!, score: 1 + 1e-12 }];
    expect(rankScores(noisy, false)[0]!.size).toBe('M');
  });

  it('end to end: an exact tie returns the larger size with the smaller as alternate', () => {
    // Waist 28.4 against sizes at 28 and 29: S is 0.4 tight (0.4 × 1.5 = 0.6), M is 0.6 loose.
    const rows: SizeRow[] = [
      { size: 'S', waist: { min: 28, max: 28 } },
      { size: 'M', waist: { min: 29, max: 29 } },
    ];
    const chart = { ...exampleChart, charts: { jeans: rows } };
    const jeans = { ...dress, category: 'jeans' as const };
    const p = profile({ measurements: { waist: 28.4 } });
    const regular = ok(recommend({ profile: p, product: jeans, chart }));
    expect(regular.recommendedSize).toBe('M');
    expect(regular.alternateSize).toBe('S');
    expect(regular.explanation).toContain('S is also a close match if you want a closer fit.');
  });

  it('returns a runner-up within 0.25 as alternateSize', () => {
    const rows: SizeRow[] = [
      { size: '27', waist: { min: 28, max: 28 }, hips: { min: 38, max: 38 } },
      { size: '28', waist: { min: 29, max: 29 }, hips: { min: 39, max: 39 } },
    ];
    const chart = { ...exampleChart, charts: { jeans: rows } };
    const jeans = { ...dress, category: 'jeans' as const };
    // 27: diffs -0.2, -0.2 → 0.3; 28: diffs 0.8, 0.8 → 0.8. Not within 0.25.
    const far = ok(recommend({ profile: profile({ measurements: { waist: 28.2, hips: 38.2 } }), product: jeans, chart }));
    expect(far.recommendedSize).toBe('27');
    expect(far.alternateSize).toBeUndefined();
    // 27: diffs -0.35 → 0.525; 28: diffs 0.65 → 0.65. Within 0.25.
    const near = ok(recommend({ profile: profile({ measurements: { waist: 28.35, hips: 38.35 } }), product: jeans, chart }));
    expect(near.recommendedSize).toBe('27');
    expect(near.alternateSize).toBe('28');
    expect(near.explanation).toContain('28 is also a close match if you want more room.');
  });
});

describe('fit labels', () => {
  it.each([
    [-0.51, 'small'],
    [-0.5, 'true_to_size'],
    [1, 'true_to_size'],
    [1.01, 'slightly_oversized'],
    [3, 'slightly_oversized'],
    [3.01, 'oversized'],
  ] as const)('average gap %d → %s', (gap, label) => {
    expect(fitLabelFor(gap)).toBe(label);
  });
});

describe('length notes from height', () => {
  const rows: SizeRow[] = exampleRows.map((r) => ({ ...r, height: { min: 63, max: 67 } }));
  const chart = { ...exampleChart, charts: { dresses: rows } };

  it('notes "length may run short" above the height range', () => {
    const result = ok(recommend({ profile: profile({ measurements: { ...profile().measurements, height: 69 } }), product: dress, chart }));
    expect(result.recommendedSize).toBe('M'); // height never changes the size
    expect(result.dimensionNotes.length).toBe('may run short');
    expect(result.explanation).toBe('Bust, waist, and hips fit well, but length may run short.');
  });

  it('notes "length may run long" below the height range', () => {
    const result = ok(recommend({ profile: profile({ measurements: { ...profile().measurements, height: 60 } }), product: dress, chart }));
    expect(result.dimensionNotes.length).toBe('may run long');
  });

  it('adds no length note inside the range or without chart heights', () => {
    const inside = ok(recommend({ profile: profile({ measurements: { ...profile().measurements, height: 65 } }), product: dress, chart }));
    const noChartHeight = ok(recommend({ profile: profile({ measurements: { ...profile().measurements, height: 69 } }), product: dress, chart: exampleChart }));
    expect(inside.dimensionNotes.length).toBeUndefined();
    expect(noChartHeight.dimensionNotes.length).toBeUndefined();
  });
});

describe('owned item profiles', () => {
  const jeansRows: SizeRow[] = [
    { size: '26', waist: { min: 26, max: 27 }, hips: { min: 36, max: 37 } },
    { size: '27', waist: { min: 27.5, max: 28.5 }, hips: { min: 38, max: 39 } },
  ];
  const ownedBrand: BrandSizeChart = {
    ...exampleChart,
    brandId: 'owned-brand',
    brandName: 'Owned Brand',
    charts: { jeans: jeansRows },
  };
  const ownedProfile = (size = '27'): FitProfile => ({
    ownedItem: { brandId: 'owned-brand', category: 'jeans', size, productName: 'High rise' },
    preferredFit: 'regular',
    updatedAt: '2026-11-03T00:00:00.000Z',
  });

  it('uses the midpoints of the owned size from another brand', () => {
    // Owned 27 → waist 28, hips 38.5. Dress weights rescale to waist/hips 0.5 each.
    const result = ok(recommend({ profile: ownedProfile(), product: dress, chart: exampleChart, ownedItemChart: ownedBrand }));
    expect(result.profileSource).toBe('owned_item');
    expect(result.recommendedSize).toBe('M');
    expect(result.dimensionNotes.bust).toBeUndefined();
    expect(result.explanation).toContain('Based on your Owned Brand High rise, size 27.');
    expect(result.explanation).toContain('Adding your measurements gives a more accurate result.');
  });

  it('uses the product chart when the owned item is the same brand', () => {
    const chart = { ...ownedBrand, charts: { ...ownedBrand.charts, dresses: exampleRows } };
    const product = { ...dress, brandId: 'owned-brand' };
    const result = ok(recommend({ profile: ownedProfile(), product, chart }));
    expect(result.recommendedSize).toBe('M');
  });

  it('matches the owned size ignoring case and spaces', () => {
    const p = ownedProfile(' 27 ');
    expect(recommend({ profile: p, product: dress, chart: exampleChart, ownedItemChart: ownedBrand }).ok).toBe(true);
  });

  it('prefers entered measurements over the owned item', () => {
    const p = { ...ownedProfile(), measurements: { bust: 35.5, waist: 28, hips: 38.5 } };
    const result = ok(recommend({ profile: p, product: dress, chart: exampleChart, ownedItemChart: ownedBrand }));
    expect(result.profileSource).toBe('measurements');
  });

  it('still uses height alongside an owned item', () => {
    const rows = exampleRows.map((r) => ({ ...r, height: { min: 63, max: 67 } }));
    const chart = { ...exampleChart, charts: { dresses: rows } };
    const p = { ...ownedProfile(), measurements: { height: 69 } };
    const result = ok(recommend({ profile: p, product: dress, chart, ownedItemChart: ownedBrand }));
    expect(result.profileSource).toBe('owned_item');
    expect(result.dimensionNotes.length).toBe('may run short');
  });
});

describe('error states', () => {
  const expectError = (response: RecommendResponse, error: string) => expect(response).toEqual({ ok: false, error });

  it('NO_PROFILE', () => {
    expectError(recommend({ profile: null, product: dress, chart: exampleChart }), 'NO_PROFILE');
  });

  it('INCOMPLETE_PROFILE with no measurements or owned item', () => {
    expectError(recommend({ profile: profile({ measurements: {} }), product: dress, chart: exampleChart }), 'INCOMPLETE_PROFILE');
    expectError(recommend({ profile: profile({ measurements: { height: 65 } }), product: dress, chart: exampleChart }), 'INCOMPLETE_PROFILE');
  });

  it('INCOMPLETE_PROFILE with no preferred fit', () => {
    const p = { ...profile(), preferredFit: undefined } as unknown as FitProfile;
    expectError(recommend({ profile: p, product: dress, chart: exampleChart }), 'INCOMPLETE_PROFILE');
  });

  it('UNSUPPORTED_SITE with no product, no chart, or a mismatched chart', () => {
    expectError(recommend({ profile: profile(), product: null, chart: exampleChart }), 'UNSUPPORTED_SITE');
    expectError(recommend({ profile: profile(), product: dress, chart: null }), 'UNSUPPORTED_SITE');
    expectError(recommend({ profile: profile(), product: { ...dress, brandId: 'other' }, chart: exampleChart }), 'UNSUPPORTED_SITE');
  });

  it('UNKNOWN_CATEGORY', () => {
    expectError(recommend({ profile: profile(), product: { ...dress, category: null }, chart: exampleChart }), 'UNKNOWN_CATEGORY');
  });

  it('UNSUPPORTED_CATEGORY', () => {
    expectError(recommend({ profile: profile(), product: { ...dress, category: 'jeans' }, chart: exampleChart }), 'UNSUPPORTED_CATEGORY');
  });

  it('NO_USABLE_MEASUREMENTS when nothing overlaps the chart', () => {
    // Bust only, but jeans weigh waist and hips.
    const chart = { ...exampleChart, charts: { jeans: exampleRows } };
    const p = profile({ measurements: { bust: 35 } });
    expectError(recommend({ profile: p, product: { ...dress, category: 'jeans' }, chart }), 'NO_USABLE_MEASUREMENTS');
  });

  it('OWNED_ITEM_NOT_FOUND when the brand chart, category, or size is missing', () => {
    const owned = (ownedItem: FitProfile['ownedItem']) => profile({ measurements: undefined, ownedItem });
    expectError(
      recommend({ profile: owned({ brandId: 'gone', category: 'jeans', size: '27' }), product: dress, chart: exampleChart }),
      'OWNED_ITEM_NOT_FOUND',
    );
    expectError(
      recommend({ profile: owned({ brandId: 'example', category: 'jeans', size: 'M' }), product: dress, chart: exampleChart }),
      'OWNED_ITEM_NOT_FOUND',
    );
    expectError(
      recommend({ profile: owned({ brandId: 'example', category: 'dresses', size: 'XXL' }), product: dress, chart: exampleChart }),
      'OWNED_ITEM_NOT_FOUND',
    );
  });
});

describe('profile validation', () => {
  it('requires a preferred fit plus a body measurement or an owned item', () => {
    expect(isProfileComplete(profile())).toBe(true);
    expect(isProfileComplete(profile({ measurements: { hips: 38 } }))).toBe(true);
    expect(isProfileComplete(profile({ measurements: { bust: 0 } }))).toBe(false);
    expect(isProfileComplete(profile({ measurements: undefined }))).toBe(false);
  });

  it('can require the owned item to be from a supported brand', () => {
    const p = profile({ measurements: undefined, ownedItem: { brandId: 'levis', category: 'jeans', size: '27' } });
    expect(isProfileComplete(p)).toBe(true);
    expect(isProfileComplete(p, ['levis'])).toBe(true);
    expect(isProfileComplete(p, ['madewell'])).toBe(false);
  });
});

describe('explanation templates', () => {
  it('matches the spec example wording', () => {
    expect(buildExplanation({ dimensionNotes: { waist: 'fits well', length: 'may run short' } })).toBe(
      'Waist fits well, but length may run short.',
    );
  });

  it('lists only concerns when nothing fits well', () => {
    expect(buildExplanation({ dimensionNotes: { bust: 'may feel snug', hips: 'may feel roomy' } })).toBe(
      'Bust may feel snug and hips may feel roomy.',
    );
  });
});

describe('engine boundaries', () => {
  it('uses no browser APIs', () => {
    const dir = __dirname;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))) {
      const source = readFileSync(join(dir, file), 'utf8');
      expect(source, file).not.toMatch(/\b(chrome|window|document|localStorage|fetch)\s*[.(]/);
    }
  });
});
