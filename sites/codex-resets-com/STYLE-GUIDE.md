# STYLE-GUIDE

## 风格方向
主风格：Neo-Brutalism · 次风格：Playful-Illustrative
气质词：厚实 / 俏皮 / 温暖 / 直接
温暖奶油纸色承托厚重墨色与高饱和橙红，形成轻松鲜明的新粗野主义气质。硬边描线、清晰偏移阴影、适度圆角与圆润粗体共同强化直接而有触感的视觉表达。

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
- 正文："Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif · 15px / 700 / 1.1 · 字距 0px
- 元信息：ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace · 8px / 700 / 1.55 · 字距 0.96px
- 字体关系：统一字体家族，以字号与字重建立层级
- 对比：高对比。字阶范围 17–68px。
- Lead：17px / 400 / 1.55
- H4：24px / 800 / 1.55
- H3：30px / 700 / 1.1
- H2：36px / 800 / 1.05
- H1：68px / 800 / 1.05

## 复合视觉语法
- 色彩模式：浅色基底；背景与承载面分层，中性色占主导；强调色少量点缀。
- 描边：细线与强调描边并用，1px / 2px solid。
- 表面：背景与承载面分层，中性色占主导。
- 层次：硬质偏移阴影。
- 形态：柔和圆角。
- 间距节奏：适中节奏。
- 元素特征：统一字体层级 / 细线与强调描边并用 / 偏移硬阴影 / 浅色基底 / 分层表面 / 柔和圆角。

## 间距与形态
- 间距基准：4px；整体密度：适中。
- 间距阶梯：4px / 6px / 8px / 9px / 14px / 16px / 17px / 18px。
- 圆角：偏圆润（3px / 10px / 14px）。
- 阴影：有，rgb(38, 32, 26) 3px 3px 0px 0px。

## CSS
```css
:root {
  --tk-font-sans: "Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif;
  --tk-font-display: "Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif;
  --tk-radius: 10px;
  --tk-shadow: rgb(38, 32, 26) 3px 3px 0px 0px;
  --tk-space: 4px;
  --tk-bg: #fff4dd;
  --tk-surface: #fffdf7;
  --tk-text: #26201a;
  --tk-muted: #5c5347;
  --tk-accent: #ff5c2b;
  --tk-border: #26201a;
}
```
