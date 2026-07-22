# Layout and Export Polish Plan

Date: 2026-07-22

## Goal

Refine the single remaining Codex Resets collection view so its visual spacing,
cover rendering, and export interaction are clear, consistent, and calm. Remove
Stripe from the collection and remove the low-value theme-preview area.

## Non-goals

- Do not change the underlying style-extraction model, saved token values, or
  generated guide content beyond removing UI that is no longer shown.
- Do not reproduce or otherwise alter the original site's layout.
- Do not add new collection-management features, persistent export settings, or
  additional animation families.
- Do not commit or push this work.

## Assumptions

- Stripe is no longer wanted and should be moved to the system Trash rather than
  permanently deleted.
- With one collection left, its card should retain a readable fixed maximum
  width of 556px instead of stretching across the full collection area.
- The desired copy action is always explicit about the currently selected export
  format; a successful copy should acknowledge the action briefly without
  shifting the layout.

## File scope

- `sites/index.json`: remove the Stripe entry.
- `sites/stripe/`: move the saved Stripe collection to the system Trash.
- `index.html`: adjust the collection/detail/export markup and associated copy.
- `app.js` (or the existing client-side interaction module): update selection,
  export controls, copy feedback, and keyboard behavior.
- Existing page stylesheet(s): add structural spacing, cover, detail, export,
  and motion rules; remove CSS made orphaned by the theme-preview removal.
- `docs/plans/2026-07-22-layout-export-polish.md`: maintain this plan and its
  implementation/review record.

## Execution plan

- [x] Remove Stripe from `sites/index.json`, then move the exact `sites/stripe/`
  directory to the system Trash. Confirm that the collection count is one and
  that no collection UI references Stripe.
- [x] Keep the single collection card at a maximum width of 556px. Set the
  Codex Resets cover to crop from the top (`object-position: top`) so the
  meaningful upper portion remains visible.
- [x] Remove the theme shadow from the structural detail card. Theme-specific
  shadow remains visible only in the dedicated shadow sample, preventing the
  Codex Resets hard-offset shadow from rendering as a horizontal black bar.
- [x] Define and apply structural spacing variables consistently:
  desktop section gap 46px, heading-to-content gap 16px, and internal content
  gap 18px; mobile equivalents 36px, 12px, and 16px. Apply them to every
  first-level content section, including the color section and export section.
- [x] Replace the color helper copy with plain-language guidance: “点击色卡复制色值”.
  Keep the copied value behavior and provide its feedback through the shared
  color-card toast responsibility rather than adding competing inline messages.
- [x] Remove the entire theme-preview section, including “当前 token 实时渲染” and
  “当前风格 / 仅预览 token，不复刻原站布局。” Remove only the markup, state,
  selectors, and scripts made orphaned by that deletion.
- [x] Restructure export as one accessible toolbar followed by a distinct code
  frame. The toolbar contains the four format choices (`STYLE-GUIDE`, CSS
  variables, Tailwind, and `tokens.json`) and a single dynamic copy button.
- [x] Give export controls appropriate toolbar/tab semantics, an accessible
  selected state, and deterministic keyboard handling: arrow keys cycle format
  choices, Home selects the first, End selects the last, and focus remains on
  the active control. The copy button label follows the active format (for
  example, “复制指南” or “复制 CSS”), avoiding the ambiguous “复制当前内容”.
- [x] After a successful export copy, temporarily change the active copy button
  to “已复制” for 1200ms, then restore its format-specific label. Do not alter
  the code frame height or move focus during this feedback.
- [x] Style the code frame as a separate content region with its own border,
  radius, and spacing below the toolbar. Preserve `pre` horizontal scrolling for
  long lines. At mobile widths, let format controls wrap or scroll without
  overlap and keep the copy action reachable on its own sensible row when
  needed.
- [x] Preserve the existing restrained hover, press, entry, and content-change
  motion. Ensure all newly touched interactions are interruptible, animate only
  safe visual properties, and respect `prefers-reduced-motion` by removing
  transform/scale movement while retaining concise opacity or state feedback.

## Risks and mitigations

