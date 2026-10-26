# vibe-vault

中文名为 **Vibe Vault（风格收藏册）**。

记录喜欢的网站设计风格，积累审美，也为未来项目沉淀可复用的视觉方向。提取的是可迁移的视觉 token 与复合视觉语法，不复刻原网站的布局、组件或 DOM 结构。

## Features

- 使用 Playwright 等待字体加载后，采集首屏稳定颜色、字体角色、字距、描边、间距、圆角与阴影，并保存多滚动与同站次页证据图供判断。
- 识别访问验证、空页面和内容过少等情况；重新采集成功后归档旧判断，失败时保留上次证据并返回失败状态。
- 将采集结果归一为带来源和置信度的 `visualGrammar`、可复用 `site.json`、`STYLE-GUIDE.md` 和截图。
- 以当前风格为主角：整页应用所选主题，用风格概述与原站截图对照感受，再复制或下载风格包。
- 不调用外部 LLM API；风格判断由当前对话中的模型完成。
- 入库只保留可迁移设计 token 与方向；组件结构、图表与数据语义色不作为风格复用。

## Quick Start

```sh
npx serve .
```

在终端显示的 HTTP 地址打开页面。不要直接用 `file://` 打开 `index.html`，浏览器会阻止画廊读取 JSON 资源。

## 浏览与复用

- 搜索名称、网址、主次风格和描述词；用空格组合多个关键词。风格筛选同时匹配主风格和次风格。
- 地址栏保存当前收藏、搜索和筛选条件，可刷新恢复、保存书签或使用浏览器前进/后退。
- 当前风格页直接复制完整风格包，或下载独立 Markdown 文件；原站截图支持打开大图。记录与文档加载失败时可直接重试。
- 页面本身呈现所选的色彩、字体关系、形态与层次，不再分开展示色卡、字阶或语法面板。具体参数、来源和采集限制留在风格包；页面仅在抽取不完整时显示简短状态。
- 页面使用本机可用的字体栈；原站字体未安装或未加载时会使用回退字体。原站截图用于对照，页面不复刻原站排版。

风格包包含展示、正文、辅助文字的角色 CSS（字体、字号、字重、行高、字距）、描边参数和来源说明。字体文件不包含在导出中，需要在目标项目加载相应字体。

## 开发验证

```sh
npm run typecheck
npm test
```

测试包含本地 Chromium 采集和画廊交互检查，请先执行 `npx playwright install chromium`。测试使用本地 fixture 和临时目录，不重新采集外部站点，也不改写收藏。画廊检查覆盖搜索、地址恢复、后退、失败重试、快速切换、导出内容及 320–1440px 页面宽度。

## Extract a Style

抽取需要 Node.js 20+。从仓库根目录安装依赖和 Chromium：

```sh
npm install
npx playwright install chromium
```

然后执行采集：

```sh
npm run extract -- collect <url>
```

脚本会生成 `.style-extractor/<id>/draft.json`、`screenshot.png`，以及 `evidence/` 下的多滚动/次页截图。`draft.json` 同时包含原子 token 与字体配对、色彩分配、描边、表面、层次和形态等 `visualGrammar`。先阅读 draft、主截图与证据图，再由当前对话模型创建 `.style-extractor/<id>/judgment.json`。若主截图被图表占满，可在 finalize 前把更干净的证据图复制为 `screenshot.png`（不改变 token；调色板校验仍使用原始 `evidence/primary-top.png`）。重新采集成功后，旧判断归档为 `judgment.previous.json`，需要根据新证据重新判断。完整协议见 [skill/SKILL.md](skill/SKILL.md)。

```json
{
  "primary": "Minimalism",
  "secondary": null,
  "descriptors": ["calm", "precise", "restrained"],
  "thesis": "以清晰、克制的视觉层级组织信息。只从截图与稳定 token 提炼可迁移的设计方向。"
}
```

仅保留这四个字段。`primary` 与非空 `secondary` 必须使用 [skill/SKILL.md](skill/SKILL.md) 定义的封闭风格词表；`descriptors` 需要 3–5 个短词，`thesis` 需要 2–4 句。随后执行：

```sh
npm run extract -- finalize <id>
```

完成后，脚本会覆盖同一主机的既有记录，写入 `sites/<id>/` 并更新按采集日期倒序的 `sites/index.json`。索引只保存画廊卡片所需的 `id`、名称、URL、主/次风格、描述词、强调色、采集日期、`partial` 和 `validationFlags`；完整 token 与文档仍按点选懒加载。`partial` 只由抽取 `warnings` 是否存在推导；媒体占比高、调色板覆盖偏低等截图校验限制单独保存为 `validationNotices` / `validationFlags`，不会把完整记录标成部分抽取。主页面采集不足、受保护或动态内容未加载会保留为 `warnings`；可选证据页的失败单独保存为 `evidenceNotes`，不会把主页面的完整提取误标成部分抽取。不要补造缺失 token。
