# Token preview resilience

日期：2026-07-23
状态：已完成

## 目标与边界

只修复详情页的 token 预览可读性和字体栈摘要展示。不修改 `normalize.ts`、`schema.ts`、`site.json` 或抽取契约；重复的合法角色颜色必须仍可原样展示。

## 计划

- [x] 在 `assets/theme.js` 集中可测试的颜色对比、预览背板和字体栈解析辅助函数。
- [x] 在 `assets/render.js` 按角色输出语义化预览结构，保留复制行为并使用安全元数据前景色。
- [x] 在 `assets/styles.css` 添加独立展柜边界、角色图形、键盘焦点与强制色彩模式回退。
- [x] 为纯辅助函数补充 Node 测试，并保留既有 `surface=border` normalize 回归。
- [x] 运行轻量 typecheck、test 与 diff check；正式浏览器回归交由 QA。

## 关键决定

- `border` token 只绘制真实的 2px 描边；它绝不用于标签或十六进制文字。
- 预览背板优先选背景/表面中与 token 对比更高者，均低于 3:1 时退回黑白中更可辨者。
- 字体栈解析识别引号与转义，仅将首个字体用于摘要；完整原值保留在页面标题属性。

## 风险

- CSS 自定义颜色可在浏览器由平台解析；纯 Node 测试覆盖确定的 hex/rgb 输入及安全回退，浏览器视觉和强制色彩模式仍需 QA 验证。
- 色卡使用内联 token 色值，必须持续 HTML 转义，避免记录数据破坏预览结构。

## Implementation notes

- `theme.js` 现提供共享的 `contrastRatio`、`previewBackdropFor`、安全前景色与字体栈解析；Node 环境可直接验证 hex/rgb 色值，无 DOM 依赖。
- `render.js` 为六种语义角色输出不同的预览图形，`border` 只作为 2px 边框绘制，复制按钮保留 `data-copy` 并使用完整的中文 aria 标签。
- `#font-stack` 显示首字体和回退数量，`title` 保留未改动的完整 `fontSans` 原值；CSS ellipsis 仅做窄宽度保护。

## QA

- `npm run typecheck`：PASS。
- `npm test`：PASS（20/20）。
- `git diff --check`：PASS。
- 浏览器回归：Yeguozi 六角色预览、字体摘要、1440px 与 375px 无横向溢出、console 无异常：PASS。
- 键盘回归：色卡聚焦后 Enter 与 Space 各单次复制：PASS。
- 未覆盖：forced-colors 模式。

## Review / 修复记录

- 问题：QA 在色卡聚焦后发现 Enter/Space 的复制反馈不可靠。
- 根因：色卡原本已是原生 button，浏览器会为 Enter/Space 合成 click；问题来自没有沿着真实 button 焦点路径验证（例如仅派发 keydown 不会触发默认的 click）。
- 修复：复制、卡片和筛选操作收敛至 `activate()`，document click 委托是唯一入口；色卡显式输出 `type="button"`。不添加 keydown 监听，避免同一键盘操作与原生合成 click 双触发。
