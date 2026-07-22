---
name: style-extractor
description: Extract a public website's transferable visual style into the local Vibe Vault when the user says to extract, collect, save, or analyze a website's design/style, colors, typography, spacing, radius, or shadows.
---

# Style Extractor

Use this skill for requests such as “抽取 https://example.com 的风格”, “收集这个网站的设计风格”, or “把这个网站保存到收藏册”. The output is an atomic, reusable style profile. It does **not** recreate page layout, components, or DOM structure.

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

This uses a 1440×900 headless Chromium capture, waits briefly, scrolls a few primary offsets for lazy content, then saves these staging artifacts:

```text
.style-extractor/<id>/raw.json
.style-extractor/<id>/screenshot.png
.style-extractor/<id>/draft.json
```

`draft.json` contains the normalized tokens, flattened `theme`, and any warnings. Read `draft.json` and inspect `screenshot.png` before making a style judgment. Keep the judgment grounded in both; do not infer layout or component structure from the screenshot.

Collection is deliberately limited to the visible first screen and nearby primary content. Errors during navigation are preserved as a partial `raw.json` and warning rather than silently treated as a successful extraction.

### 2. Create the human judgment

Use the current conversation model to create `.style-extractor/<id>/judgment.json` with exactly these fields:

```json
{
  "primary": "Minimalism",
  "secondary": null,
  "descriptors": ["calm", "precise", "restrained"],
  "thesis": "Write 2–4 concise sentences totaling 40–600 characters. Describe transferable visual direction grounded in the screenshot and tokens. Do not prescribe layout or components."
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

`descriptors` must contain 3–5 trimmed strings, each 2–32 characters. `thesis` must be 2–4 sentences and 40–600 characters. Do not add fields such as `do`, `avoid`, confidence, or free-form style labels: they are not part of the project judgment contract and are not used in the final site record.

### 3. Finalize locally

Run:

```sh
npm run extract -- finalize <id>
```

The finalizer validates the judgment, writes/overwrites `sites/<id>/site.json`, copies the screenshot to `sites/<id>/screenshot.png`, generates `sites/<id>/STYLE-GUIDE.md`, and atomically updates the sorted `sites/index.json`. A repeated extraction of the same host is an overwrite/update, not a second record.

Only L1/L2 stable colors may enter `tokens`, `theme`, or the generated `STYLE-GUIDE.md`; L3 transient values and L4 media values are excluded. If a color role cannot be established from eligible values, leave that role empty rather than guessing. Do not manually add a layout reconstruction to the guide.

### 4. Self-check the result

After finalizing, read:

```text
sites/<id>/site.json
sites/<id>/STYLE-GUIDE.md
sites/index.json
```

Verify that the record has the expected URL and ID, the four judgment fields survive validation, `screenshot` is `screenshot.png`, the three site artifacts exist, and `sites/index.json` has exactly one entry for the ID with matching name, URL, primary style, and accent when available.

Report any `warnings` exactly as warnings, especially “可用稳定色不足”, collection failures, or palette-fidelity results. A fidelity warning is raised when palette coverage is below 0.65 or the non-media eligible ratio is below 0.2 (or when fidelity cannot be calculated). Palette coverage compares screenshot pixels to extracted colors while excluding recorded media rectangles; it is **not** pixel-perfect layout fidelity and does not prove the source page was reproduced.

Dynamic, canvas-heavy, protected, blocked, or partially loaded pages may therefore yield incomplete tokens. Preserve the record and its warnings rather than inventing missing values; tell the user that the result is for reference.
