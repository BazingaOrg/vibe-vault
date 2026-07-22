# 网站设计风格收藏册：执行计划

日期：2026-07-22  
来源规格：[网站设计风格收藏册实施方案](../style-extractor-plan.md)

## 目标

实现一个本地、零外部模型 API 成本的网站设计风格收藏册：输入网站 URL 后，采集其稳定的原子化设计 token，生成可迁移的 `STYLE-GUIDE.md`，存入 `sites/<id>/`；静态前端读取这些记录，以 CSS 自定义属性实现整页主题切换，并提供风格指南、CSS 变量、Tailwind 和 JSON 四种代码查看与复制。

## 非目标

- 不复刻原站的布局、组件结构或页面骨架。
- 不爬取全站、无障碍/状态矩阵或响应式组件系统；只覆盖首屏与主要区块的稳定风格信号。
- 不调用外部 LLM API；视觉风格判定与文案改写由触发 skill 的当前对话模型完成。
- 不打包或分发网站字体，也不规避受保护网站的访问控制。
- 不建设云端数据库、账户、搜索或多人协作能力。

## 已确认假设与决策

- 配套的 `style-gallery-prototype.html` 在当前仓库缺失。因此不照抄原型，而按规格的统一数据模型和页面分区从零实现；手写 Stripe 示例作为前端和数据模型的可运行基线。
- 运行环境为 Node.js 20+；抽取使用 TypeScript、Playwright Chromium 与 `culori`，前端保持原生单文件 HTML/CSS/JavaScript、零构建依赖。
- `id` 从域名生成 slug。再次抽取同一 `id` 时覆盖原记录及其截图并更新时间，不创建重复条目。
- `site.json` 是唯一事实来源；`sites/index.json` 只是画廊的轻量索引，必须与其同步更新。

## 架构：collect → judgment → finalize

流程严格分成可重复执行的机械采集、由当前模型完成的判断、以及确定性落库三个阶段，避免把视觉主观判断隐藏在脚本中。

1. **collect（脚本）**：打开目标站、滚动触发懒加载、收集可见元素的 computed styles 与根 CSS 变量、截取首屏，输出原始采集数据和截图。采集只记录颜色、字体、字号/行高/字重、间距、圆角、阴影与必要上下文，不记录布局复刻信息。
2. **judgment（当前对话模型）**：读取截图和归一化 token 摘要，按封闭风格词表选择主/次风格，产出 descriptors、thesis 及面向 AI 的原则性文字。仅 L1/L2 稳定 token 可进入风格指南；L3 只可保留为说明，L4 丢弃。
3. **finalize（脚本/模板）**：稳定性分层、OKLCH 感知聚类、角色映射和主题变量生成应保持确定性；将判断结果与 token 合成为 `site.json`、`STYLE-GUIDE.md`、截图和索引。随后运行覆盖率校验；若数据不完整、站点受保护或覆盖率低，写入显式 `warnings`，而非静默伪装为完整结果。

## 文件所有权

| 责任 | 拥有文件 |
| --- | --- |
| 抽取/归一/验证实现 | `package.json`、`tsconfig.json`（如需要）、`skill/scripts/**` |
| Skill 接入与模型指令 | `skill/SKILL.md`、`.claude/skills/**`、`AGENTS.md` 的项目级入口（仅增补与本功能直接相关内容） |
| 收藏册 UI 与示例数据 | `index.html`、`sites/index.json`、`sites/stripe/**`、`README.md` |
| 本计划的过程记录 | `docs/plans/2026-07-22-style-extractor.md` |

并行工作必须遵守上述所有权；任何人不得覆盖不属于自己的已有改动。跨文件契约（数据模型、字段和变量名）以 `docs/style-extractor-plan.md` 第 3 节为准。

## 实施清单

- [x] 建立 Node/TypeScript 抽取工程骨架，安装并配置 Playwright 与 `culori`；提供符合统一数据模型的 Stripe 示例记录和 `sites/index.json`。  
  验收：依赖可安装，示例 JSON 可被解析，索引能定位到示例记录。

- [x] 实现原生静态收藏册 `index.html`：运行时先读取索引，再加载各 `site.json`；渲染画廊、详情、色卡、字体、间距、圆角、阴影、实时预览与四类代码查看器。  
  验收：静态服务器下能显示 Stripe；缺少可选 token 时页面不崩溃；直接 `file://` 不作为支持方式。

