import { describe, expect, it } from 'vitest';
import { popupStateFor } from './state';

describe('popupStateFor', () => {
  it.each([
    ['NO_PROFILE', 'setup_needed'],
    ['INCOMPLETE_PROFILE', 'setup_needed'],
    ['UNSUPPORTED_SITE', 'unsupported_site'],
    ['UNKNOWN_CATEGORY', 'choose_category'],
    ['UNSUPPORTED_CATEGORY', 'unsupported_item'],
    ['NO_USABLE_MEASUREMENTS', 'fix_profile'],
    ['OWNED_ITEM_NOT_FOUND', 'fix_profile'],
  ] as const)('%s → %s', (error, state) => {
    expect(popupStateFor({ ok: false, error })).toBe(state);
  });

  it('shows the result when ok', () => {
    const result = {
      recommendedSize: 'M',
      fitLabel: 'true_to_size',
      explanation: '',
      dimensionNotes: {},
      profileSource: 'measurements',
    } as const;
    expect(popupStateFor({ ok: true, result })).toBe('result');
  });
});
