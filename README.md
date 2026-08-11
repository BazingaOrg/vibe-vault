# vibe-vault

中文名为 **Vibe Vault（风格收藏册）**。

记录喜欢的网站设计风格，积累审美，也为未来项目沉淀可复用的视觉方向。提取的是可迁移的视觉 token 与复合视觉语法，不复刻原网站的布局、组件或 DOM 结构。

## Features

- 使用 Playwright 采集首屏稳定颜色、字体角色、字距、描边、间距、圆角与阴影；并额外保存多滚动与同站次页证据图供判断。
- 将采集结果归一为带来源和置信度的 `visualGrammar`、可复用 `site.json`、`STYLE-GUIDE.md` 和截图。
- 在中性收藏库中回看风格，并在隔离的详情区完整检验主题、字体角色、节奏、色值与风格包。
- 不调用外部 LLM API；风格判断由当前对话中的模型完成。
- 入库只保留可迁移设计 token 与方向；组件结构、图表与数据语义色不作为风格复用。

## Quick Start

```sh
npx serve .
```

在终端显示的 HTTP 地址打开页面。不要直接用 `file://` 打开 `index.html`，浏览器会阻止画廊读取 JSON 资源。

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

脚本会生成 `.style-extractor/<id>/draft.json`、`screenshot.png`，以及 `evidence/` 下的多滚动/次页截图。`draft.json` 同时包含原子 token 与字体配对、色彩分配、描边、表面、层次和形态等 `visualGrammar`。先阅读 draft、主截图与证据图，再由当前对话模型创建 `.style-extractor/<id>/judgment.json`。若主截图被图表占满，可在 finalize 前把更干净的证据图复制为 `screenshot.png`（不改变 token）。完整协议见 [skill/SKILL.md](skill/SKILL.md)。

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

完成后，脚本会覆盖同一主机的既有记录，写入 `sites/<id>/` 并更新按采集日期倒序的 `sites/index.json`。索引只保存画廊卡片所需的 `id`、名称、URL、主/次风格、描述词、强调色、采集日期、`partial` 和 `validationFlags`；完整 token 与文档仍按点选懒加载。`partial` 只由抽取 `warnings` 是否存在推导；媒体占比高、调色板覆盖偏低等截图校验限制单独保存为 `validationNotices` / `validationFlags`，不会把完整记录标成部分抽取。采集不足、受保护或动态页面仍会保留为 `warnings`；不要补造缺失 token。
