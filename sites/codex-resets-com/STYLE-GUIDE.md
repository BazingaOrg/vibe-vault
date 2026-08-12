# STYLE-GUIDE

## 风格方向
主风格：Neo-Brutalism · 次风格：Playful-Illustrative
气质词：厚实 / 俏皮 / 温暖 / 直接
温暖奶油纸色与深墨色建立厚实清晰的基础，暖黄、橙红、粉和浅蓝以小面积并置，形成轻松鲜明的新粗野主义气质。硬边描线、偏移阴影、柔和圆角与圆润粗体共同带来直接而有触感的视觉表达。

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
- 正文："Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif · 18px / 700 / 1.35 · 字距 0px
- 元信息：ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace · 8px / 700 / 1.55 · 字距 0.96px
- 字体关系：统一字体家族，以字号与字重建立层级
- 对比：高对比。字阶范围 28–68px。
- H5：28px / 800 / 1.12
- H4：30px / 700 / 1.1
- H3：33px / 800 / 0.94
- H2：36px / 800 / 1.05
- H1：68px / 800 / 0.95

## 复合视觉语法
- 色彩模式：浅色基底；奶油中性色为底，暖黄、橙红、粉与浅蓝分区点缀；暖黄承担主要强调，其他明快色小面积并置。
- 描边：强调描边，1px / 2px solid。
- 表面：奶油纸面与暖白承载面依靠墨色边界分层。
- 层次：硬质偏移阴影。
- 形态：柔和圆角。
- 间距节奏：紧凑节奏。
- 元素特征：统一字体层级 / 强调描边 / 偏移硬阴影 / 浅色基底 / 分层表面 / 柔和圆角。

## 间距与形态
- 间距基准：4px；整体密度：紧凑。
- 间距阶梯：2px / 3px / 4px / 6px / 7px / 8px / 9px / 10px。
- 圆角：偏圆润（3px / 12px / 14px）。
- 阴影：有，rgb(38, 32, 26) 3px 3px 0px 0px。

## CSS
```css
:root {
  --tk-font-sans: "Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif;
  --tk-font-display: "Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif;
  --tk-radius: 12px;
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
