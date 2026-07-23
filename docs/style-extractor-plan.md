# 网站设计风格收藏册 · 实施方案（交给 AI 在新 repo 实现）

> 历史设计记录（2026-07-23）：其中的五字段 `index.json` 示例已被 `IndexEntry` 九字段画廊契约替代；以 `skill/SKILL.md` 和 `skill/scripts/schema.ts` 为准。

> 这份文档是给编码 agent（Codex / Claude Code）的实现规格。照着 §10 的顺序做即可。
> 配套参考实现：`style-gallery-prototype.html`（前端结构 + 数据模型的活样例，直接照抄结构）。

---

## 1. 定位（一句话锁死，不要跑偏）

做一个**本地的网站设计风格收藏册**。看到喜欢的网站 → 在编辑器 chat 里说一句 → 自动抽取它的**原子化设计风格**（整体风格、字体、主题色、圆角、阴影、间距密度）→ 落库成一条记录 → 收藏册页面展示，并支持**把整个页面主题切换成该网站的风格**、一键复制多种产出。

**要什么**：可迁移的「原子化风格画像」——改造别的项目网页时的**方向锚**。
**不要什么**：布局、组件结构、页面骨架的 1:1 复刻。这是刻意排除的（也正好避开这类工具最不准的部分）。

产出主角是 `STYLE-GUIDE.md`：一段「原则 + 少量锚点值」的祈使句 prompt，粘给别的项目的 agent 用。

---

## 2. 架构总览

