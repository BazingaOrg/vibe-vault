# STYLE-GUIDE

## 风格方向
主风格：Editorial · 次风格：Luxury-Elegant
气质词：电影感 / 克制典雅 / 高对比 / 哑金点缀
深墨黑中性色承托暖白正文、低亮灰辅助信息与少量哑金，形成清晰克制的层级。人文衬线字与简洁无衬线字相互平衡，细边框、小圆角和平面表面共同营造安静典雅的电影编辑气质。

## 语义色彩
| 用途 | 色值 | 使用方式 |
| --- | --- | --- |
| 背景 | #14181e | 页面底色与大面积留白 |
| 表面 | #2f343d | 内容承载面或层次区分 |
| 正文 | #f5f3ee | 主要文字与关键信息 |
| 次要文字 | #a8a59e | 辅助信息、说明与元数据 |
| 强调 | #c9a96e | 少量用于关键操作、链接或注意点 |
| 边框 | #2f343d | 分隔、描边与结构边界 |

## 字体系统
- 展示文字："Cormorant Garamond", "Cormorant Garamond Fallback", "Cormorant Garamond", "Noto Serif SC", "Noto Serif SC Fallback", "Noto Serif SC", "Songti SC", Georgia, serif · 48px / 400 / 1.12 · 字距 0px
- 正文："Helvetica Neue", Helvetica, "Segoe UI", system-ui, -apple-system, Arial, sans-serif, "PingFang SC", "Microsoft YaHei" · 14px / 400 / 1.63 · 字距 0px
- 元信息："Helvetica Neue", Helvetica, "Segoe UI", system-ui, -apple-system, Arial, sans-serif, "PingFang SC", "Microsoft YaHei" · 9px / 600 / 1 · 字距 0.23px
- 字体关系：展示字体与正文字体形成对照
- 对比：高对比。字阶范围 14–48px。
- Small：14px / 400 / 1
- Body：16px / 600 / 0.98
- Lead：18px / 400 / 1.38
- H2：24px / 400 / 1.33
- H1：48px / 400 / 1.12

## 复合视觉语法
- 色彩模式：深色基底；背景与承载面分层，中性色占主导；强调色少量点缀。
- 描边：细线与强调描边并用，1px / 2px solid。
- 表面：背景与承载面分层，中性色占主导。
- 层次：平面，无外部投影。
- 形态：克制小圆角。
- 间距节奏：适中节奏。
- 元素特征：字体角色对照 / 细线与强调描边并用 / 深色基底 / 分层表面 / 克制小圆角。

## 间距与形态
- 间距基准：4px；整体密度：适中。
- 间距阶梯：2px / 4px / 6px / 10px / 12px / 14px / 16px / 20px。
- 圆角：较克制（2px / 4px / 6px）。
- 阴影：无。

## CSS
```css
:root {
  --tk-font-sans: "Helvetica Neue", Helvetica, "Segoe UI", system-ui, -apple-system, Arial, sans-serif, "PingFang SC", "Microsoft YaHei";
  --tk-font-display: "Cormorant Garamond", "Cormorant Garamond Fallback", "Cormorant Garamond", "Noto Serif SC", "Noto Serif SC Fallback", "Noto Serif SC", "Songti SC", Georgia, serif;
  --tk-radius: 4px;
  --tk-shadow: none;
  --tk-space: 4px;
  --tk-bg: #14181e;
  --tk-surface: #2f343d;
  --tk-text: #f5f3ee;
  --tk-muted: #a8a59e;
  --tk-accent: #c9a96e;
  --tk-border: #2f343d;
  --tk-display-font: "Cormorant Garamond", "Cormorant Garamond Fallback", "Cormorant Garamond", "Noto Serif SC", "Noto Serif SC Fallback", "Noto Serif SC", "Songti SC", Georgia, serif;
  --tk-display-size: 48px;
  --tk-display-weight: 400;
  --tk-display-leading: 1.12;
  --tk-display-tracking: 0px;
  --tk-display-style: normal;
  --tk-display-transform: none;
  --tk-body-font: "Helvetica Neue", Helvetica, "Segoe UI", system-ui, -apple-system, Arial, sans-serif, "PingFang SC", "Microsoft YaHei";
  --tk-body-size: 14px;
  --tk-body-weight: 400;
  --tk-body-leading: 1.63;
  --tk-body-tracking: 0px;
  --tk-body-style: normal;
  --tk-body-transform: none;
  --tk-meta-font: "Helvetica Neue", Helvetica, "Segoe UI", system-ui, -apple-system, Arial, sans-serif, "PingFang SC", "Microsoft YaHei";
  --tk-meta-size: 9px;
  --tk-meta-weight: 600;
  --tk-meta-leading: 1;
  --tk-meta-tracking: 0.23px;
  --tk-meta-style: normal;
  --tk-meta-transform: uppercase;
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
- 来源：https://yeguozi.com/
- 采集日期：2026-08-12
- 先加载对应字体，再应用角色样式；仅声明字体名称不会安装或下载字体。本风格包不包含字体文件。
- 字体栈："Cormorant Garamond", "Cormorant Garamond Fallback", "Cormorant Garamond", "Noto Serif SC", "Noto Serif SC Fallback", "Noto Serif SC", "Songti SC", Georgia, serif
- 字体栈："Helvetica Neue", Helvetica, "Segoe UI", system-ui, -apple-system, Arial, sans-serif, "PingFang SC", "Microsoft YaHei"
- 将 .style-display 用于展示文字、.style-body 用于正文、.style-meta 用于辅助文字，并用语义色变量设置背景与文本。
- 优先保留展示字与正文的关系、背景与表面的层次、强调色比例、描边和阴影。角色字号为采样值，按目标内容和屏幕调整。
- 色彩与角色 CSS 用于你的内容；原站布局、图片、图表和数据不在风格包中。
- 校验说明：非媒体可校验像素比例 0.122（阈值 0.2），结果仅供参考。
- 调色板覆盖率仅验证采样画面的颜色，不是整体相似度。
