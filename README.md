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

42 brands are in the source code (table below). How far each one has been checked:

- **Confirmed on the live site in the real extension:** H&M, Hollister, PacSun, Gap.
- **Tested against saved product pages only:** every other brand in the table. Each saved page is a cut-down copy of a real product page, so these should work but haven't been tried on the live site yet. If one doesn't, please open an issue with the product link.
- **In the download:** the latest release (v0.4.0) only has H&M, Hollister and PacSun. The other brands will be in the next release. Until then, build from source (see [Development](#development)).

Only women's sizing is supported. On men's, kids' or other department pages the popup asks you to choose a clothing type instead of recommending a size. Petite, tall, curvy and plus charts aren't modeled.

| Spec step | Status |
| --- | --- |
| 1. Scaffold (TypeScript, Vite, Manifest V3) | ✅ Done |
| 2. Data types and chart schema | ✅ Done |
| 3. Recommendation engine with tests | ✅ Done, both worked examples pass |
| 4. Labeled sample chart | ✅ Done (`src/data/charts/sample.json`, test-only) |
| 5. Profile storage, content script, messaging | ✅ Done |
| 6. Brand adapters from saved fixtures | ✅ Done for every brand below |
| 7. Popup covering every state | ✅ Done, final design |

Chart coverage by brand. ✅ means the brand's chart for that clothing type is included. The last column lists the clothing types tested against a saved product page.

| Brand | Tops | Dresses | Jeans | Chart source | Adapter tested on |
| --- | --- | --- | --- | --- | --- |
| Hollister | ✅ XS–L (bust only) | — no chart | ✅ 0–11 | [hollisterco.com size charts](https://www.hollisterco.com/hol/faq/sizecharts.html) | tops, jeans |
| H&M | ✅ XXS–4XL | ✅ XXS–4XL | ✅ US 0–30 | [H&M US size guide](https://www2.hm.com/en_us/customer-service/sizeguide/ladies.html) (archived Jun 2023) | tops, dresses, jeans |
| PacSun | ✅ XS–L | — no chart | ✅ 23–34 | [PacSun jeans](https://www.pacsun.com/sizechart-womens-jeans.html) / [tops](https://www.pacsun.com/sizechart-womens-tops.html) charts (archived) | tops, jeans |
| Abercrombie & Fitch | ✅ XXS–XXXL (bust only) | ✅ XXS–XXXL | ✅ 23–37 | Size Guide on [abercrombie.com](https://www.abercrombie.com/shop/us/p/high-rise-wide-leg-jean-63893393) product pages | tops, dresses, jeans |
| American Eagle | ✅ XXS–XXL (bust only) | ✅ XXS–XXL | ✅ 000–22 | Size Details on [ae.com](https://www.ae.com/us/en/p/women/jeans/flare-bootcut-jeans/ae-super-high-waisted-flare-jean/1436_5865_927) product pages | tops, dresses, jeans |
| Aerie | ✅ XXS–XXL (bust only) | — not collected | — not collected | Size Details on [ae.com](https://www.ae.com/us/en/p/aerie/tops/sweaters-cardigans/aerie-ribbed-cardigan/9492_4173_572) product pages | tops |
| Gap | ✅ XXS–XXL | ✅ XXS–XXL | ✅ 000/23–22/36 | Size Guide on [gap.com](https://www.gap.com/browse/product.do?pid=1185296002) product pages | tops, dresses, jeans |
| Old Navy | ✅ XXS–4X | ✅ XXS–4X (no hips) | ✅ 000–30 | Size Guide on [oldnavy.gap.com](https://oldnavy.gap.com/browse/product.do?pid=734873002) product pages | tops, dresses, jeans |
| Ralph Lauren | ✅ XXS/000–XXL/22 | ✅ XXS/000–XXL/22 | ✅ 24–34 | Size Chart on [ralphlauren.com](https://www.ralphlauren.com/women-clothing-jeans/high-rise-straight-jean/100043703.html) product pages (Polo; the Lauren line is excluded) | tops, dresses, jeans |
| Stüssy | ✅ XS–XXL (unisex) | — no chart | — left out, labels don't match sizes sold | [stussy.com size guide](https://www.stussy.com/pages/size-guide) | tops |
| Banana Republic | ✅ XXS–XXL | ✅ XXS–XXL | ✅ 000/23–20/35 | Size Guide on [bananarepublic.gap.com](https://bananarepublic.gap.com/browse/product.do?pid=826977012) product pages | tops, dresses, jeans |
| Athleta | ✅ XXS–3X | ✅ XXS–3X | — doesn't sell jeans | Size Guide on [athleta.gap.com](https://athleta.gap.com/browse/product.do?pid=1177198062) product pages | tops, dresses |
| Urban Outfitters | ✅ XXS–XXL | ✅ XXS–XXL | ✅ 23–36 | Size Guide on [urbanoutfitters.com](https://www.urbanoutfitters.com/shop/bdg-keira-low-rise-slim-jean) product pages | tops, dresses, jeans |
| Free People | ✅ XXS–XL | ✅ XXS–XL | ✅ 00/24–16-18/33-34 (hips only) | Size Guide on [freepeople.com](https://www.freepeople.com/shop/we-the-free-good-luck-mid-rise-barrel-jeans/) product pages | tops, dresses, jeans |
| Anthropologie | ✅ XXS–XL | ✅ XXS–XL | — guide has no body measurements | Size Guide on [anthropologie.com](https://www.anthropologie.com/shop/by-anthropologie-sheer-satin-tuxedo-blouse) product pages | tops, dresses |
| Ann Taylor | ✅ XXS/00–XXL/18 | ✅ XXS/00–XXL/18 | ✅ XXS/00–XXL/18 | [anntaylor.com size chart](https://www.anntaylor.com/ANN_Size_Chart.html) | tops, dresses, jeans |
| LOFT | ✅ XXS/00–XXL/18 | ✅ XXS/00–XXL/18 | ✅ 00/24–18/34 | [loft.com size chart](https://www.loft.com/LOFT_Size_Chart.html) | tops, dresses, jeans |
| Aritzia | ✅ 3XS–2XL | ✅ 3XS–2XL | ✅ 23–32 | [aritzia.com size guide](https://www.aritzia.com/us/en/size-guide) (converted from cm) | tops, dresses, jeans |
| UNIQLO | ✅ XXS–XXL | ✅ XXS–XXL | ✅ 22–34 inch (waist only) | Size Guide on [uniqlo.com](https://www.uniqlo.com/us/en/products/E465760-000/00) product pages | tops, dresses, jeans |
| Express | ✅ XXS–XL (bust only) | ✅ XXS–XL | ✅ 000–18 | Size Chart on [express.com](https://www.express.com/clothing/women/high-waisted-relaxed-flare-medium-wash-jeans/pro/07153269/color/Mid%20Wash) product pages | tops, dresses, jeans |
| Forever 21 | ✅ XXS–XXL | ✅ XXS–XXL | — no regular women's jeans found to test | [forever21.com size guide](https://www.forever21.com/pages/sizing-guide) (plus sizes excluded) | tops, dresses |
| Garage | ✅ XXS/00–XL/15 | ✅ XXS/00–XL/15 | ✅ XXS/00–XL/15 | [garageclothing.com size chart](https://www.garageclothing.com/us/gar-size-chart.html) | tops, dresses, jeans |
| Fashion Nova | ✅ XS–3X | ✅ XS–3X | ✅ XS–3X | [fashionnova.com size guide](https://www.fashionnova.com/pages/size-guide) | tops, dresses, jeans |
| Edikted | ✅ XS–XXL | ✅ XS–XXL | ✅ XS–XXL | [edikted.com size charts](https://edikted.com/pages/size-guide) | tops, dresses, jeans |
| Princess Polly | ✅ US 0–20 | ✅ US 0–20 | ✅ US 0–20 | [princesspolly.com sizing](https://us.princesspolly.com/pages/sizing) | tops, dresses, jeans |
| Madewell | ✅ 00/XXS–26/3X | ✅ 00/XS–26/3X | ✅ 23–33 | Size Chart on [madewell.com](https://www.madewell.com/p/womens/clothing/jeans/straight-leg-jeans/the-90s-jean/OB741/) product pages | tops, dresses, jeans |
| J.Crew | ✅ XXXS/000–3X/24 | ✅ XXXS/000–3X/24 | ✅ 23–37 (waist only) | Size Chart on [jcrew.com](https://www.jcrew.com/p/womens/categories/clothing/jeans/boyfriend/embellished-lowrider-jean/CZ648) product pages | tops, dresses, jeans |
| Levi's | ✅ XXS–XXL | ✅ XXS–XXL | ✅ 23–35 | Size Guide on [levi.com](https://www.levi.com/US/en_US/clothing/women/jeans/straight/501-90s-womens-jeans/p/A19590115) product pages (plus dresses not included) | tops, dresses, jeans |
| Wrangler | ✅ XXS–XXXL | ✅ XXS–XXXL | ✅ 24–36 | [wrangler.com size charts](https://www.wrangler.com/size-charts.html) (Women > General) | tops, dresses, jeans |
| Lee | ✅ XXS–4XL | ✅ XXS–4XL | ✅ 00/24–22/36 | [lee.com size charts](https://www.lee.com/size-charts.html) (women's tops and bottoms) | tops, dresses, jeans |
| Good American | — not collected | — not collected | ✅ 00–32 (Always Fits styles excluded) | Size Guide on [goodamerican.com](https://www.goodamerican.com/products/good-low-rise-bootcut-jeans-rise) product pages | jeans |
| AGOLDE | ✅ XS–XL | ✅ XS–XL | ✅ 22–34 | [agolde.com size chart](https://agolde.com/pages/agolde-size-chart) | tops, dresses, jeans (only when the name says "jean") |
| lululemon | ✅ 0/XXXS–20-22/2X (bust only) | ✅ 0/XXXS–20/2X | — doesn't sell jeans | [lululemon women's size guide](https://shop.lululemon.com/help/size-guide/womens) (shelf-bra styles not modeled) | tops, dresses |
| Nike | ✅ XXS–XXL | ✅ XXS–XXL | — doesn't sell jeans | [Nike women's tops](https://www.nike.com/size-fit/womens-tops-alpha) / [skirts and dresses](https://www.nike.com/size-fit/womens-skirt-dress) charts (plus sizes not modeled) | tops, dresses |
| adidas | ✅ 2XS–2XL | — no women's dress chart | — doesn't sell jeans | [adidas women's tops chart](https://www.adidas.com/us/help/size_charts/women-shirts_tops) (tall and short not modeled) | tops |
| Alo Yoga | ✅ XXS–2XL | ✅ XXS–2XL | — doesn't sell jeans | [aloyoga.com size guide](https://www.aloyoga.com/pages/size-chart) (Women) | tops, dresses |
| Vuori | ✅ XXS–XXL (bust only) | ✅ XXS–XXL | — doesn't sell jeans | Size Guide on [vuoriclothing.com](https://vuoriclothing.com/products/womens-pose-scoop-maxi-dress-black) product pages | tops, dresses |
| Under Armour | ✅ XXS–3XL | — no women's dress chart | — doesn't sell jeans | [Under Armour women's tops chart](https://www.underarmour.com/en-us/t/size-guide/womens-tops/) (plus sizes not modeled) | tops |
| Tommy Hilfiger | ✅ XXS–XXL | ✅ XXS/0–XXL/22 (bust only) | ✅ 24–36 | Size Guide on [usa.tommy.com](https://usa.tommy.com/en/women/clothing/jeans/mid-rise-stretch-bootcut-jean/WW52183-1A6.html) product pages (Tommy Jeans not covered) | tops, dresses, jeans |
| Calvin Klein | ✅ XS–XL (no hips) | ✅ XS–XL (no hips) | — chart sizes don't match sizes sold | Size Guide on [calvinklein.us](https://www.calvinklein.us/en/women/apparel/dresses/relaxed-rib-mini-dress/47H379G-HMT.html) product pages | tops, dresses |
| Michael Kors | ✅ XXS/00–XXL | ✅ XXS/00–XXL | — no women's jeans found | Size Guide on [michaelkors.com](https://www.michaelkors.com/rhinestone-embellished-scuba-mini-dress/MF683LCD6E.html) product pages | tops, dresses |
| Reformation | ✅ 0/XS–24 | ✅ 0/XS–24 | ✅ 23–31 | [thereformation.com size guide](https://www.thereformation.com/fitting-and-sizes.html) (petite and extended denim not modeled) | tops, dresses, jeans |

Zara and Shein aren't supported: they publish per-product garment measurements, not a brand-wide body chart, so there's nothing to copy without estimating. Fabletics isn't supported: its product pages don't say whether an item is men's or women's, so a men's item would get a women's size. ASOS isn't supported: it's a marketplace whose chart changes by brand, and the ASOS DESIGN chart has inconsistent numbers (UK 6 hips listed smaller than UK 4).

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
- Record where the numbers came from and any exceptions (petite lines, styles that run small) in `notes`. This is for maintainers; the popup doesn't show it.

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
  ui/popup/               Popup UI (design by Anya and Heesu)
fixtures/                 Saved product pages for adapter tests
```

**Popup UI:** follows Anya and Heesu's design (Canva, page 2). It only needs `getProfile`, `saveProfile`, `clearProfile`, `getProductContext`, and `recommend`, plus the popup states in `src/ui/popup/state.ts` (setup needed, unsupported site, choose clothing type, unsupported item, fix profile, and result). Design changes go in `popup.ts` and `popup.css` without touching the engine. Fonts (Inter, Space Grotesk) are bundled into the extension, so the popup makes no network requests.

## Privacy

- The fit profile is stored only in `chrome.storage.local` on your device.
- No measurements or browsing data are sent anywhere, and there are no analytics.
- The extension has no standing site access. It reads a page only when you open the popup on a supported brand's site.
- To delete your profile, open the popup and click **Profile: … fit** at the top, then **Delete profile**.

## Team

- **Aditi Dewangan**: tech (logic and data)
- **Anya**: design and PM
- **Heesu**: design and business
