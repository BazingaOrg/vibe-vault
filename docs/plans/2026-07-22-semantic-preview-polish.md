# Semantic Preview Polish Plan

Date: 2026-07-22

## Goal

Make the saved-site cover, core-color tokens, typography-and-rhythm samples, and
export area explain themselves through the real visual values they represent.
Keep the collection view calm and legible while removing custom export-format
keyboard behavior that is no longer wanted.

## Non-goals

- Do not change saved token data, extraction logic, or generated values.
- Do not reproduce any saved website's layout, components, or page structure.
- Do not add dependencies, persistent settings, or new collection-management
  features.
- Do not commit or push this work.

## Key decisions

- `.mini` remains only as a hidden fallback: a valid screenshot is the sole
  visible cover; when the screenshot is absent or errors, the image is removed
  and `.mini` is shown.
- Covers use the screenshot's `16:10` ratio and show the full image with
  `object-fit: contain`; no visual layer may cover the screenshot in the normal
  path.
- Export format selection is a regular button group. Remove the custom arrow,
  Home, and End keyboard model, roving `tabindex`, and tab/tablist/tabpanel
  ARIA semantics. Retain native button Tab, Enter, and Space behavior.

## File scope

- `index.html`: collection status copy, screenshot/fallback rendering,
  semantic token previews, export controls and descriptions, styles, and
  client-side event handling.
- `docs/plans/2026-07-22-semantic-preview-polish.md`: plan, implementation
  notes, and review findings for this change.

## Execution plan

- [x] Update collection-card cover rendering so `.mini` is hidden whenever a
  screenshot is available and visible only for missing or failed screenshots.
  Render the screenshot at its full `16:10` aspect ratio with containment,
  preserving the whole image without a crop or overlay.
- [x] Replace the technical status copy with “本地保存 · 随时复用” and make the
  collection count read naturally as “1 个收藏”, while keeping the right side
  of the header visually balanced.
- [x] Rebuild core colors as six Chinese semantic previews: 背景、表面、正文、
  次要文字、强调色、边框. Each preview uses the represented token as a real
  background, text, action, or border rather than a uniform thin outlined
  chip. Keep the click-to-copy value behavior.
- [x] Apply a readable contrast color to every color preview. Use the extracted
  counterpart token where appropriate, otherwise calculate/select a legible
  fallback. If a role is unavailable, omit that sample rather than showing a
  misleading placeholder.
- [x] Hide extraction-only labels such as `bg`, `surface`, `text`, `muted`,
  `accent`, `border`, and stability levels `L1`/`L2` from the rendered color
  UI. Show the Chinese semantic name and copyable color value only.
- [x] Remove `L1`/`L2` from the visible `STYLE-GUIDE` export title/content label
  while preserving the guide's actual content and export behavior.
- [x] Preserve the effective type-scale presentation. Replace abstract spacing
  bars with two real elements separated by the extracted gap; show actual
  small, medium, and large rounded shapes; and show real shadowed surfaces with
  their sampled shadow values.
- [x] Convert export format controls to ordinary buttons with an `aria-pressed`
  selected state. Delete all custom keyboard listeners and tab-model ARIA/code
  made orphaned by that simplification.
- [x] Add concise, format-specific usage guidance: `STYLE-GUIDE` for coding
  agents, CSS variables for stylesheets, Tailwind for `theme.extend`, and
  `tokens.json` for programmatic reuse, archiving, or conversion.
- [x] Make export code visually wrap within its frame and remove horizontal
  scrolling, without changing the exact text placed on the clipboard.
- [x] Update this plan's Implementation Notes with the completed work and any
  deviations. Do not commit or push.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Full-image containment leaves unused cover space | Use the same `16:10` frame as the screenshot and provide a deliberate fallback background only behind contained media. |
| Token roles vary or are missing | Map only known roles to their Chinese semantic preview and omit unavailable roles; retain the existing empty state when no colors exist. |
| A token produces illegible preview copy | Choose contrast text from the token set when suitable; otherwise use a luminance-based light/dark fallback. |
| Simplifying ARIA weakens basic access | Use native `<button>` controls with `aria-pressed`, visible focus, and unchanged native keyboard activation. |
| Visual code wrapping affects copied output | Wrap only through CSS; copy the unmodified export string from state. |
| New preview shapes overflow on narrow screens | Keep all samples fluid and verify desktop and mobile widths, including the export frame. |

