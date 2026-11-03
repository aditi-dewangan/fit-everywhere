import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FitProfile } from '../types';
import { clearProfile, getProfile, saveProfile } from './storage';

let store: Record<string, unknown>;
beforeEach(() => {
  store = {};
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: async (key: string) => (key in store ? { [key]: store[key] } : {}),
        set: async (items: Record<string, unknown>) => Object.assign(store, items),
        remove: async (key: string) => void delete store[key],
      },
    },
  });
});

const profile: FitProfile = {
  measurements: { bust: 35.5, waist: 28, hips: 38.5 },
  preferredFit: 'regular',
  updatedAt: '2026-11-03T00:00:00.000Z',
};

describe('profile storage', () => {
  it('returns null when nothing is saved', async () => {
    expect(await getProfile()).toBeNull();
  });

  it('saves and reads back a profile', async () => {
    await saveProfile(profile);
    expect(await getProfile()).toEqual(profile);
  });

  it('clears the profile', async () => {
    await saveProfile(profile);
    await clearProfile();
    expect(await getProfile()).toBeNull();
  });

  it('ignores a corrupted stored profile', async () => {
    store.fitProfile = { preferredFit: 'nope' };
    expect(await getProfile()).toBeNull();
  });

  it('refuses to save an invalid profile', async () => {
    await expect(saveProfile({ ...profile, preferredFit: 'baggy' as never })).rejects.toThrow();
    expect(store.fitProfile).toBeUndefined();
  });
});
