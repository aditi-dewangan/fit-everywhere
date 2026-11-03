import { findAdapterForUrl } from '../adapters';
import type { ProductContext } from '../types';

export const GET_PRODUCT_CONTEXT = 'fit-everywhere/get-product-context';

export type ExtensionMessage = { type: typeof GET_PRODUCT_CONTEXT };

export function isExtensionMessage(message: unknown): message is ExtensionMessage {
  return !!message && typeof message === 'object' && (message as { type?: unknown }).type === GET_PRODUCT_CONTEXT;
}

/**
 * Asks the content script on a tab for its product. The script is injected
 * only after the popup opens (activeTab), and only on supported brand sites,
 * so the extension never reads pages from other sites. Returns null for
 * unsupported sites and for pages that aren't product pages.
 */
export async function getProductContext(tabId: number): Promise<ProductContext | null> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url || !findAdapterForUrl(tab.url)) return null;
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    const message: ExtensionMessage = { type: GET_PRODUCT_CONTEXT };
    const context: ProductContext | null = await chrome.tabs.sendMessage(tabId, message);
    return context ?? null;
  } catch {
    // Restricted pages (chrome://, the Web Store) can't be scripted.
    return null;
  }
}

/** The active tab's URL, readable because the user opened the popup (activeTab). */
export async function getActiveTab(): Promise<{ id: number; url: string } | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id !== undefined ? { id: tab.id, url: tab.url ?? '' } : null;
}