- [x] 实现主题换肤与复制交互：点击任意卡片只替换 `--tk-*` 变量并同步选中态和详情；色卡复制 hex；代码查看器分别显示并复制 `STYLE-GUIDE.md`、CSS 变量、Tailwind、tokens JSON 的原文/现算结果。  
  验收：切换时 DOM 结构不变；四种输出均与当前 `site.json` 一致。

- [x] 实现 collect：输入 URL，以桌面视口采样首屏及主要区块，滚动触发懒加载，写出 `raw.json` 和 `screenshot.png`。  
  验收：对允许自动访问的公开站运行成功，并能获得截图与 computed-style 原始数据。

- [x] 实现确定性归一层：按 L1–L4 稳定性规则过滤数据，以 OKLCH ΔE 聚类颜色，按已定义启发式映射 `bg/surface/text/muted/accent/border`，并归整字体阶梯、间距、圆角、阴影及 `theme`。  
  验收：结果符合 `site.json` 数据模型；角色拿不准时可留空；L4 不进入锚点和主题变量。

- [x] 实现 finalize 与重复更新：从规范化 token 和 judgment 输入生成 `site.json`、`STYLE-GUIDE.md`、`sites/index.json`；保证同域名重复抽取覆盖原记录。  
  验收：`STYLE-GUIDE.md` 只包含可迁移的原则和少量锚点值，采用祈使句且不含布局/组件指导；索引无重复 id。

- [x] 编写 `skill/SKILL.md` 与项目入口：规定触发意图、collect→judgment→finalize 顺序、封闭词表、判断输出格式、风格指南模板和索引更新步骤。  
  验收：一次“抽取 <url> 的风格”请求可按文档完成闭环；不需要外部模型 API。

- [x] 实现保真与容错检查：将抽取调色板用于排除图片区域的覆盖率检查；为动态/canvas/受保护或低覆盖率站点持久化 `warnings`，并在画廊提供“部分抽取”提示。  
  验收：低于阈值时有可见警告；抽取失败不会留下半写入的索引条目。

- [x] 运行真实闭环、修复问题并完成自审。  
  验收：对一个允许访问的公开 URL，在合理时间内生成完整记录；刷新静态页面后出现卡片、可换肤、可复制四种结果。

## 风险与缓解

| 风险 | 缓解措施 |
| --- | --- |
| 原型缺失导致视觉细节无法一比一还原 | 严格实现规格中明确的分区、数据模型和交互；以功能验收替代原型像素比对。 |
| 动态、canvas、反爬或登录墙降低 token 覆盖 | 记录 `warnings` 和覆盖率，不伪造完整性；选择公开允许自动访问的网站做真实闭环。 |
| 内容活动色污染品牌风格 | 使用 L1–L4 分层，风格指南与主题锚点只采用 L1/L2。 |
| CSS 颜色格式、透明色和相近灰色造成噪声 | 转换为 OKLCH 后按 ΔE 聚类，再基于频率、面积与上下文映射角色。 |
| 本机缺少目标字体导致预览差异 | 仅保存字体栈，依赖 fallback；README 说明字体授权和回退属预期。 |
| 静态页面直接打开触发 CORS | README 提供静态服务器命令，并以 HTTP 服务作为冒烟测试前提。 |

## 验证方案

1. **静态检查**：运行 TypeScript 类型检查及抽取相关单元/最小测试（如项目提供）。
2. **数据契约**：验证示例与新抽取的 `site.json` 字段、`theme` 变量、截图路径、索引条目和重复 id 覆盖语义。
3. **抽取冒烟**：对一个允许访问的公开 URL 运行 collect、judgment、finalize；检查生成物和 warning 行为。
4. **浏览器冒烟**：通过静态 HTTP 服务器打开页面，确认索引加载、卡片切换、CSS 变量换肤、色值复制和四个代码 tab。
5. **自审**：确认未引入布局复刻、外部模型 API、字体分发或超出范围的云端能力；确认 DOM 不因换肤而改变。

## Git 分批策略

在所有相关阶段验证通过后再提交。提交遵循线性历史，在每次提交前执行 `git pull --rebase`；使用 Conventional Commits，不提交密钥或生成的敏感数据。