## Acceptance criteria

- [x] A loaded screenshot is completely visible at `16:10`, and `.mini` cannot
  cover it; `.mini` appears only when there is no usable screenshot.
- [x] The collection header says “本地保存 · 随时复用” and “1 个收藏” without
  leaving an awkwardly empty right side.
- [x] Core colors communicate their role through real backgrounds, text,
  controls, and borders; they are not all thin border chips.
- [x] Every rendered color sample has legible text, shows only its Chinese
  semantic name and color value, and still copies that value on click.
- [x] Missing color roles do not produce false samples, and the no-color empty
  state remains understandable.
- [x] `bg`, `surface`, `text`, `muted`, `accent`, `border`, `L1`, and `L2` are
  absent from visible core-color UI; `L1`/`L2` are also absent from the visible
  `STYLE-GUIDE` label.
- [x] Type scale remains demonstrative; spacing shows actual gaps, radius shows
  actual shapes, and shadow shows an actual shadowed surface.
- [x] Export uses ordinary buttons with `aria-pressed`; no custom arrow/Home/End
  format selection, roving `tabindex`, or tab/tablist/tabpanel semantics remain.
- [x] Each export format has a short, accurate purpose statement.
- [x] Export code has no horizontal scrollbar at desktop or mobile widths, wraps
  visually, and copies byte-for-byte unchanged content.
- [x] Existing color and export copy feedback, native button operation,
  reduced-motion behavior, and responsive layout continue to work.
- [x] No commit or push is made.

## Verification

- [x] Run the project's documented typecheck and test commands.
- [x] Run the local app and inspect desktop and narrow mobile layouts for full
  screenshot rendering, balanced status copy, color contrast, true token
  samples, and absent horizontal overflow.
- [x] Exercise screenshot load failure/missing-image fallback, every available
  color copy action, all four export selections, export copying, native button
  keyboard activation, and reduced-motion mode.
- [x] Confirm browser console and page-error output are clean for the changed
  flows.

## Implementation Notes

_待实施后追加；不得改写上述计划。_

- Implemented an explicit `.mini` hidden fallback: valid screenshots render
  alone in a `16:10` contained cover, while missing or failed images reveal the
  fallback.
- Replaced the collection status and count with “本地保存 · 随时复用” and “1 个收藏”.
- Rebuilt colors as six Chinese semantic previews, hid internal role and
  `L1`/`L2` labels, and retained click-to-copy values. The visible
  `STYLE-GUIDE` title now uses the theme color rather than stability metadata.
- Replaced abstract rhythm indicators with true gap, radius, and shadow samples.
- Simplified export to ordinary buttons without custom keyboard navigation;
  added all four concise format-help messages and visual `pre` wrapping without
  horizontal scrolling.
- No runtime dependency was added. No commit or push was made.

## Review Findings

_待评审后追加；不得改写上述计划。_

- Root cause: `.mini` had remained in the normal cover stack and could overlay
  the screenshot. It is now an explicit hidden-only fallback.
- Root cause: inline preview elements could not show their intended dimensions,
  and one uniform card pattern could not communicate the semantic role of each
  color. Real role-specific samples resolve both problems.
- Root cause: the export `pre` preserved long-line scrolling, while the tab
  keyboard model added interaction complexity beyond the requested behavior.
  Visual wrapping and native-button behavior now provide the intended result.
- QA found the accent preview's outer background incorrectly used `textBg`,
  producing black text on a black background with a 1:1 contrast ratio. It was
  corrected to use the accent fill with `foregroundFor`; final contrast is
  6.82:1.
- Typecheck passed; tests passed (8/8). Desktop and mobile smoke checks,
  missing/failed screenshot fallback, no-overflow, console/page-error, and
  release checks all passed. No lint script is configured. Changes remain
  uncommitted and unpushed.
