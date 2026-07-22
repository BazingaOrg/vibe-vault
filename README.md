# vibe-vault

本地网站设计风格收藏册：提取可迁移的视觉 token 与风格方向，不复刻原网站的布局、组件或 DOM 结构。

## Features

- 使用 Playwright 采集首屏及附近内容的稳定颜色、字体、间距、圆角与阴影。
- 将采集结果归一为可复用的 `site.json`、`STYLE-GUIDE.md` 和截图。
- 在静态画廊中浏览收藏、切换整页主题、复制色值与代码输出。
- 不调用外部 LLM API；风格判断由当前对话中的模型完成。

## Quick Start

需要 Node.js 20+。

```sh
npm install
npx playwright install chromium
npx serve .
```

在终端显示的 HTTP 地址打开页面。画廊运行时会读取 `sites/index.json` 和各站点记录。

## Extract a Style

从仓库根目录执行采集：

```sh
npm run extract -- collect https://example.com
```

脚本会生成 `.style-extractor/example-com/draft.json` 和 `screenshot.png`。先阅读并检查两者，再由当前对话模型创建 `.style-extractor/example-com/judgment.json`：

```json
{
  "primary": "Minimalism",
  "secondary": null,
  "descriptors": ["calm", "precise", "restrained"],
  "thesis": "以清晰、克制的视觉层级组织信息。只从截图与稳定 token 提炼可迁移的设计方向。"
}
```

`primary` 与非空 `secondary` 必须使用 [skill/SKILL.md](skill/SKILL.md) 定义的封闭风格词表；`descriptors` 需要 3–5 个短词，`thesis` 需要 2–4 句。随后执行：

```sh
npm run extract -- finalize example-com
```

完成后，脚本会覆盖同一主机的既有记录，写入 `sites/example-com/`，并更新排序后的 `sites/index.json`。采集不足、受保护或动态页面会保留为 `warnings`，不应补造缺失 token。

## Deploy to Vercel

该仓库可直接作为静态站部署。导入仓库后使用：

- Framework Preset：`Other`
- Build Command：留空
- Output Directory：`.`

Vercel 只部署画廊及 `sites/` 静态内容。Playwright 采集、截图检查和 `judgment.json` 的风格判断仍在本地完成；新增记录后推送到仓库即可触发重新部署。

## Domain

推荐三级域名：`vibe.bazinga.ink`。在 Vercel 项目的 Domains 页面添加该域名，并按页面展示的具体值配置 DNS CNAME。

## Output

```text
sites/
  index.json                 # 画廊索引
  <id>/
    site.json                # token、主题与风格判断
    STYLE-GUIDE.md           # 面向编码 agent 的风格指南
    screenshot.png           # 首屏截图
```

## Notes

- 不要用 `file://` 直接打开 `index.html`；浏览器会阻止其读取 JSON 资源。
- 记录只保存字体栈，不分发字体文件；生产或商业使用请自行确认字体授权。
- 页面可查看/复制 `STYLE-GUIDE.md`、CSS 变量、Tailwind 配置和 `tokens.json`。
