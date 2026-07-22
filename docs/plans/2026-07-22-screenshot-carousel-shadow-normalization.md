# Screenshot Carousel and Shadow Normalization Plan

Date: 2026-07-22

## Goal

Make saved-site screenshots a consistent, accessible native-scroll carousel and
exclude visual non-shadows from extracted shadow tokens.

## Scope and decisions

- Normalize shadows by parsing top-level layers safely, keeping only non-inset
  layers with visible color and either blur or x/y offset.
- Prefer repeated non-media control shadows, then area and source order, without
  site-specific conditions.
- Re-finalize Yeguozi from its existing offline raw evidence and judgment only.
- Replace token previews and pagination with screenshot cards in a native
  scroll-snap carousel; selection changes only after a card click.
- Theme page and carousel scrollbars with contrast-safe theme variables.
- Do not collect, browse-test, commit, or push.

## Execution plan

- [x] Record requirements, ownership, risks, and verification boundaries before editing.
- [x] Implement and regression-test shadow layer parsing and representative selection.
- [x] Re-normalize and finalize Yeguozi from offline artifacts; confirm Codex remains unchanged.
- [x] Replace collection pagination/specimens with equal-size screenshot carousel cards, overlay metadata, controls, progress, and themed scrollbars.
- [x] Run scoped static and data checks; document actual implementation and review findings.

## Ownership

| Work | Owner |
| --- | --- |
| Planning, implementation, scoped verification | implementation agent |
| Browser visual verification | user |

## Risks

- CSS colors may contain commas, quotes, and escaped characters; top-level
  splitting must track parentheses, strings, and escapes.
- Native scrollbar presentation varies on macOS; the CSS must remain safe where
  the browser exposes no persistent scrollbar.
- Carousel controls must not change the selected site or reset scroll position.

## Acceptance criteria

- Transparent, inset-only, and zero-offset/zero-blur outline layers yield no
  shadow; valid hard and blurred shadows remain.
- Yeguozi stores `none` as its shadow and guide; Codex retains its 3px hard shadow.
- Screenshot cards share one 16:10 media area and fixed card structure across
  viewport breakpoints; metadata is hover/focus-only for fine pointers and
  persistent for coarse pointers.
- Controls are icon-only, disabled at bounds, hidden without overflow, and show
  visible item progress. Scrollbars follow the selected theme when supported.

## Implementation Notes

_待实施后追加；不得改写上述计划。_

- Added a top-level CSS shadow parser that tracks parentheses, quoted strings,
  and escapes. It rejects transparent, inset, and outline-only layers and ranks
  remaining non-media evidence by qualifying control use, frequency, area, and
  source order.
- Added shadow regressions for comma-bearing colors, legacy and slash-alpha
  transparency, inset-only and outline-only values, mixed layers, hard shadows,
  candidate frequency, and both stored raw fixtures.
- Rewrote the existing Yeguozi staging draft from its saved raw normalization
  result, then ran the standard offline finalizer. Its guide and site record now
  use `none`; Codex data and screenshot artifacts were not regenerated.
- Replaced paged token specimens with a one-pass screenshot carousel. Cards use
  a fixed 16:10 media box, native horizontal scrolling and snapping, responsive
  widths, icon controls, visible-item progress, and theme-safe scrollbar colors.
- Removed the five obsolete token-card metadata selectors from the existing
  compressed base CSS without changing any remaining declarations.

## Review Findings

_待评审后追加；不得改写上述计划。_

- Inline JavaScript compiles through `new Function`; whitespace validation
  passes. The targeted shadow command executes the repository test file under
  its runner and reports the shadow cases passing after the parser correction.
- Browser visual verification, assistive-technology checks, and full project
  type checking remain intentionally unrun for user verification.

## Follow-up: Compact carousel controls and absent shadow sample

### User feedback

- The `无阴影 / none` sample is redundant and should be hidden.
- With two saved sites, the cards currently fit together and do not behave as a
  carousel; with one saved site, controls must not imply unavailable navigation.
- The expected icon arrows and concise progress are not visible under the
  current fit-based condition, and the cards remain too large.

### Root cause

- Card widths are percentage-based, so two cards can fit the available row;
  controls are then hidden based on physical overflow rather than item count.
- Active-card and arrow navigation use the left edge and `scrollIntoView`, which
  does not match a compact centered carousel and can affect page scrolling.
- The shadow panel always renders a sample even when the normalized token is
  absent or `none`.

