import { extractProductContext } from '../adapters';
import { isExtensionMessage } from './messages';

// Injected into supported brand pages when the popup opens. Reads the page
// and replies with a ProductContext; it never sends anything anywhere else.

declare global {
  interface Window {
    __fitEverywhereListening?: boolean;
  }
}

if (!window.__fitEverywhereListening) {
  window.__fitEverywhereListening = true;
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isExtensionMessage(message)) return;
    sendResponse(extractProductContext(new URL(location.href), document));
  });
}
