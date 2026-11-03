import { z } from 'zod';
import { CATEGORIES, CUTS, DIMENSIONS, PREFERRED_FITS } from '../types';
import type { BrandSizeChart, FitProfile, SizeRow } from '../types';

const inches = z.number().positive().finite();

const rangeSchema = z
  .object({ min: inches, max: inches })
  .strict()
  .refine((r) => r.min <= r.max, { message: 'min must be <= max' });

const sizeRowSchema = z
  .object({
    size: z.string().trim().min(1),
    bust: rangeSchema.optional(),
    waist: rangeSchema.optional(),
    hips: rangeSchema.optional(),
    height: rangeSchema.optional(),
  })
  .strict()
  .refine((row) => DIMENSIONS.some((d) => row[d]), {
    message: 'a size needs at least one of bust, waist, or hips',
  });

const midpoint = (r: { min: number; max: number }) => (r.min + r.max) / 2;

// Sizes must be listed smallest to largest, with no duplicates.
const sizeRowsSchema = z
  .array(sizeRowSchema)
  .min(1)
  .superRefine((rows, ctx) => {
    const seen = new Set<string>();
    rows.forEach((row, i) => {
      const key = row.size.toLowerCase();
      if (seen.has(key)) ctx.addIssue({ code: 'custom', path: [i, 'size'], message: `duplicate size "${row.size}"` });
      seen.add(key);
    });
    for (const dim of [...DIMENSIONS, 'height'] as const) {
      let prev: number | undefined;
      rows.forEach((row, i) => {
        const range = row[dim];
        if (!range) return;
        const mid = midpoint(range);
        if (prev !== undefined && mid < prev) {
          ctx.addIssue({
            code: 'custom',
            path: [i, dim],
            message: `sizes must be ordered smallest to largest (${dim} of "${row.size}" is smaller than the size before it)`,
          });
        }
        prev = mid;
      });
    }
  });

export const brandSizeChartSchema = z
  .object({
    brandId: z.string().regex(/^[a-z0-9-]+$/, 'use lowercase letters, numbers, and dashes'),
    brandName: z.string().min(1),
    sourceUrl: z.url(),
    collectedOn: z.iso.date(),
    charts: z
      .object({
        tops: sizeRowsSchema.optional(),
        dresses: sizeRowsSchema.optional(),
        jeans: sizeRowsSchema.optional(),
      })
      .strict()
      .refine((c) => CATEGORIES.some((cat) => c[cat]), { message: 'add at least one clothing type' }),
    isSample: z.boolean().optional(),
    notes: z.string().optional(),
  })
  .strict();

// Stored profiles are checked for shape only. Whether a profile is complete
// enough to use is decided by the engine (see src/engine/profile.ts).
export const fitProfileSchema = z.object({
  measurements: z
    .object({
      bust: inches.optional(),
      waist: inches.optional(),
      hips: inches.optional(),
      height: inches.optional(),
    })
    .optional(),
  ownedItem: z
    .object({
      brandId: z.string().min(1),
      category: z.enum(CATEGORIES),
      productName: z.string().optional(),
      size: z.string().min(1),
    })
    .optional(),
  preferredFit: z.enum(PREFERRED_FITS),
  updatedAt: z.string(),
});

export const cutSchema = z.enum(CUTS);

// Compile-time checks that the schemas match the hand-written types.
type Assert<T extends true> = T;
type _ChartMatches = Assert<z.infer<typeof brandSizeChartSchema> extends BrandSizeChart ? true : false>;
type _RowMatches = Assert<z.infer<typeof sizeRowSchema> extends SizeRow ? true : false>;
type _ProfileMatches = Assert<z.infer<typeof fitProfileSchema> extends FitProfile ? true : false>;
