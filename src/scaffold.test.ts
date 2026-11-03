import { describe, expect, it } from 'vitest';
import manifest from '../public/manifest.json';

describe('scaffold', () => {
  it('uses Manifest V3', () => {
    expect(manifest.manifest_version).toBe(3);
  });
});
