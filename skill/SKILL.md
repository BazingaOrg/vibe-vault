---
name: style-extractor
description: Extract a public website's transferable visual style into the local Vibe Vault when the user says to extract, collect, save, or analyze a website's design/style, colors, typography, spacing, radius, or shadows.
---

# Style Extractor

Use this skill for requests such as “抽取 https://example.com 的风格”, “收集这个网站的设计风格”, or “把这个网站保存到收藏册”. The output is a reusable style seed: atomic tokens plus structured visual grammar. It does **not** recreate page layout, components, or DOM structure, and must not be described as pixel-perfect reproduction.

## Before collecting

1. Confirm the request contains one valid `http` or `https` URL. Treat the host-derived ID as the record identity: `www.example.com` becomes `example-com`.
2. Work from the repository root with Node 20+ and installed dependencies. If Chromium is unavailable, install the repository dependencies/browsers as appropriate before retrying.
3. Explain that the local Playwright script does the measurement and the current conversation model performs the visual judgment. Do not call an external LLM API.

## Workflow

### 1. Collect deterministic evidence

Run exactly:

```sh
npm run extract -- collect <url>
```

This uses a 1440×900 headless Chromium capture on the **primary URL** (token sample frame), waits briefly, scrolls a few primary offsets for lazy content, then saves:

```text
.style-extractor/<id>/raw.json
.style-extractor/<id>/screenshot.png          # primary top frame used for tokens + default gallery cover
.style-extractor/<id>/draft.json
.style-extractor/<id>/evidence/
  scroll-0000.png / scroll-0450.png / scroll-1200.png
  primary-top.png
  secondary-01.png …                          # up to 2 same-host internal pages (judgment only)
  manifest.json
```

**Tokens and `raw.json` always come from the primary URL’s first-screen sample.** Multi-scroll and secondary-page PNGs are judgment-only evidence: do not merge their DOM colors into `draft.json` by hand.

`draft.json` contains the normalized tokens, structured `visualGrammar`, flattened `theme`, and any warnings. Read `draft.json`, inspect `screenshot.png`, and skim `evidence/` (especially secondary pages) before making a style judgment.

`visualGrammar` is the implementation bridge between raw tokens and a recognizable visual family. It records measured typography roles plus inferred palette allocation, stroke, surface, elevation, shape, spacing rhythm, and transferable element traits. Every signal carries `source` (`measured`, `inferred`, or `missing`) and `confidence`; preserve missing values rather than inventing them. If screenshot evidence clearly contradicts an inferred value, you may correct only that signal's `value`, change its source to `judged`, and keep the reason in your user report. Do not add component names or layout recipes.

Collection errors are preserved as a partial `raw.json` and warning rather than silently treated as a successful extraction.

#### Optional: promote a cleaner gallery cover

If the primary top frame is chart-heavy, dashboard-heavy, or otherwise poor as a style cover, copy a cleaner evidence frame over the primary screenshot **before** finalize (does not change tokens):

```sh
cp .style-extractor/<id>/evidence/<chosen>.png .style-extractor/<id>/screenshot.png
```

Prefer a frame that still shows the site’s paper/ink/type system (masthead, section intro, typography) without large data-viz canvases. Keep the primary collect URL as the record `url` unless the user explicitly asked to extract a specific subpath.

### 2. Create the human judgment

Use the current conversation model to create `.style-extractor/<id>/judgment.json` with exactly these fields:

```json
{
  "primary": "Minimalism",
  "secondary": null,
  "descriptors": ["calm", "precise", "restrained"],
  "thesis": "Write 2–4 concise sentences totaling 24–600 characters. Describe transferable visual direction grounded in the screenshot, evidence frames, and tokens. Do not prescribe layout or components."
}
```

Choose `primary` from the following closed vocabulary; `secondary` must be another item or `null`:

```text
Minimalism
Swiss-International
Neo-Brutalism
Brutalism
Glassmorphism
Neumorphism
Claymorphism
Flat
Material
Skeuomorphism
Editorial
Corporate
Dark-Tech
Retro-Y2K
Memphis
Maximalism
Luxury-Elegant
Geometric-Bauhaus
Playful-Illustrative
Organic-Natural
```

`descriptors` must contain 3–5 trimmed strings, each 2–32 characters. `thesis` must be 2–4 sentences and 24–600 characters. `descriptors` and `thesis` must use one language (follow the conversation language); do not mix Chinese and English within one record. Do not add fields such as `do`, `avoid`, confidence, or free-form style labels: they are not part of the project judgment contract and are not used in the final site record.

#### Judgment must separate sources

When reading screenshots and tokens, classify what you see. Only the first class becomes transferable style direction in `thesis` / tokens:

