# STYLE-GUIDE

## 风格方向
主风格：Neo-Brutalism · 次风格：Playful-Illustrative
气质词：chunky / playful / warm / data-forward
采用温暖奶油底色、厚重黑色字形与高饱和点缀，形成轻松而鲜明的新粗野主义气质。用硬边描线、无模糊的偏移阴影和少量圆角强化触感，让数据表达直接但不冷峻。保持中性色彩占主导，黄色与橙红只承担关键状态，避免柔和渐变和精致玻璃质感。

## 语义色彩
| 用途 | 色值 | 使用方式 |
| --- | --- | --- |
| 背景 | #fff4dd | 页面底色与大面积留白 |
| 表面 | #ffd84d | 内容承载面或层次区分 |
| 正文 | #000000 | 主要文字与关键信息 |
| 次要文字 | #26201a | 辅助信息、说明与元数据 |
| 强调 | #ff5c2b | 主要操作、状态或注意点 |
| 边框 | #877b6b | 分隔、描边与结构边界 |

## 字体与字阶
- 主要字体栈："Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif
- 对比：高对比。字阶范围 17–68px。
- H5：17px / 400 / 1.55
- H4：24px / 800 / 1.55
- H3：30px / 700 / 1.1
- H2：36px / 800 / 1.05
- H1：68px / 800 / 1.05

## 间距与形态
- 间距基准：4px；整体密度：紧凑。
- 间距阶梯：2px / 4px / 8px / 10px / 14px / 16px / 18px / 20px。
- 圆角：偏圆润（3px / 10px / 999px）。
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
  --tk-surface: #ffd84d;
  --tk-text: #000000;
  --tk-muted: #26201a;
  --tk-accent: #ff5c2b;
  --tk-border: #877b6b;
}
```
