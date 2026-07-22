# vibe-vault

记录喜欢的网站设计风格，积累审美，也为未来项目沉淀可复用的视觉方向。提取的是可迁移的视觉 token 与风格原则，不复刻原网站的布局、组件或 DOM 结构。

## Features

- 使用 Playwright 采集首屏及附近内容的稳定颜色、字体、间距、圆角与阴影。
- 将采集结果归一为可复用的 `site.json`、`STYLE-GUIDE.md` 和截图。
- 在本地收藏中回看风格、切换整页主题、复制色值与代码输出。
- 不调用外部 LLM API；风格判断由当前对话中的模型完成。

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

脚本会生成 `.style-extractor/<id>/draft.json` 和 `screenshot.png`。先阅读并检查两者，再由当前对话模型创建 `.style-extractor/<id>/judgment.json`：

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

完成后，脚本会覆盖同一主机的既有记录，写入 `sites/<id>/` 并更新排序后的 `sites/index.json`。采集不足、受保护或动态页面会保留为 `warnings`；不要补造缺失 token。
