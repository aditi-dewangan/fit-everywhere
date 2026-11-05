import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Test helper: parses a saved page from fixtures/. The page is loaded at the
 * URL recorded in the fixture's header comment unless `url` is given.
 */
export function loadFixture(path: string, url?: string): { url: URL; doc: Document } {
  const html = readFileSync(join(__dirname, '../../fixtures', path), 'utf8');
  const source = url ?? html.match(/^<!-- Fixture: .*? of (\S+)/)?.[1];
  if (!source) throw new Error(`${path} has no source URL in its header comment`);
  return { url: new URL(source), doc: new DOMParser().parseFromString(html, 'text/html') };
}
