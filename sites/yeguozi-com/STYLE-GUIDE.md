# STYLE-GUIDE

## 风格方向
主风格：Editorial · 次风格：Luxury-Elegant
气质词：电影感 / 克制典雅 / 高对比 / 哑金点缀
以深墨黑中性色为基底，用暖白正文、低亮灰辅助信息与少量哑金形成清晰克制的层级。人文衬线字与简洁无衬线字相互平衡，配合细边框、小圆角和轻浅阴影，营造安静典雅的电影编辑气质。

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
- 层次：轻柔层次阴影。
- 形态：克制小圆角。
- 间距节奏：适中节奏。
- 元素特征：字体角色对照 / 细线与强调描边并用 / 深色基底 / 分层表面 / 克制小圆角。

## 间距与形态
- 间距基准：4px；整体密度：适中。
- 间距阶梯：2px / 4px / 6px / 10px / 12px / 14px / 16px / 20px。
- 圆角：较克制（2px / 4px / 6px）。
- 阴影：有，rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px。

## CSS
```css
:root {
  --tk-font-sans: "Helvetica Neue", Helvetica, "Segoe UI", system-ui, -apple-system, Arial, sans-serif, "PingFang SC", "Microsoft YaHei";
  --tk-font-display: "Cormorant Garamond", "Cormorant Garamond Fallback", "Cormorant Garamond", "Noto Serif SC", "Noto Serif SC Fallback", "Noto Serif SC", "Songti SC", Georgia, serif;
  --tk-radius: 4px;
  --tk-shadow: rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px;
  --tk-space: 4px;
  --tk-bg: #14181e;
  --tk-surface: #2f343d;
  --tk-text: #f5f3ee;
  --tk-muted: #a8a59e;
  --tk-accent: #c9a96e;
  --tk-border: #2f343d;
}
```