分两层，各司其职：

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  抽取 skill（生成器）         │  写入   │  收藏册前端（展示器）          │
│  跑在 Codex / Claude Code    │ ─────▶ │  单文件 HTML，读 sites/ 目录   │
│  用你的订阅算力，不烧 API     │ sites/ │  画廊 + 主题切换 + 复制         │
└─────────────────────────────┘        └──────────────────────────────┘
```

- **抽取 skill**：项目级 skill（放 `.claude/skills/` 与 `AGENTS.md`），在 chat 里说"抽取 https://xxx 的风格"即触发。内部跑一段 Playwright 脚本取精确值 + 用当前对话的模型（你的订阅）做风格判定和文字改写，产出写进 `sites/<id>/`。
- **前端**：纯静态、零构建，读 `sites/` 下的 JSON 渲染。主题切换只换 CSS 变量、不换 DOM 结构（所以选原生栈）。

**成本**：Playwright 本地跑，改写用订阅模型，存储是仓库里的文件 → API 成本为 0。

---

## 3. 统一数据模型（地基，先定死）

每个网站 = `sites/<id>/site.json` 一条。**这一份数据同时驱动：主题切换、色卡、字阶、全部复制格式。** 参考原型里的 `SITES` 数组即为此结构的活样例。

```jsonc
{
  "id": "stripe",                    // slug，来自域名
  "name": "Stripe",
  "url": "https://stripe.com",
  "extractedAt": "2026-07-22",

  "style": {                         // 来自截图视觉判定 + 文字改写
    "primary": "Minimalism",         // 必须取自 §5 封闭词表
    "secondary": "Editorial",        // 可为 null
    "descriptors": ["minimal","calm","premium"],
    "thesis": "克制的现代极简……"       // 2-4 句方向性描述
  },

  "tokens": {                        // 原子值，来自 computed styles
    "colors": [
      { "role":"背景 bg", "hex":"#ffffff", "stability":"L1", "freq":0.42 }
      // role / muted / text / accent / surface / border …
    ],
    "typography": {
      "fontSans": "\"Inter\", -apple-system, sans-serif",
      "contrast": "高对比",
      "scale": [ { "role":"H1","px":48,"w":700,"lh":1.1 }, … ]
    },
    "space":  { "unit":8, "density":"偏疏 airy", "scale":[8,16,24,48,80] },
    "radius": { "tendency":"圆润 rounded", "sm":6,"md":10,"lg":16 },
    "shadow": { "weight":"轻 light", "md":"0 2px 8px rgba(10,37,64,.08)" }
  },

  "theme": {                         // tokens 拍平成主题切换用的 CSS 变量（前端直接注入 :root）
    "--tk-bg":"#ffffff", "--tk-surface":"#f6f9fc", "--tk-text":"#0a2540",
    "--tk-muted":"#425466", "--tk-accent":"#635bff", "--tk-border":"#e6ebf1",
    "--tk-font-sans":"…", "--tk-font-display":"…",
    "--tk-radius":"10px", "--tk-shadow":"…", "--tk-space":"8px",
    "--tk-btn-radius":"8px", "--tk-btn-border":"transparent", "--tk-btn-shadow":"…"
  },

  "screenshot": "screenshot.png"     // 同目录，做卡片封面
}
```

外加一个索引 `sites/index.json`（`[{id,name,url,primaryStyle,accent}]`）供画廊快速加载。

---

## 4. 抽取 skill 设计（核心 pipeline）

`SKILL.md` 让 agent 按下面 5 步走。前 3 步靠脚本（精确、不耗模型），后 2 步靠订阅模型（判断、改写）。

**Step 1 — 采集（Playwright，computed styles）**
打开 URL，桌面视口为主（可选加移动视口），滚动触发懒加载，遍历可见元素读 `getComputedStyle`，收集：颜色（含背景/文字/边框）、字体族/字号/字重/行高、border-radius、box-shadow、padding/margin、以及 `:root` 上的 CSS 变量。同时截一张首屏图存 `screenshot.png`。
> 参考实现可 fork：`arvindrk/extract-design-system`（107⭐，维护活跃）或直接抄 `jasonhnd/design-md-generator` 的 `scripts/extract.ts` 思路。

**Step 2 — 稳定性分层（关键，决定产出质量）**
给每个值打 L1–L4 标签，判定标准："这个值 6 个月后还成立吗？"
- L1 基础设施（永久：导航色、正文色、字体系统）→ 保留
- L2 系统（改版周期：按钮样式、卡片阴影、间距）→ 保留
- L3 活动（单次上线：hero 强调色、促销 banner）→ 标注但一般不进锚点
- L4 内容（时刻在变：产品图配色）→ **丢弃**
`STYLE-GUIDE` 只用 L1 + L2，这样抽出的是"品牌风格"而非"当期内容噪声"。

**Step 3 — 归一与聚类**
颜色用 OKLCH ΔE 感知色差聚类去重（避免 20 个几乎一样的灰），按出现频率排序取代表色，映射到固定角色（bg/surface/text/muted/accent/border）。字号/间距去重取整成阶梯。

**Step 4 — 风格判定（订阅模型 + 截图）**
把 `screenshot.png` + 聚类后的 token 摘要交给当前对话模型，让它从 §5 封闭词表里选 `primary`（必要时 `secondary`），给 3–5 个 `descriptors`，写 2–4 句 `thesis`。**风格名必须从词表选，不许自由发挥**（保证收藏册可筛选、一致）。

**Step 5 — 生成产出并落库**
按 §6 模板生成 `STYLE-GUIDE.md`；把上面所有东西组装成 `site.json` 与 `theme` 映射；写入 `sites/<id>/`；更新 `sites/index.json`。

**验证（每次抽完自检）**：像素级保真校验——用抽出的调色板重绘 vs 原站截图（排除图片区域）比对覆盖率；覆盖率过低就提示该站可能是动态/canvas 站，结果仅供参考。

---

## 5. 设计风格封闭词表（AI 只能从这里选）

```
Minimalism 极简 · Swiss-International 瑞士国际主义 · Neo-Brutalism 新粗野 ·
Brutalism 粗野 · Glassmorphism 玻璃拟态 · Neumorphism 新拟态 ·
Claymorphism 粘土拟态 · Flat 扁平 · Material · Skeuomorphism 拟物 ·
Editorial 编辑杂志 · Corporate 企业商务 · Dark-Tech 暗黑科技 ·
Retro-Y2K 复古千禧 · Memphis 孟菲斯 · Maximalism 极繁 ·
Luxury-Elegant 奢华优雅 · Geometric-Bauhaus 几何包豪斯 · Playful-Illustrative 手绘活泼 ·
Organic-Natural 有机自然
```
规则：`primary` 必选其一；真实网站常混搭，`secondary` 可再选一个或留 null；`thesis` 负责讲这一个站的独特处。

---

## 6. STYLE-GUIDE.md 模板

原型里的 `toGuide()` 就是可运行的生成器，产出形如：

```markdown
# STYLE-GUIDE · Stripe
> 用途：给前端改造定方向的可迁移风格画像。只含原子与原则，不含布局/组件/结构。整段粘给编码 agent。

