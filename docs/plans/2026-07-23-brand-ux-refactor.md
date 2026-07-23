# 品牌统一 · 画廊扩展性 · 代码解耦

日期：2026-07-23
状态：已完成

## 背景

三项诉求：① 图标与站点命名统一为项目名；② UI/UX 与文案优化，重点是「我的收藏」在收藏量增长后的体验（不要分页）；③ clean code、性能、skill 优化与文件间适度解耦。

讨论后追加/修订：④ 弃用紫色默认主题（原为硬编码的 Stripe 风兜底配色，与项目定位无关），改为「暖纸墨黑 + 朱橘」品牌主题；⑤ 图标弃保险柜隐喻，改为「抱色卡的松鼠」（松鼠囤宝 = 收藏风格），且只用品牌固有色，不与收藏内容耦合；⑥ 增加页面 loading（骨架屏）。

## 现状问题

1. 品牌割裂：页面标题「网站风格收藏」、README 叫 `vibe-vault`、favicon 配色（#fff4dd/#ff5c2b）与页面默认主题（#635bff/#0a2540）互不相关。
2. 启动性能：`boot()` 并行拉取所有 `site.json`，收藏量大时首屏变慢；画廊卡片渲染依赖这次全量拉取。
3. 单文件内联：样式与脚本全部内联在 `index.html`，行长极大，难以 review 和维护。
4. 数据契约分散：`index.json` 字段在 `persist.ts`（写入方）与 `index.html`（消费方）各自隐式约定，没有单一定义源。

## 方案

### Phase 1 — 品牌统一（fast-worker）

1. **品牌默认主题**（替换紫色兜底）。定位：默认主题是「画廊的墙」，安静衬托收藏的风格，不自成强风格。色板：

   | 角色 | 色值 | 说明 |
   |---|---|---|
   | 背景 `--tk-bg` | `#faf7f2` | 暖纸白 |
   | 表面 `--tk-surface` | `#f3eee5` | 米色 |
   | 正文 `--tk-text` | `#1c1a17` | 墨黑 |
   | 次要 `--tk-muted` | `#6b645a` | 暖灰 |
   | 强调 `--tk-accent` | `#d4552b` | 朱橘，仅点缀 |
   | 边框 `--tk-border` | `#e7e0d3` | 浅米线 |

   同步修改两处硬编码：`index.html` 的 `:root` CSS 变量与 JS `defaults` 对象（含 shadow 色从 `rgba(10,37,64,…)` 改为墨色基）。
2. 重绘 `favicon.svg`：**抱色卡的松鼠**——朱橘色（`#d4552b`）松鼠剪影（圆润大尾巴保证小尺寸辨识度），怀抱一张米金（`#e7dcc8`）小色卡代替橡果，眼睛等细节用墨黑（`#1c1a17`），底为暖纸白（`#faf7f2`）圆角方块。意象：松鼠囤宝 = 把喜欢的风格收进自己的小金库。只用品牌固有色，不使用任何已收藏站点的颜色，图标与收藏内容解耦；16px 下以剪影轮廓可辨，无细线条。
3. 命名统一为 **Vibe Vault**：
   - `<title>` → `Vibe Vault · 风格收藏册`；补 `<meta name="description">`。
   - 页头 h1 → `Vibe Vault`，eyebrow/副标题保留中文说明（见 Phase 2 文案）。
   - README 一级标题保持 `vibe-vault`，首段补一句中文名对照；`SKILL.md` 中 "Vibe Vault" 用法已一致，仅核对。
   - 验证：全仓 grep「网站风格收藏」无残留（除历史 plan 文档）。

### Phase 2 — UI/UX 与文案（fast-worker，文案由 orchestrator 定稿）

1. **画廊扩展性（无分页）**：
   - 画廊改为仅由 `index.json` 渲染（需要 Phase 3 先扩充 index 字段），`site.json` 延迟到点选时才拉取——收藏量增长不再拖慢首屏。
   - 卡片加 `content-visibility:auto` + `contain-intrinsic-size`，上百张卡片时跳过屏外渲染。
   - 顶部加**风格筛选 chips**（按 primaryStyle 聚合，含「全部」）+ 关键字过滤输入框（匹配名称/风格/描述词）；纯前端过滤，无分页。收藏 ≤8 个时隐藏筛选行，避免过度设计。
   - 排序：按采集时间倒序（最新在前），index.json 补 `extractedAt`。
2. **页面 loading（骨架屏）**：
   - 画廊初始渲染若干张米色骨架卡（与卡片同尺寸，柔和呼吸动画，`prefers-reduced-motion` 下静态），数据就绪后替换为真实卡片；替代现在仅一行「正在载入收藏…」裸文本。
   - 详情区风格文档加载时用骨架条替换现有纯文字占位；status 文案配合更新。
