# STYLE-GUIDE

## 风格方向
主风格：Editorial · 次风格：Minimalism
气质词：刊物感 / 严谨 / 克制 / 档案气质 / 纸墨分明
以冷白纸面、近黑墨色与细发丝线建立严谨的金融刊物气质，高对比衬线字让内容具有历史档案般的分量。形态保持锐利克制，层次主要依靠明度、字重与疏密变化，强调色也回归稳定墨色。

## 语义色彩
| 用途 | 色值 | 使用方式 |
| --- | --- | --- |
| 背景 | #ffffff | 页面底色与大面积留白 |
| 表面 | #f0f4f1 | 内容承载面或层次区分 |
| 正文 | #181822 | 主要文字与关键信息 |
| 次要文字 | #5c5c65 | 辅助信息、说明与元数据 |
| 强调 | #52c6c0 | 少量用于关键操作、链接或注意点 |
| 边框 | #c6cecd | 分隔、描边与结构边界 |

## 字体系统
- 展示文字："HOM Nameplate Lg", Georgia, serif · 72px / 900 / 0.92 · 字距 -1.58px
- 正文："Literata HOM", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", "Noto Sans SC", "Heiti SC", system-ui, sans-serif · 19px / 400 / 1.74 · 字距 0.04px
- 元信息："HOM Figure", "Apparatus HOM", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif · 10px / 400 / 1.55 · 字距 1px
- 字体关系：展示字体与正文字体形成对照
- 对比：高对比。字阶范围 16–72px。
- Body：16px / 400 / 1.55
- Lead：19px / 400 / 1.74
- H3：30px / 600 / 1.1
- H2：52px / 700 / 1.06
- H1：72px / 900 / 0.92

## 复合视觉语法
- 色彩模式：浅色基底；背景与承载面分层，中性色占主导；强调色少量点缀。
- 描边：细线与强调描边并用，1px / 2px solid。
- 表面：背景与承载面分层，中性色占主导。
- 层次：柔和扩散阴影。
- 形态：克制小圆角。
- 间距节奏：紧凑节奏。
- 元素特征：字体角色对照 / 细线与强调描边并用 / 柔和扩散层次 / 浅色基底 / 分层表面 / 克制小圆角。

## 间距与形态
- 间距基准：4px；整体密度：紧凑。
- 间距阶梯：2px / 3px / 4px / 5px / 6px / 7px / 8px / 10px。
- 圆角：较克制（2px / 2px / 2px）。
- 阴影：有，rgb(255, 255, 255) -8px 0px 12px -4px, rgb(198, 206, 205) 0px 1px 0px 0px。

## CSS
```css
:root {
  --tk-font-sans: "Literata HOM", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", "Noto Sans SC", "Heiti SC", system-ui, sans-serif;
  --tk-font-display: "HOM Nameplate Lg", Georgia, serif;
  --tk-radius: 2px;
  --tk-shadow: rgb(255, 255, 255) -8px 0px 12px -4px, rgb(198, 206, 205) 0px 1px 0px 0px;
  --tk-space: 4px;
  --tk-bg: #ffffff;
  --tk-surface: #f0f4f1;
  --tk-text: #181822;
  --tk-muted: #5c5c65;
  --tk-accent: #52c6c0;
  --tk-border: #c6cecd;
}
```