1. `chore(extractor): scaffold style extraction pipeline`：工程依赖、类型配置、示例数据和目录骨架。
2. `feat(gallery): add runtime-loaded style gallery`：静态前端、主题换肤、代码查看/复制、README。
3. `feat(skill): add style extraction and finalization workflow`：采集、归一、保真校验、skill 入口与文档。
4. `test(extractor): verify extraction-to-gallery workflow`：仅在确有独立测试或回归修复时提交。

每批先由 QA 验证对应范围，通过后再提交；最终在用户授权下执行：

```sh
git remote add origin https://github.com/BazingaOrg/vibe-vault.git
git branch -M main
git push -u origin main
```

若远端已存在或本地分支已设置远端，先只读检查远端和分支状态，再采用不产生 merge commit 的 `pull --rebase` 路径处理。

## Implementation Notes

（实施开始后按步骤追加实际完成内容、验证结果和与原计划的偏差；不得重写上方计划。）

### 2026-07-22 · 实现完成

- 完成原生单文件画廊：通过 `sites/index.json` 和各站 `site.json` 的运行时加载渲染画廊、详情、色卡、token 可视化、实时预览及四种代码输出；主题切换仅更新 `--tk-*` CSS 变量。
- 增加 Stripe 手写示例及其索引，作为静态前端的可运行基线。
- 完成 `collect → judgment → finalize` 闭环：Playwright 负责采集和截图，归一层负责确定性处理，当前对话模型按封闭词表完成风格判断与风格指南文字；finalize 写入站点记录、风格指南、截图和索引，并支持同域名覆盖更新。
- 稳定性规则已落实为仅 L1/L2 进入主题锚点和 `STYLE-GUIDE.md`；L3 不作为 fallback，L4 丢弃。
- 实现调色板保真度检查及 `warnings` 持久化，低覆盖率、动态或受保护站点会被显式标记为部分抽取。
- 增加项目级 Skill 入口，规定 URL 触发、封闭词表、判断输出、风格指南模板和索引更新流程，不使用外部模型 API。
- 偏差：规格引用的 `style-gallery-prototype.html` 在仓库中不存在，故未复刻原型实现；改以规格定义的数据模型、页面分区和交互为准从零实现。

### 2026-07-22 · 最终验证

- TypeScript typecheck：PASS。
- 自动测试：5/5 PASS。
- 真实采集：`example.com` 生成 7 个样本，fidelity 为 `0.996`。
- 浏览器冒烟：两个站点记录均可加载、切换主题与复制，PASS。
- Lint：N/A（项目未配置独立 lint 命令）。

## Review Findings

（代码审查后追加问题、根因、修复及复验结果；不得删除既有记录。）

### 2026-07-22 · QA 第一轮

- 问题：页面脚本在浏览器上下文调用 `page.evaluate` 时传入了 `__name`，触发不兼容的求值参数问题。  
  根因：采集脚本将 Node/TypeScript 的函数命名辅助信息带入浏览器执行上下文。  
  修复：移除 `page.evaluate` 的 `__name` 参数，保持传入值为浏览器可序列化数据。  
  复验：collect 与真实 URL 采集通过。

- 问题：L3 色在候选不足时被回退采用，违反“仅 L1/L2 作为稳定锚点”的产品约束。  
  根因：归一化的候选补足逻辑未将稳定性过滤作为不可突破的边界。  
  修复：删除 L3 fallback；缺少合适角色时允许 token 为空并保留 warning。  
  复验：风格指南和主题变量仅使用 L1/L2。

### 2026-07-22 · QA 第二轮

- 问题：覆盖率统计遗漏 `html`/`body` 的背景，导致页面级背景信号与保真结果不完整。  
  根因：采样仅遍历通常可见的内容元素，未显式纳入根元素。  
  修复：将 `html` 与 `body` 的计算样式纳入采集和覆盖率输入。  
  复验：`example.com` fidelity 达到 `0.996`。

- 问题：中性色转换至 OKLCH 时 hue 可能为 `NaN`，聚类/序列化存在不稳定风险。  
  根因：无色相颜色在 OKLCH 中没有定义 hue。  
  修复：对中性色 hue 使用确定性安全值，避免 `NaN` 进入计算或 JSON。  
  复验：自动测试 5/5 通过。

- 问题：测试运行后遗留临时垃圾文件。  
  根因：测试夹具未在结束路径完整清理。  
  修复：补齐测试清理逻辑，确保临时输出不污染仓库。  
  复验：最终 typecheck、自动测试与二站浏览器冒烟均通过。
