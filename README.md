# Vibe Vault

一个本地、零构建的网站设计风格收藏册。它保存可迁移的视觉原子：风格方向、稳定主题色、字体、间距、圆角与阴影；不复刻原网站的布局或组件结构。

## 环境与启动

需要 Node.js 20+。

```sh
npm install
npx playwright install chromium
npx serve .
```

在终端显示的 HTTP 地址打开 `index.html`。不要直接用 `file://` 打开：浏览器会阻止页面用 `fetch()` 读取本地的 `sites/index.json` 和 `site.json`。

如果尚未安装 `serve`，`npx serve .` 会临时下载并启动它；也可以使用任意静态 HTTP 服务器。

## 使用方式

1. 按抽取 skill 的 `collect → judgment → finalize` 两阶段概念完成记录：脚本先采集与归一稳定 token，当前对话模型再判断封闭词表中的风格并改写原则性文案，最后确定性写入文件。
2. 每个网站放在 `sites/<id>/`：`site.json` 是唯一事实来源，`STYLE-GUIDE.md` 是给编码 agent 的主产出，`screenshot.png` 是画廊封面。
3. 同步更新 `sites/index.json` 后刷新页面。点击卡片只会更新 `--tk-*` CSS 变量，不会替换页面主 DOM。

页面支持复制色值，以及查看并复制 `STYLE-GUIDE.md`、CSS 变量、Tailwind 配置和 `tokens.json`。

## 字体与授权

记录只保存字体栈字符串，不打包字体文件。若本机没有目标字体，预览会按系统 fallback 显示，这是预期行为。将字体用于生产或商业项目时，请自行取得相应的字体授权。
