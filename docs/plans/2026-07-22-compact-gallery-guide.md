# Compact Gallery and Style Guide Plan

Date: 2026-07-22

## Goal

Keep generated style guides focused on design parameters, and make the saved-site
gallery compact, token-driven, and pageable without loading or reproducing source
website screens.

## Scope and decisions

- Generate guides with a neutral `# STYLE-GUIDE` title and only style direction,
  semantic colors, typography, form, and CSS sections.
- Replace site screenshots in collection cards with an abstract visual specimen
  built solely from available tokens.
- Render at most eight cards per page, with native pagination controls and the
  first item of a changed page selected automatically.
- Preserve site screenshot artifacts and existing selection behavior.
- Do not commit, push, or perform browser-based verification in this task.

## Execution plan

- [x] Update the Markdown generator and its regression tests, then regenerate
  both existing guides through the shared generator.
- [x] Rework the collection-card markup and styles into independent token
  specimens; correct the accent sample contrast treatment.
- [x] Add responsive eight-item pagination, delegated events, selection updates,
  and reduced-motion-safe entry animation.
- [x] Perform scoped static checks, document implementation notes, and leave
  interactive visual verification to the user.

## Risks

- Missing tokens must remove their related specimen detail rather than inventing
  a value, except for neutral preview radius and system-font fallback.
- Pagination must not couple selection to a different page except when a user
  explicitly changes page.

## Implementation Notes

_待实施后追加；不得改写上述计划。_

- The shared guide generator now produces the six requested design-only
  sections and regenerated both stored guides from their `site.json` records.
- Collection cards are token specimens with no screenshot or mini-layout
  rendering. Each specimen uses only present roles, its own token values, a
  neutral radius fallback, and system-font fallback.
- The gallery now renders eight records per page with responsive 4/3/2 columns,
  native controls, page-local selection, and short staggered entry motion.
- Static checks covered inline-script parsing, removed legacy guide/card paths,
  and whitespace errors. User-requested browser and full-suite verification
  were intentionally not run.

## Review Findings

_待评审后追加；不得改写上述计划。_

- 用户反馈：token 预览虽紧凑，但不如原始截图易于辨认；分页文字控件不够优雅，且收藏增长时需要更自然的浏览方式。后续实现改为统一 16:10 截图卡片和原生 scroll-snap 轮播，悬停/焦点显示信息，触屏常驻。
- 用户反馈：Yeguozi 的阴影样例只有透明层、inset 高光和零位移描边，不应被视为可迁移投影。后续实现为阴影抽取增加可见外投影归一化，并以离线原始数据重新完成该记录。
