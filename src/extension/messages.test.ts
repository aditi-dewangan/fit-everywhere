import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../adapters', () => ({
  findAdapterForUrl: (url: string) => (url.startsWith('https://shop.example.com') ? { brandId: 'example' } : null),
}));

const { getProductContext, GET_PRODUCT_CONTEXT } = await import('./messages');

const context = { brandId: 'example', category: 'tops', productName: 'Tee', cut: 'regular', url: '' };
let tabUrl: string;
const executeScript = vi.fn();
const sendMessage = vi.fn();

beforeEach(() => {
  tabUrl = 'https://shop.example.com/p/tee';
  executeScript.mockReset().mockResolvedValue([]);
  sendMessage.mockReset().mockResolvedValue(context);
  vi.stubGlobal('chrome', {
    tabs: { get: async () => ({ url: tabUrl }), sendMessage },
    scripting: { executeScript },
  });
});

describe('getProductContext', () => {
  it('injects the content script on supported sites and returns its reply', async () => {
    expect(await getProductContext(7)).toEqual(context);
    expect(executeScript).toHaveBeenCalledWith({ target: { tabId: 7 }, files: ['content.js'] });
    expect(sendMessage).toHaveBeenCalledWith(7, { type: GET_PRODUCT_CONTEXT });
  });

  it('never injects into unsupported sites', async () => {
    tabUrl = 'https://other.com/item';
    expect(await getProductContext(7)).toBeNull();
    expect(executeScript).not.toHaveBeenCalled();
  });

  it('returns null when the page cannot be scripted', async () => {
    executeScript.mockRejectedValue(new Error('Cannot access a chrome:// URL'));
    expect(await getProductContext(7)).toBeNull();
  });

  it('returns null when the page is not a product page', async () => {
    sendMessage.mockResolvedValue(null);
    expect(await getProductContext(7)).toBeNull();
  });
});
