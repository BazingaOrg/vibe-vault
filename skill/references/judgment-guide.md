# Judgment guide

Read this file before creating or correcting `judgment.json`.

## Required JSON

Write exactly:

```json
{
  "primary": "Minimalism",
  "secondary": null,
  "descriptors": ["克制", "清晰", "安静"],
  "thesis": "以稳定的留白和清晰的字体层级组织内容。低饱和底色与少量强调色共同形成克制、易读的视觉气质。"
}
```

- Choose `primary` from the closed vocabulary below.
- Set `secondary` to another vocabulary item or `null`.
- Write 3–5 descriptors, each 2–32 characters.
- Write a 2–4 sentence thesis totaling 24–600 characters.
- Use one language throughout the descriptors and thesis.
- Do not add confidence, rationale, components, layout, “do”, or “avoid” fields.

## Closed style vocabulary

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

## Evidence boundaries

| Evidence | Reusable? | Treatment |
| --- | --- | --- |
| Stable palette roles, type roles, spacing, radius, border, real shadows | Yes | Keep only stable L1/L2 evidence |
| Type pairing, palette allocation, surface model, shape, spacing rhythm | Yes | Describe as visual characteristics, not layout recipes |
| Navigation, cards, dashboards, sidebars, CTA groups, page structure | No | Mention only as observed layout/components |
| Canvas/SVG series, grids, sparklines, photos, illustrations, metric colors | No | Exclude as charts/media/data ink |

Prefer colors used by body text, headings, links, controls, and recurring surfaces. Treat variable names such as `paper`, `ink`, `accent`, and `hairline` as design evidence when the color is visibly used. Treat names such as `series`, `signal`, `positive`, `negative`, `gain`, `loss`, `chart`, and `track` as data evidence unless the same color clearly appears in ordinary interface chrome.

Do not merge DOM tokens from scroll or secondary-page evidence. Use those views only to confirm that the visual direction recurs beyond one frame.

## Allowed corrections

Preserve measured values by default. If screenshots clearly contradict an inferred visual-grammar value, correct only that signal's `value`, set its source to `judged`, and explain the correction in the final user report.

If the automatic accent is clearly chart or metric ink, replace it only with another stable color already present in `draft.json`. Leave an uncertain role empty instead of guessing.

## Cover choice

Promote a different evidence screenshot only when it is cleaner and still demonstrates the same paper/ink/type/surface system. Prefer a masthead, section introduction, or typography-rich view over a chart, media canvas, cookie layer, or loading state.

## User-facing quality language

Keep raw diagnostics in `raw.json` and `site.json`. In the final response:

- describe a usable result without a success badge or numerical score;
- summarize weak primary evidence as “部分内容未识别，建议结合截图判断”;
- mention optional evidence gaps only when they materially limit the visual judgment;
- provide raw ratios, thresholds, confidence levels, and browser errors only when the user asks for technical diagnostics.
