import type { RecommendError, RecommendResponse } from '../../types';

// The popup states from the spec. The final design only needs to render
// these; it never has to call the engine differently.

export type PopupState =
  | 'setup_needed'
  | 'unsupported_site'
  | 'choose_category'
  | 'unsupported_item'
  | 'fix_profile'
  | 'result';

const STATE_FOR_ERROR: Record<RecommendError, PopupState> = {
  NO_PROFILE: 'setup_needed',
  INCOMPLETE_PROFILE: 'setup_needed',
  UNSUPPORTED_SITE: 'unsupported_site',
  UNKNOWN_CATEGORY: 'choose_category',
  UNSUPPORTED_CATEGORY: 'unsupported_item',
  NO_USABLE_MEASUREMENTS: 'fix_profile',
  OWNED_ITEM_NOT_FOUND: 'fix_profile',
};

export function popupStateFor(response: RecommendResponse): PopupState {
  return response.ok ? 'result' : STATE_FOR_ERROR[response.error];
}