- Removing the preview may leave stale selectors, listeners, or cached element
  lookups. Remove only references owned by that section and exercise selection
  and export flows after the change.
- Toolbar semantics can regress keyboard navigation if browser defaults and
  custom handling conflict. Keep one selected format, test arrow/Home/End
  behavior, and preserve visible focus.
- A temporary copy label can become stale after rapid format changes. Bind the
  feedback timer to the copy action and restore the label for the current active
  format.
- Moving a directory to Trash must target only `sites/stripe/`; verify the
  resolved path before the operation.
- Fixed-width single-card styling may overflow small screens. Use `max-width`
  with a fluid width constraint and verify a narrow viewport.

## Acceptance criteria

- [x] The collection contains only Codex Resets; Stripe is absent from both the
  index and visible UI, and its saved directory is in the system Trash.
- [x] The single card is no wider than 556px on desktop and remains fluid on
  mobile.
- [x] The Codex Resets cover is top-aligned and the detail card no longer shows
  a horizontal black shadow bar.
- [x] All first-level page sections use 46/16/18px structural spacing on desktop
  and 36/12/16px on mobile, with no crowded color or export headings.
- [x] The color helper says “点击色卡复制色值”, and copying a color gives one clear
  toast response.
- [x] The theme-preview section and all of its orphaned implementation are gone.
- [x] Export presents one toolbar, one current-format code frame, and a copy
  button whose label accurately names the copied format.
- [x] Arrow keys cycle formats; Home and End select the first and last formats;
  focus is visible and stable; the button shows “已复制” for 1200ms after a
  successful copy.
- [x] Long exported lines scroll horizontally inside the code frame; mobile
  controls do not overlap or hide the copy action.
- [x] Normal motion remains natural and interruptible, while reduced-motion
  removes movement without disabling meaningful interaction feedback.

## Verification

- [x] Run the project typecheck command documented in `package.json`.
- [x] Run the project test command documented in `package.json`.
- [x] Run the local development server and perform a browser smoke test at
  desktop and narrow mobile widths.
- [x] Confirm collection count, cover alignment, absence of the black detail
  shadow bar, and all specified section spacing in the rendered page.
- [x] Test all four export formats, copy labels, 1200ms feedback, color copy
  toast, arrow-key cycling, Home/End, visible focus, long-line scrolling, rapid
  format changes, and reduced-motion mode.

## Implementation Notes

- Moved `sites/stripe/` to the system Trash and removed its index entry; Codex
  Resets is now the sole collection.
- Kept the single collection card at a fluid width with a 556px desktop maximum,
  top-aligned its cover, and removed the theme shadow from the structural detail
  card.
- Applied shared structural spacing of 46/16/18px on desktop and 36/12/16px on
  mobile.
- Removed the theme-preview markup and the CSS made orphaned by it.
- Reworked export into an ARIA toolbar with roving focus, arrow-key cycling,
  Home/End selection, format-specific copy labels, and 1200ms in-place “已复制”
  feedback. The color-card copy action uses the shared toast feedback.
- Isolated exported content in a code frame with internal horizontal scrolling.
  A repeat click on the selected collection card now short-circuits rather than
  re-running selection work.
- No new runtime dependency was added. No commit or push was made.

## Review Findings

- The horizontal black bar came from two independent causes: centered cover
  cropping exposed a dark screenshot band, and the structural detail card
  inherited Codex Resets' hard-offset theme shadow. Top cover positioning and a
  shadow-free detail card resolve both.
- The first content section lacked the shared section gap, while the export
  heading and code block used adjacent spacing rules that made them appear
  crowded. Shared structural variables and the separate code frame restore the
  intended hierarchy.
- The measured toolbar-to-`pre` distance is 17px: the expected 16px margin plus
  the code-frame's 1px border. This is intentional, not a spacing deviation.
- Typecheck passed; tests passed (8/8). Desktop and mobile measurements matched
  the specified structural spacing, with no overflow. Browser smoke checks found
  no console or page errors; normal and reduced-motion behavior, color copying,
  all export formats, copy feedback, keyboard navigation, and rapid interaction
  all passed.
- No lint script is configured. Changes remain uncommitted and unpushed.