### Follow-up plan

- [x] Constrain the gallery and controls to the approved responsive widths and
  preserve 16:10 media with a compact, overflow-producing card width.
- [x] Base controls on item count, calculate the active card from viewport and
  card centers, and use horizontal `scrollTo` navigation with reduced-motion
  handling.
- [x] Hide and clear the shadow sample for missing, empty, or case-insensitive
  `none` values; keep the panel title synchronized with its content.
- [x] Add visible keyboard focus treatment and scoped static checks only.

### Follow-up acceptance criteria

- Zero items clear status and hide controls; one item stays left-aligned and
  hides controls; two or more always expose disabled-at-boundary arrows and
  `current / total` progress.
- At desktop, <=900px, and <=600px breakpoints, the approved card widths leave
  room for a following card whenever at least two cards exist.
- A missing or none shadow yields the `圆角` heading and no shadow box; a valid
  shadow restores `圆角 / 阴影` and its sample.

### Follow-up implementation notes

- Implemented the approved 560px/520px/full-width gallery limits and the
  360px, 320–340px, and 272–340px card rules without spacer elements.
- Controls now follow the number of cards, use an rAF-coalesced center-distance
  active index, and horizontally target neighboring card offsets through
  `scrollTo`.
- Added explicit carousel relationships/live atomic status, focus-visible
  outlines, and synchronized absent-shadow hiding.

### Follow-up review notes

- `new Function` compiles the inline script and `git diff --check` passes.
- Static search confirms no residual `scrollIntoView` or left-edge carousel
  selection logic. The responsive inequalities remain overflow-positive for two
  cards: 2×360+14>560, 2×320+14>520, and at <=600px each card is at least
  272px plus a 10px gap while the gallery is the available viewport width.
- Per scope, no browser, Playwright, typecheck, or full-test verification was
  run; visual and assistive-technology behavior remains for user verification.

## Follow-up: Responsive saved-site grid

### User confirmation

- Replace the saved-site carousel with a normal responsive grid: four columns
  on desktop, three at tablet widths, and two on mobile.

### Root cause and decision

- A horizontal carousel adds controls, overflow state, and progress semantics
  that are unnecessary when saved sites should be scanned together.
- Replace the carousel structure and behavior with a CSS grid. Retain the
  existing card selection, screenshot treatment, overlay metadata, responsive
  coarse-pointer behavior, and page-level themed scrollbar.

### Acceptance criteria

- The gallery is a four-column grid by default, three columns at `<=900px`, and
  two columns at `<=600px`; every screenshot remains a 16:10 top-cropped media
  area with equal card sizing per row.
- No carousel controls, progress, horizontal scrolling, scroll snapping,
  carousel JavaScript, or carousel-only scrollbar styles remain.
- At `<=600px`, overlays show the site name and primary/secondary style only;
  descriptor text is hidden and long style text truncates safely.
- Shadow absence and rounded-corner title behavior remain unchanged.

### Execution plan

- [x] Record this confirmed follow-up, then replace carousel markup, CSS, and
  JavaScript with the responsive grid.
- [x] Run only the agreed inline-script compilation, targeted residual searches,
  scrollbar-presence check, and whitespace validation.

### Implementation Notes

_待实施后追加；不得改写上述计划。_

- Replaced the gallery wrapper and carousel controls with a semantic saved-site
  gallery grid: four columns by default, three at `<=900px`, and two at
  `<=600px`. Cards now take their width from the grid while retaining 16:10
  top-cropped screenshots.
- Removed carousel markup, controls, progress state, horizontal scrolling,
  snapping, carousel scrollbar styling, scroll listeners, `ResizeObserver`, and
  related navigation JavaScript. The selected-theme page scrollbar and its
  runtime thumb-color update remain.
- Preserved card selection, `aria-label`, `aria-pressed`, focus treatment,
  fine/coarse-pointer overlay behavior, and the absent-shadow rendering logic.
  At the two-column breakpoint, overlay padding and type are reduced,
  descriptor text is hidden, and the style line truncates safely.

### Review Notes

- The inline script compiles through `new Function`; targeted `rg` finds no
  residual carousel, scroll-snap, control, or `ResizeObserver` code in
  `index.html`. Page scrollbar CSS and dynamic `--scroll-thumb` updates remain.
- `git diff --check` passes. Per user scope, browser/Playwright visual checks,
  type checking, and full tests were not run.
