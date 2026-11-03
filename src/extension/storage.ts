import { fitProfileSchema } from '../data/schema';
import type { FitProfile } from '../types';

// The fit profile is stored only in chrome.storage.local, on this device.

const PROFILE_KEY = 'fitProfile';

export async function getProfile(): Promise<FitProfile | null> {
  const stored = await chrome.storage.local.get(PROFILE_KEY);
  const parsed = fitProfileSchema.safeParse(stored[PROFILE_KEY]);
  return parsed.success ? parsed.data : null;
}

export async function saveProfile(profile: FitProfile): Promise<void> {
  await chrome.storage.local.set({ [PROFILE_KEY]: fitProfileSchema.parse(profile) });
}

export async function clearProfile(): Promise<void> {
  await chrome.storage.local.remove(PROFILE_KEY);
}