| Class | What it is | Into vault? |
| --- | --- | --- |
| **Design tokens** | Stable palette roles, type roles/scale, spacing unit, radius tendency, real elevation shadows, `:root` design CSS variables that recur as UI chrome | Yes — L1/L2 only |
| **Visual grammar / design elements** | Type pairing, palette allocation, stroke weight, surface/elevation model, shape language, hairlines, drop caps, ink-on-paper fields, sparse accent emphasis | Yes as structured grammar or direction; never as layout recipes |
| **Components / layout** | Nav, dashboards, card grids, segmented controls, sidebars, CTA pairs, page structure | No — never prescribe in `thesis` or STYLE-GUIDE |
| **Charts / media / data ink** | Canvas/SVG series, grids, sparklines, photos, illustrations, gain/loss greens & reds, event markers, semantic metric colors | No — L4 / excluded; mention only to warn they are *not* brand style |

Ground rules for this split:

1. Prefer colors that appear on body, headings, chrome, links, and buttons over series strokes and plot fills.
2. Treat `:root` variables named like paper/ink/hairline as design corroboration; treat names like signal/series/positive/track-plot, and pure chart strokes, as data ink unless they also dominate non-chart UI.
3. A color used both as editorial accent *and* crash markers may enter tokens as accent when it also styles non-chart text/UI; still warn the user about dual use.
4. Without explicit `:root` design variables, the automatic accent is the highest-chroma stable color; if it is clearly chart/metric ink, you may correct only the accent role to another already-present stable token in `draft.json` before finalize, and tell the user about the correction.
4. Multi-page evidence that keeps the same paper/ink/type without the chart proves the style is system-level, not a single viz artifact.

Do **not** put this taxonomy into `judgment.json` (contract stays four fields). Report the split clearly to the user after finalize.

### 3. Finalize locally

Run:

```sh
npm run extract -- finalize <id>
```

The finalizer validates the judgment, writes/overwrites `sites/<id>/site.json`, copies the (possibly promoted) screenshot to `sites/<id>/screenshot.png`, generates `sites/<id>/STYLE-GUIDE.md` with atomic tokens and composite visual grammar, and atomically updates the sorted `sites/index.json`. A repeated extraction of the same host is an overwrite/update, not a second record.

Only L1/L2 stable colors may enter `tokens`, `theme`, or the generated `STYLE-GUIDE.md`; L3 transient values and L4 media values are excluded. Media includes images, video, canvas, SVG and SVG descendants (paths, polylines, etc.). When `:root` exposes explicit design variables (`--paper`, `--ink`, `--oxblood`, `--hairline`, …), prefer them over high-chroma metric/chart ink for role anchors. If a color role cannot be established from eligible values, leave that role empty rather than guessing. Control-level tokens (`--tk-btn-*` button geometry) are deliberately excluded from the guide's CSS output: button shape is a control property, not a reusable style token. Do not manually add a layout reconstruction to the guide. Evidence PNGs stay under `.style-extractor/<id>/evidence/` and are not published into `sites/<id>/`.

### 4. Self-check the result

After finalizing, read:

```text
sites/<id>/site.json
sites/<id>/STYLE-GUIDE.md
sites/index.json
```

Verify that the record has the expected URL and ID, the four judgment fields survive validation, `screenshot` is `screenshot.png`, the three site artifacts exist, and `sites/index.json` has exactly one entry for the ID. Its gallery contract is `id`, `name`, `url`, `primaryStyle`, `secondaryStyle`, `descriptors`, `accent`, `extractedAt`, `partial`, and `validationFlags`; `partial` is true exactly when extraction `warnings` exist, while screenshot-check limitations are exposed separately as `validationFlags`. The index is ordered by `extractedAt` descending, then name and ID for a stable same-day order. Accent supports legacy semantic role labels such as `强调 accent`.

Report extraction `warnings` and screenshot `validationNotices` separately. Extraction failures and “可用稳定色不足” make the record partial. A validation notice is raised when palette coverage is below 0.65 or the non-media eligible ratio is below 0.2 (or when validation cannot be calculated), but it does not make an otherwise complete record partial. Palette coverage compares screenshot pixels to extracted colors while excluding recorded media rectangles; label it as palette coverage, not reproduction fidelity. It does **not** validate typography, visual grammar, layout, or the source page as a whole.

Dynamic, canvas-heavy, protected, blocked, or partially loaded pages may therefore yield incomplete tokens. Preserve the record and its warnings rather than inventing missing values; tell the user that the result is for reference.

### 5. Report to the user

After a successful finalize, summarize:

1. Record path, primary/secondary style, accent, extraction warnings/partial, and validation notices.
2. **Design tokens / visual grammar** worth reusing, including missing or low-confidence signals.
3. **Components / layout** seen but not captured as style.
4. **Charts / media / data colors** explicitly excluded.
5. Whether the gallery cover was promoted from `evidence/`.
