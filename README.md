# vibe-vault

中文名为 **Vibe Vault（风格收藏册）**。

记录喜欢的网站设计风格，积累审美，也为未来项目沉淀可复用的视觉方向。提取的是可迁移的视觉 token 与复合视觉语法，不复刻原网站的布局、组件或 DOM 结构。

## Features

- 使用 Playwright 等待页面字体加载后，采集首屏的颜色、字体、间距、圆角、边框与阴影；同时保存滚动和同站页面截图供判断。
- 识别空页面、访问验证和内容过少等情况，不把无效页面当成成功结果。
- 将采集结果整理为可复用的 `site.json`、`STYLE-GUIDE.md` 和截图；内部诊断保留在数据文件中，不在页面默认展示。
- 在收藏库中用通俗中文回看风格、颜色、字体、间距和整体特征。
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

脚本会生成 `.style-extractor/<id>/draft.json`、`screenshot.png`，以及 `evidence/` 下的滚动和同站页面截图。先阅读 draft、主截图与证据图，再由当前对话模型创建 `.style-extractor/<id>/judgment.json`。若主截图被图表占满，可在 finalize 前把更干净的证据图复制为 `screenshot.png`；内部颜色检查仍使用未改动的 `evidence/primary-top.png`。重新采集成功后，旧判断会归档为 `judgment.previous.json`，避免新证据误用旧判断。完整协议见 [skill/SKILL.md](skill/SKILL.md)。

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

完成后，脚本会覆盖同一主机的既有记录，写入 `sites/<id>/` 并更新按采集日期倒序的 `sites/index.json`。主页面提取受限时会保留 `warnings` 并在页面显示一句简短提醒；可选证据页失败只进入 `evidenceNotes`，不会把记录误标成信息不全。完整 token、技术检查与开发文档按点选加载，页面默认只展示普通用户需要的结论。
