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
