// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractProductContext } from './index';
import { reformation } from './reformation';
import { loadFixture } from './test-fixtures';

describe('Reformation adapter', () => {
  it('reads each saved page', () => {
    for (const category of ['jeans', 'tops', 'dresses']) {
      const { url, doc } = loadFixture(`reformation/${category}.html`);
      expect(extractProductContext(url, doc, [reformation])).toMatchObject({ brandId: 'reformation', category });
    }
  });

  it('ignores category pages', () => {
    const { doc } = loadFixture('reformation/jeans.html');
    expect(reformation.isProductPage(new URL('https://www.thereformation.com/jeans'), doc)).toBe(false);
  });
});