3. **交互细节**：点选卡片后平滑滚动到详情区；筛选后计数文案随之更新（如「12 / 34 个收藏」）。
4. **文案统一为「收藏册」语感**（示例，实施时定稿）：
   - 副标题：「收藏喜欢的网站风格，积累审美，也为下一次设计找到方向。」（保留）
   - status：「正在打开收藏册…」→ 成功「N 份风格 · 全部本地保存」；失败文案保留 HTTP 提示。
   - 空态：「收藏册还是空的。用 style-extractor 抽取第一份风格吧。」
   - toast：「已复制 {value}」；文档按钮「复制风格文档」保留。

### Phase 3 — 解耦与性能（fast-worker，契约设计由 orchestrator 把关）

1. **拆分 `index.html`**：`index.html`（结构）+ `assets/styles.css` + `assets/app.js`（ES module）。app.js 内部按职责分小模块但不过度拆：`app.js`（装配/事件）、`render.js`（画廊+详情渲染）、`theme.js`(主题/对比度工具)。零构建不变，仍以静态服务器直开。
2. **统一数据契约**：`index.json` 条目扩充为画廊所需全量字段：`id/name/url/primaryStyle/secondaryStyle/descriptors/accent/extractedAt/partial`(是否部分抽取)。
   - `persist.ts` 按此写入；`schema.ts` 补类型并作为唯一定义处；`SKILL.md` 数据结构说明同步。
   - 回填现有 2 个收藏的 index 条目（从各自 site.json 取值）。
3. **skill 脚本 clean pass**：核对 normalize/persist 与新契约一致，不做无关重构。

### Phase 4 — 验证（qa-runner）

1. `npm run typecheck` + `npm test` 通过。
2. `npx serve .` 手动/脚本验证：画廊渲染、筛选、点选详情、主题切换、复制、空态（临时清空 index 验证）。
3. 回归：两个现有收藏的详情数据与改造前一致。

## 关键决策

- **不分页、不虚拟列表**：`index.json` 单文件 + 懒取 `site.json` + `content-visibility` + 筛选，足以支撑数百收藏；虚拟列表在此规模是过度设计。
- **不引入构建工具**：拆文件用原生 ES module，保持 `npx serve .` 即用。
- **筛选行自适应隐藏**：收藏少时不显示，避免空筛选器的噪音。

## 风险

- 拆分内联 CSS/JS 属大改动，需 Phase 4 完整回归；主题切换依赖 `document.documentElement` 上的 CSS 变量注入，拆分后行为不变但需重点验证。
- `index.json` 契约变更需同时改 persist.ts 与前端，属跨端一致性风险——以 schema.ts 为唯一真相源缓解。

## 执行清单

- [x] P1-1 品牌默认主题替换（:root 变量 + JS defaults，弃紫色）
- [x] P1-2 重绘 favicon.svg（抱色卡的松鼠，品牌固有色）
- [x] P1-3 标题/命名统一 + meta description
- [x] P3-1 拆分 index.html → styles.css / app.js（先拆，后续改动基于新结构）
- [x] P3-2 index.json 契约扩充 + persist/schema/SKILL.md 同步 + 回填
- [x] P2-1 画廊改为 index.json 驱动 + 懒取详情 + content-visibility
- [x] P2-2 骨架屏 loading（画廊 + 文档区）
- [x] P2-3 筛选 chips + 关键字过滤 + 排序 + 计数
- [x] P2-4 交互细节 + 文案定稿
- [x] P4 typecheck / test / 浏览器回归

## Implementation notes

- `index.html` 现仅保留页面结构，样式、主题工具、渲染与状态装配拆至 `assets/` 原生 ES modules；`docs/style-extractor-plan.md` 已补充旧五字段索引契约已被新 `IndexEntry` 契约取代的历史说明。
- `IndexEntry` 成为索引唯一类型；写入方从完整记录安全映射，使用兼容的语义色角色解析 accent，并按已有日期字符串倒序、名称和 ID 稳定排序。
- 画廊只读索引，首项和后续点选各按需读取一个 `site.json`，完整记录缓存；两次异步读取都由 selection version 防止快速切换回写。
- 正式 typecheck、test 和浏览器回归留给 QA 阶段。

## Review / 验证记录

- 未发现 review issue。
- QA 已通过：`npm run typecheck`、`npm test`（17/17）与 `git diff --check`；浏览器覆盖初始懒加载、详情切换、主题切换、复制、390px 响应式无横向溢出、无 console/pageerror/404、快速 A→B 切换竞态，以及临时注入 9 条索引后的筛选行和 chips。
- 未覆盖风险：空索引、site.json 失败态与 STYLE-GUIDE.md 失败态未通过真实浏览器注入验证。
