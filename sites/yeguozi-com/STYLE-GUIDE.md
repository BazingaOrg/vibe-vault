# STYLE-GUIDE · Yeguozi

> 用途：汇总可迁移的风格方向、视觉参数与 CSS，可直接作为设计或编码提示词。
>
> 迁移边界：仅复用稳定的视觉 token 与关系；不复刻原站布局、组件、内容或交互结构。

## 风格方向
主风格：Editorial · 次风格：Luxury-Elegant
气质词：电影感 / 克制典雅 / 高对比 / 哑金点缀
以深墨黑中性色为基底，用暖白正文、低亮灰辅助信息与少量哑金形成清晰而克制的层级。醒目文字采用具有人文气质的衬线字体，辅助文字保持简洁无衬线，结合细边框、轻微圆角和近乎无外投影的处理，营造安静、典雅且富有电影感的编辑风格。

## 语义色彩
| 用途 | 色值 | 使用方式 |
| --- | --- | --- |
| 背景 | #14181e | 页面底色与大面积留白 |
| 表面 | #31353a | 内容承载面或层次区分 |
| 正文 | #f5f3ee | 主要文字与关键信息 |
| 次要文字 | #6b6964 | 辅助信息、说明与元数据 |
| 强调 | #c9a96e | 主要操作、状态或注意点 |
| 边框 | #31353a | 分隔、描边与结构边界 |

## 字体与字阶
- 主要字体栈："Helvetica Neue", Helvetica, "Segoe UI", system-ui, -apple-system, Arial, sans-serif, "PingFang SC", "Microsoft YaHei"
- 对比：高对比。字阶范围 18–108px。
- H5：18px / 400 / 1.38
- H4：24px / 400 / 1.33
- H3：34px / 400 / 1.5
- H2：48px / 400 / 1.12
- H1：108px / 500 / 1.5

## 间距与形态
- 间距基准：4px；整体密度：紧凑。
- 已采集间距：2px / 4px / 6px / 8px / 10px / 12px / 14px / 16px。
- 圆角：较克制（4px / 6px / 33554400px）。
- 阴影：有，rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.07) 0px 1px 0px 0px inset, rgba(255, 255, 255, 0.04) 0px 0px 0px 1px。

## CSS
```css
:root {
  --tk-font-sans: "Helvetica Neue", Helvetica, "Segoe UI", system-ui, -apple-system, Arial, sans-serif, "PingFang SC", "Microsoft YaHei";
  --tk-font-display: "Helvetica Neue", Helvetica, "Segoe UI", system-ui, -apple-system, Arial, sans-serif, "PingFang SC", "Microsoft YaHei";
  --tk-radius: 6px;
  --tk-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.07) 0px 1px 0px 0px inset, rgba(255, 255, 255, 0.04) 0px 0px 0px 1px;
  --tk-space: 4px;
  --tk-bg: #14181e;
  --tk-surface: #31353a;
  --tk-text: #f5f3ee;
  --tk-muted: #6b6964;
  --tk-accent: #c9a96e;
  --tk-border: #31353a;
}
```

## 使用边界
- 先保持语义色的层级与对比，再按新项目内容调整具体尺寸。
- 将字体、字阶、间距、圆角和阴影视为一套关系，不单独套用某一个数值。
- 未采集的信息应依据新项目语境补充，不从原站推断或复刻布局。