## 风格定调
主风格：Minimalism · 次风格：Editorial
气质词：minimal / calm / premium / trustworthy
克制的现代极简。信息优先于装饰，靠留白和单一强调色营造高级与可信感……

## 主题色（只保留 L1/L2 稳定色）
- 背景 #ffffff · 分隔面 #f6f9fc · 正文 #0a2540 · 次要 #425466
- 强调 #635bff，只用于 CTA 与关键数据，占比 <5%
- 用法：大面积中性打底 + 强调色克制点缀 = 观感来源，别铺满强调色。

## 字体
- 字体栈：\"Inter\", -apple-system, sans-serif
- 层级：高对比（标题 48/700，正文 16/常规），不引入装饰字体。

## 间距 / 密度
- 基准 8px，整体偏疏；用留白而非分隔线建立节奏。

## 圆角 / 阴影
- 圆角倾向：圆润（约 10px）
- 阴影：轻（0 2px 8px rgba(10,37,64,.08)）

## 该做 / 该避免
- 做：强调色克制、留白撑场、层级靠字重字号。
- 避免：多强调色并置、重阴影、信息紧凑堆叠。
```

核心原则：**每条 = 原则 + 少量锚点值**，可套任何项目；读者是 AI，用祈使句。

---

## 7. 前端页面结构（原生 HTML/CSS/JS，见原型）

**换肤机制**：全站样式都用 `var(--tk-*)`；切主题 = JS 把某站 `theme` 里的变量 `setProperty` 到 `:root`。DOM 不动，只有变量变 → 完美契合"切风格不切结构"。

页面分区（原型已实现，照抄）：
1. **预览卡画廊**（本页主入口）：每个网站一张卡，卡内用该站自身风格变量渲染一个「迷你模拟页」做封面（真实版换成 `screenshot.png`），下方名称 + 主风格标签 + 强调色圆点。**点任意卡 = 整页换肤 + 选中态高亮 + 下方详情同步切换**。
2. Hero：当前风格名 + 主/次风格标签 + 气质词 + thesis
3. 色卡区：swatch 网格，带角色/hex/稳定性标签，**点击复制 hex**
4. 字体区：字阶实样 + 字体栈说明
5. 间距/圆角/阴影：三联可视化（间距条 / 圆角方块 / 阴影样例）
6. 活预览：主/次按钮 + 卡片，用当前风格实时渲染
7. **代码查看器（查看 + 复制）**：tab 切 `STYLE-GUIDE.md / CSS 变量 / Tailwind / tokens.json`，`<pre>` 里**先显示原文**，右上角一键复制当前 tab。均从数据现算（见原型 `toGuide/toCSSVars/toTailwind/toJSON`）。

交互两层：预览卡负责「切风格 + 视觉查看」，代码查看器负责「原文查看 + 复制」——不盲复制。

---

## 8. 目录结构

```
repo/
├─ index.html                 # 收藏册前端（单文件，读 sites/）
├─ sites/
│  ├─ index.json              # 画廊索引
│  ├─ stripe/
│  │  ├─ site.json            # §3 数据模型
│  │  ├─ STYLE-GUIDE.md       # 主产出
│  │  └─ screenshot.png
│  └─ …
├─ skill/
│  ├─ SKILL.md                # §4 的 5 步流程说明
│  └─ scripts/extract.ts      # Playwright 采集 + 归一
├─ .claude/skills/…           # 让 Claude Code 识别（软链或副本）
├─ AGENTS.md                  # 让 Codex 识别
└─ package.json               # playwright 依赖
```

---

## 9. 技术选型

- 前端：原生 HTML/CSS/JS 单文件，CSS 变量换肤，`navigator.clipboard` 复制。零依赖、零构建。
- 抽取：Node 20+ / TypeScript + Playwright（Chromium）。颜色处理用 `culori`（OKLCH/ΔE）。
- 风格判定 & 文字改写：当前对话模型（Codex/Claude），不接外部 API。
- 存储：仓库内文件（`sites/`）。将来要搜索/多人再上 SQLite 或 Supabase。

---

## 10. Step-by-step 实施顺序（交给 AI 按序做）

1. **建骨架**：目录结构（§8）、`package.json` 装 Playwright + culori、放一条手写 `sites/stripe/site.json`（照 §3）。
2. **先做前端**：把 `style-gallery-prototype.html` 落成 `index.html`，改成从 `sites/index.json` + 各 `site.json` `fetch` 加载（原型里的 `SITES` 常量改成运行时读取）。此时用手写数据就能看到完整形态。
3. **写采集脚本** `skill/scripts/extract.ts`：输入 URL → Playwright 取 computed styles + 截图 → 输出 `raw.json`（Step 1）。
4. **写归一层**：稳定性分层（Step 2）+ OKLCH 聚类映射角色（Step 3）→ 输出 `tokens` 与 `theme`。
5. **写 SKILL.md**：描述 5 步流程，规定风格判定用 §5 词表、产出用 §6 模板、落库路径与 `index.json` 更新。
6. **接风格判定**：skill 让模型读截图 + token 摘要，产出 `style` 段与 `STYLE-GUIDE.md`。
7. **加验证**：像素保真校验脚本 + 抽取后自检提示。
8. **跑通闭环**：chat 里说"抽取 <url>" → `sites/` 多一条 → 刷新 `index.html` 出现新卡、可切主题、可复制。

**验收标准**：给一个新 URL，一句话触发，30–90 秒内 `sites/` 新增一条完整记录；前端刷新后能切到该风格、整页换肤、四种复制都正确；`STYLE-GUIDE.md` 是"原则+锚点"的祈使句、无布局/组件内容。

---

## 11. 借用与致谢（可 fork 的现成件）

- 抽取引擎参考：`arvindrk/extract-design-system`（MIT，最活跃）、`jasonhnd/design-md-generator`（架构最全，稳定性分层/保真校验的出处）。
- 产品形态参考：designstyles.xyz（画廊 + 复制的收藏册形态，把它的云服务换成本地 Playwright + 你的订阅）。
- 引擎是通用件、可替换；**项目的差异化 100% 在"稳定性分层 + 方向性改写 + 换肤收藏册"这三样自研部分**。

---

## 12. 实现注意点（容易卡壳的细节，先定死免得 AI 各写各的）

1. **颜色 → 角色的映射启发式**（Step 3 的关键，别让 AI 随意分）：
   - `bg` = 视口内面积最大的背景色；`text` = 与 bg 高对比、最常用于文字节点的色；
   - `surface` = 介于 bg 和 border 之间、用于卡片/区块背景的次背景色；
   - `border` = 低对比分隔线色；`muted` = 次要文字色（对比低于 text）；
   - `accent` = 高饱和、低频、集中出现在按钮/链接/图标上的色（**优先取 L2，排除 L3 促销色**）。
   - 拿不准的角色允许留空，前端要能容错缺失字段。

2. **字体只存字体栈字符串，不打包字体文件**。主题切换时本地若无该字体会回退到 fallback，属正常现象（原型即如此）；商用字体需用户自备授权。STYLE-GUIDE 里给字体名即可，让目标项目自己接入。

3. **重复抽取同一站 = 覆盖更新，不新增**。`id` 用域名 slug 去重；同 id 再抽就更新 `site.json` 和 `extractedAt`，不产生第二条。

4. **抽取范围克制**：只抓首屏 + 主要区块的稳定 token，不必爬全站、不必抓组件/布局（与"只要原子风格"定位一致，也更快）。jasonhnd 那些无障碍/状态矩阵/响应式 section 本项目**不需要**，别抄进来。

5. **动态/受保护站容错**：抽取不全时在 `site.json` 写 `warnings` 字段，前端卡片角标注"部分抽取"，不要静默产出可能错误的数据。保真校验覆盖率低于阈值也同理提示。

6. **前端加载方式**：把原型里的 `SITES` 常量改成运行时 `fetch('sites/index.json')` 再逐个取 `site.json`；因为是本地静态站，直接 `file://` 打开会有 CORS 限制读不了本地 JSON，需用 `npx serve` 之类起个静态服务器（README 里写明）。

7. **主题切换的边界**：只切 `--tk-*` 变量、绝不改 DOM 结构（这是选原生栈的前提）。新增 token 变量时，务必同时更新"结构层默认值 + 每个 site 的 theme 映射"两处。
