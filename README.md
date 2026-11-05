# Fit Everywhere

A Chrome extension that recommends the best size for women's clothing on supported brand sites. You set up one fit profile, open a product page, and the popup tells you which size to buy, how it will fit, and why.

> Recommended size: **M**. Fit: slightly oversized. Waist fits well, but length may run short.

Everything runs inside the extension. There's no server, your measurements never leave your device, and there are no analytics.

## Download

**[⬇ Download the latest build (fit-everywhere.zip)](https://github.com/aditi-dewangan/fit-everywhere/releases/latest/download/fit-everywhere.zip)**

To install:

1. Unzip `fit-everywhere.zip`.
2. In Chrome, go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder.
5. Pin Fit Everywhere from the puzzle-piece menu, then click it to set up your profile.

All builds are on the [Releases page](https://github.com/aditi-dewangan/fit-everywhere/releases).

## Status

The current build covers the engine, the data pipeline, and a placeholder popup. Size charts are in for **Hollister, H&M, and PacSun**, but the brand adapters (which detect products on each site) aren't built yet, so every site still shows "doesn't work on this site."

| Spec step | Status |
| --- | --- |
| 1. Scaffold (TypeScript, Vite, Manifest V3) | ✅ Done |
| 2. Data types and chart schema | ✅ Done |
| 3. Recommendation engine with tests | ✅ Done, both worked examples pass |
| 4. Labeled sample chart | ✅ Done (`src/data/charts/sample.json`, test-only) |
| 5. Profile storage, content script, messaging | ✅ Done |
| 6. Brand adapters from saved fixtures | ⏳ Charts done (Hollister, H&M, PacSun); adapters waiting on saved product pages |
| 7. Placeholder popup covering every state | ✅ Done |

| Brand | Tops | Dresses | Jeans | Chart source |
| --- | --- | --- | --- | --- |
| Hollister | ✅ XS–L (bust only) | — no chart | ✅ 0–11 | [hollisterco.com size charts](https://www.hollisterco.com/hol/faq/sizecharts.html) |
| H&M | ✅ XXS–4XL | ✅ XXS–4XL | ✅ US 0–30 | [H&M US size guide](https://www2.hm.com/en_us/customer-service/sizeguide/ladies.html) (archived Jun 2023) |
| PacSun | ✅ XS–L | — no chart | ✅ 23–32 | [PacSun jeans](https://www.pacsun.com/sizechart-womens-jeans.html) / [tops](https://www.pacsun.com/sizechart-womens-tops.html) charts (archived) |

## How it works

```
Product page ──▶ Content script + brand adapter ──▶ Popup ◀──▶ Recommendation engine
                 (brand, clothing type, name, cut)    ▲              ▲
                                                      │              │
                                   Fit profile (chrome.storage.local)  Size chart JSON (one per brand)
```

1. The user creates a fit profile from their measurements or from an item they own that fits well, and picks a preferred fit (fitted, regular, or oversized).
2. On a supported product page, the user opens the popup. The popup injects the content script into that tab only, and the content script reads the brand, clothing type, product name, and cut.
3. The engine scores every size in the brand's chart and returns the best size, a fit label, per-area notes, and an alternate size when the user is between sizes.

**The engine** (`src/engine/`) is a transparent scoring rule, not a trained model:

- For each size and each area (bust, waist, hips): `gap = chart midpoint + cut ease − user measurement`.
- The penalty is `|gap − preferred gap|`, and too tight counts 1.5× more than too loose.
- Penalties are weighted by clothing type: tops focus on bust, jeans on waist and hips, and dresses use all three. Missing areas are skipped and the remaining weights are rescaled.
- The lowest score wins. A runner-up within 0.25 becomes the alternate size. On an exact tie the larger size wins, or the smaller one for a fitted preference.
- Height never changes the size. It only adds "length may run short/long" when the chart lists height.

Every number above is in **`src/engine/config.ts`**. Tune them there after user testing.

## Adding a brand

You need three things for each brand: a size chart, a saved product page for each clothing type, and a small adapter.

### 1. Size chart → `src/data/charts/<brandId>.json`

Start from [`docs/chart-template.json`](docs/chart-template.json). Rules:

- **Copy the brand's published chart exactly, never estimate.** Put the chart page in `sourceUrl` and the date you copied it in `collectedOn`.
- Use **inches**. For a centimeter chart, divide by 2.54 and round to two decimals.
- If the chart lists one number instead of a range, set `min` and `max` to that number.
- List sizes **smallest to largest**.
- Supported clothing types are `tops`, `dresses`, and `jeans`. Include only the ones the brand's chart covers.
- Write any exceptions (petite lines, styles that run small) in `notes`. The popup shows this text.

Run `npm test` to check the file. The data tests validate every chart against the schema (`min <= max`, ascending sizes, source URL present) and confirm it produces a recommendation.

### 2. Fixture → `fixtures/<brandId>/<category>.html`

Save one product page per clothing type (see [`fixtures/README.md`](fixtures/README.md)). Adapter tests and the backup demo run against these, so they keep working when the live site changes.

### 3. Adapter → `src/adapters/<brandId>.ts`

Implement `BrandAdapter` (`src/adapters/types.ts`) and add it to the list in `src/adapters/index.ts`. Most brands only need the shared helpers in `src/adapters/common.ts`, which read JSON-LD, breadcrumbs, URL keywords, and cut words. Add a test that loads the fixtures.

## Development

Requires Node 22+.

```sh
npm install
npm test          # unit, data, adapter, and popup tests
npm run build     # builds the extension into dist/
npm run zip       # builds and packages fit-everywhere.zip
```

To try a local build, run `npm run build` and then **Load unpacked** with the `dist/` folder. After rebuilding, click the reload icon on the extension card.

**Publishing a new download:** bump `version` in both `package.json` and `public/manifest.json`, commit, then tag and push:

```sh
git tag v0.2.0 && git push origin v0.2.0
```

GitHub Actions runs the tests, builds the zip, and attaches it to a new release. The download link above always points to the latest release.

## Project layout

```
public/manifest.json      Manifest V3 (storage, activeTab, scripting; no host permissions)
src/
  types.ts                Shared data model from the spec
  engine/                 Pure logic, no browser APIs
    config.ts             All offsets, weights, and thresholds
    recommend.ts          Scoring
    explanation.ts        Text templates
    profile.ts            Profile validation
  data/
    schema.ts             Zod schemas for charts and profiles
    charts/               One JSON file per brand
    index.ts              Loads and validates charts
  adapters/               Product page detection, one file per brand
  extension/
    content.ts            Runs on the product page when the popup opens
    messages.ts           getProductContext(tabId)
    storage.ts            getProfile / saveProfile / clearProfile
  ui/popup/               Placeholder UI, replaced by the final design
fixtures/                 Saved product pages for adapter tests
```

**For the final design:** the UI only needs `getProfile`, `saveProfile`, `clearProfile`, `getProductContext`, and `recommend`, plus the popup states in `src/ui/popup/state.ts` (setup needed, unsupported site, choose clothing type, unsupported item, fix profile, and result). You can replace `popup.ts` and `popup.css` without touching the engine.

## Privacy

- The fit profile is stored only in `chrome.storage.local` on your device.
- No measurements or browsing data are sent anywhere, and there are no analytics.
- The extension has no standing site access. It reads a page only when you open the popup on a supported brand's site.
- To delete your profile, open the popup and choose **Edit profile → Delete profile**.

## Team

- **Aditi Dewangan**: tech (logic and data)
- **Anya**: design and PM
- **Heesu**: design and business
