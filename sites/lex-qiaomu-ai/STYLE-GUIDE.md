# STYLE-GUIDE

## 风格方向
主风格：Editorial · 次风格：Minimalism
气质词：报刊式 / 克制 / 衬线标题 / 墨色层级 / 高对比
白底与暖灰表面托起近黑衬线标题，无衬线正文保持清晰易读。细黑分隔线、小圆角和几乎没有投影，让层次主要来自字号、字重和留白。少量朱红只用于短标签，整体像一份克制的数字报刊。

## 语义色彩
| 用途 | 色值 | 使用方式 |
| --- | --- | --- |
| 背景 | #ffffff | 页面底色与大面积留白 |
| 表面 | #f5f5f3 | 内容承载面或层次区分 |
| 正文 | #111111 | 主要文字与关键信息 |
| 次要文字 | #6b6b67 | 辅助信息、说明与元数据 |
| 强调 | #111111 | 与正文共享墨色，以字重、位置或留白形成强调 |
| 边框 | #2e2e2c | 分隔、描边与结构边界 |

## 字体系统
- 展示文字："Libre Caslon Text", "Noto Serif SC", "Songti SC", "Source Han Serif SC", STSong, Georgia, serif · 64px / 700 / 1.1 · 字距 -0.32px
- 正文：-apple-system, "system-ui", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Noto Sans CJK SC", sans-serif · 14px / 400 / 1.6 · 字距 0px
- 元信息：-apple-system, "system-ui", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Noto Sans CJK SC", sans-serif · 11px / 500 / 1 · 字距 0px
- 字体关系：展示字体与正文字体形成对照
- 对比：高对比。字阶范围 15–64px。
- Body：15px / 400 / 1.4
- Body：16px / 400 / 1.6
- H3：24px / 700 / 1.6
- H2：40px / 700 / 1.32
- H1：64px / 700 / 1.1

## 复合视觉语法
- 色彩模式：浅色基底；背景与承载面分层，中性色占主导；强调色参与主要层级。
- 描边：细线与强调描边并用，1px / 2px solid。
- 表面：背景与承载面分层，中性色占主导。
- 层次：平面，无外部投影。
- 形态：克制小圆角。
- 间距节奏：紧凑节奏。
- 元素特征：字体角色对照 / 细线与强调描边并用 / 浅色基底 / 分层表面 / 克制小圆角。

## 间距与形态
- 间距基准：4px；整体密度：紧凑。
- 间距阶梯：3px / 4px / 5px / 6px / 8px / 10px / 12px / 14px。
- 圆角：较克制（4px / 4px / 4px）。
- 阴影：无。

## CSS
```css
:root {
  --tk-font-sans: -apple-system, "system-ui", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Noto Sans CJK SC", sans-serif;
  --tk-font-display: "Libre Caslon Text", "Noto Serif SC", "Songti SC", "Source Han Serif SC", STSong, Georgia, serif;
  --tk-radius: 4px;
  --tk-shadow: none;
  --tk-space: 4px;
  --tk-bg: #ffffff;
  --tk-surface: #f5f5f3;
  --tk-text: #111111;
  --tk-muted: #6b6b67;
  --tk-accent: #111111;
  --tk-border: #2e2e2c;
  --tk-display-font: "Libre Caslon Text", "Noto Serif SC", "Songti SC", "Source Han Serif SC", STSong, Georgia, serif;
  --tk-display-size: 64px;
  --tk-display-weight: 700;
  --tk-display-leading: 1.1;
  --tk-display-tracking: -0.32px;
  --tk-display-style: normal;
  --tk-display-transform: none;
  --tk-body-font: -apple-system, "system-ui", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Noto Sans CJK SC", sans-serif;
  --tk-body-size: 14px;
  --tk-body-weight: 400;
  --tk-body-leading: 1.6;
  --tk-body-tracking: 0px;
  --tk-body-style: normal;
  --tk-body-transform: none;
  --tk-meta-font: -apple-system, "system-ui", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Noto Sans CJK SC", sans-serif;
  --tk-meta-size: 11px;
  --tk-meta-weight: 500;
  --tk-meta-leading: 1;
  --tk-meta-tracking: 0px;
  --tk-meta-style: normal;
  --tk-meta-transform: none;
  --tk-stroke-width: 1px;
  --tk-stroke-style: solid;
}

.style-display {
  font-family: var(--tk-display-font);
  font-size: var(--tk-display-size);
  font-weight: var(--tk-display-weight);
  line-height: var(--tk-display-leading);
  letter-spacing: var(--tk-display-tracking);
  font-style: var(--tk-display-style);
  text-transform: var(--tk-display-transform);
}

.style-body {
  font-family: var(--tk-body-font);
  font-size: var(--tk-body-size);
  font-weight: var(--tk-body-weight);
  line-height: var(--tk-body-leading);
  letter-spacing: var(--tk-body-tracking);
  font-style: var(--tk-body-style);
  text-transform: var(--tk-body-transform);
}

.style-meta {
  font-family: var(--tk-meta-font);
  font-size: var(--tk-meta-size);
  font-weight: var(--tk-meta-weight);
  line-height: var(--tk-meta-leading);
  letter-spacing: var(--tk-meta-tracking);
  font-style: var(--tk-meta-style);
  text-transform: var(--tk-meta-transform);
}
```

## 复用与来源
- 来源：https://lex.qiaomu.ai/en/
- 采集日期：2026-10-28
- 先加载对应字体，再应用角色样式；仅声明字体名称不会安装或下载字体。本风格包不包含字体文件。
- 字体栈："Libre Caslon Text", "Noto Serif SC", "Songti SC", "Source Han Serif SC", STSong, Georgia, serif
- 字体栈：-apple-system, "system-ui", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Noto Sans CJK SC", sans-serif
- 将 .style-display 用于展示文字、.style-body 用于正文、.style-meta 用于辅助文字，并用语义色变量设置背景与文本。
- 优先保留展示字与正文的关系、背景与表面的层次、强调色比例、描边和阴影。角色字号为采样值，按目标内容和屏幕调整。
- 色彩与角色 CSS 用于你的内容；原站布局、图片、图表和数据不在风格包中。
- 调色板覆盖率仅验证采样画面的颜色，不是整体相似度。
