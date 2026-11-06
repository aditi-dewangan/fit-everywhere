import { hollister } from './hollister';
import type { BrandAdapter } from './types';

// Abercrombie & Fitch runs on the same site platform as Hollister: identical
// product URLs (/shop/us/p/<name>-<id>), JSON-LD, and breadcrumbs.
export const abercrombie: BrandAdapter = {
  ...hollister,
  brandId: 'abercrombie',
  hostnames: ['abercrombie.com'],
};
