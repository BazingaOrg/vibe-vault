# STYLE-GUIDE

## 风格方向
主风格：Neo-Brutalism · 次风格：Playful-Illustrative
气质词：纸感温暖 / 圆润厚实 / 硬边描线 / 明快俏皮
奶油纸色与近白表面承托深墨色，少量橙红形成鲜明强调。圆润粗体展示字与清爽常规正文形成对照，等宽小字补充细节节奏。清晰描边和无模糊偏移阴影共同形成温暖而直接的视觉语言。

## 语义色彩
| 用途 | 色值 | 使用方式 |
| --- | --- | --- |
| 背景 | #fff4dd | 页面底色与大面积留白 |
| 表面 | #fffdf7 | 内容承载面或层次区分 |
| 正文 | #26201a | 主要文字与关键信息 |
| 次要文字 | #5c5347 | 辅助信息、说明与元数据 |
| 强调 | #ff5c2b | 少量用于关键操作、链接或注意点 |
| 边框 | #26201a | 以正文墨色建立清晰结构边界 |

## 字体系统
- 展示文字："Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif · 68px / 800 / 1.05 · 字距 -1.36px
- 正文：system-ui, -apple-system, "Segoe UI", sans-serif · 17px / 400 / 1.55 · 字距 0px
- 元信息：ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace · 8px / 700 / 1 · 字距 0.96px
- 字体关系：展示字体与正文字体形成对照
- 对比：高对比。字阶范围 24–68px。
- H5：24px / 800 / 1.55
- H4：26px / 800 / 1
- H3：30px / 700 / 1.1
- H2：36px / 800 / 1.05
- H1：68px / 800 / 1.05

## 复合视觉语法
- 色彩模式：浅色基底；背景与承载面分层，中性色占主导；强调色少量点缀。
- 描边：强调描边，1px / 2px / 6px solid。
- 表面：背景与承载面分层，中性色占主导。
- 层次：硬质偏移阴影。
- 形态：克制小圆角。
- 间距节奏：紧凑节奏。
- 元素特征：字体角色对照 / 强调描边 / 偏移硬阴影 / 浅色基底 / 分层表面 / 克制小圆角。

## 间距与形态
- 间距基准：4px；整体密度：紧凑。
- 间距阶梯：1px / 2px / 4px / 5px / 6px / 8px / 9px / 11px。
- 圆角：较克制（3px / 6px / 14px）。
- 阴影：有，rgb(38, 32, 26) 3px 3px 0px 0px。

## CSS
```css
:root {
  --tk-font-sans: system-ui, -apple-system, "Segoe UI", sans-serif;
  --tk-font-display: "Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif;
  --tk-radius: 6px;
  --tk-shadow: rgb(38, 32, 26) 3px 3px 0px 0px;
  --tk-space: 4px;
  --tk-bg: #fff4dd;
  --tk-surface: #fffdf7;
  --tk-text: #26201a;
  --tk-muted: #5c5347;
  --tk-accent: #ff5c2b;
  --tk-border: #26201a;
  --tk-display-font: "Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif;
  --tk-display-size: 68px;
  --tk-display-weight: 800;
  --tk-display-leading: 1.05;
  --tk-display-tracking: -1.36px;
  --tk-display-style: normal;
  --tk-display-transform: none;
  --tk-body-font: system-ui, -apple-system, "Segoe UI", sans-serif;
  --tk-body-size: 17px;
  --tk-body-weight: 400;
  --tk-body-leading: 1.55;
  --tk-body-tracking: 0px;
  --tk-body-style: normal;
  --tk-body-transform: none;
  --tk-meta-font: ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace;
  --tk-meta-size: 8px;
  --tk-meta-weight: 700;
  --tk-meta-leading: 1;
  --tk-meta-tracking: 0.96px;
  --tk-meta-style: normal;
  --tk-meta-transform: uppercase;
  --tk-stroke-width: 2px;
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
- 来源：https://codex-resets.com/
- 采集日期：2026-10-25
- 先加载对应字体，再应用角色样式；仅声明字体名称不会安装或下载字体。本风格包不包含字体文件。
- 字体栈："Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif
- 字体栈：system-ui, -apple-system, "Segoe UI", sans-serif
- 字体栈：ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace
- 将 .style-display 用于展示文字、.style-body 用于正文、.style-meta 用于辅助文字，并用语义色变量设置背景与文本。
- 优先保留展示字与正文的关系、背景与表面的层次、强调色比例、描边和阴影。角色字号为采样值，按目标内容和屏幕调整。
- 色彩与角色 CSS 用于你的内容；原站布局、图片、图表和数据不在风格包中。
- 调色板覆盖率仅验证采样画面的颜色，不是整体相似度。
