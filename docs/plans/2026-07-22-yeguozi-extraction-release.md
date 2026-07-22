# 野果子风格采集与发布计划

## 目标

将 `https://www.yeguozi.com/` 的可迁移视觉 token 与风格方向收录到 Vibe Vault；仅提取色彩、字体、尺度、间距、圆角和阴影，不复刻页面布局或组件。

## 已确认分工

1. `fast-worker`：按项目 Style Extractor workflow 采集确定性证据，维护本计划与 `.style-extractor/yeguozi-com/`。
2. `deep-reasoner`：基于截图和 draft token 创建符合契约的 `judgment.json`。
3. `fast-worker`：执行 finalize，生成正式收藏产物并更新索引。
4. `qa-runner`：验证抽取 warning、数据一致性、测试、类型检查和收藏页桌面/移动端展示。
5. 主协调者：在验证通过后，按语义边界分批提交并推送 `main`。

## 执行步骤

1. [x] 创建本计划，记录分工、风险和验收要求。
2. [x] 原样执行 `npm run extract -- collect https://www.yeguozi.com/`，生成 `.style-extractor/yeguozi-com/raw.json`、`screenshot.png` 与 `draft.json`。
3. [x] 审阅 draft 与截图，创建仅含四个契约字段的 `judgment.json`。
4. [x] 原样执行 `npm run extract -- finalize yeguozi-com`，生成 `sites/yeguozi-com/` 并原子更新 `sites/index.json`。
5. [ ] 执行数据、类型、测试和响应式展示验证；保留并报告所有原样 warnings。
6. [ ] 在远端同步后分批提交并推送。

## 风险与处理

- 站点可能动态加载、受保护或部分加载：保留 partial evidence 与 warning，不虚构 token。
- 色彩稳定性或调色板保真度可能不足：仅将 L1/L2 色彩写入正式产物，保留原样 warning。
- 当前工作树已有其他功能的未提交改动：仅新增本计划和本次采集/正式站点产物，不回退或覆盖其他文件。
- 远端可能领先：发布前执行 `git pull --rebase`，保持线性历史。

## 验收标准

- `raw.json`、`screenshot.png` 与 `draft.json` 在 `.style-extractor/yeguozi-com/` 生成。
- judgment 仅含 `primary`、`secondary`、`descriptors`、`thesis`，并满足限定词表和字段约束。
- finalize 后正式记录 URL、ID、截图名与索引条目一致，且无重复 ID。
- QA 覆盖抽取 warning、自动化测试、类型检查与桌面/移动端无横向溢出。
- 每个提交仅包含一个明确语义变更，并通过暂存差异检查。

## 计划中的语义提交

1. `feat(extractor): improve style normalization and guide output`
2. `feat(gallery): refine collection previews and document export`
3. `feat(collections): replace examples with Codex Resets`
4. `feat(collections): add Yeguozi style profile`
5. `docs(project): update documentation and implementation records`

## 实施记录

- 已基于既有 `raw.json` 离线重新生成 `draft.json`，未重新联网采集。
- `judgment.json` 已按已确认的四字段契约写入，并已原样运行 `npm run extract -- finalize yeguozi-com`。
- 正式记录、截图、风格文档与索引均已生成；索引仅包含一个 `yeguozi-com` 条目。
- 相关归一化测试通过：稳定背景证据、Codex Resets 六角色回归与 Yeguozi 深色调色板回归。完整类型检查及页面响应式验证仍由 QA 阶段执行。

## 数据质量问题与修复

- 根因：颜色聚类只累积混合属性面积，`roleColors` 又以“曾出现 `backgroundColor`”作为背景资格。因此 `#f5f3ee` 虽主要来自正文和边框的大面积样本，仍能以极少背景命中参与排序并被误判为背景。
- 修复：聚类按属性累计面积与稳定等级；背景、表面仅使用自身 `backgroundColor` 的 L1/L2 证据和面积排序。次要文字以重复的 `color` 证据及单次平均覆盖面积排序，排除一次性的根元素默认前景色；边框在表面拥有稳定边框证据时允许复用同一聚类，否则按自身边框出现次数排序。
- 结果：Yeguozi 的角色为背景 `#14181e`、表面/边框 `#31353a`、正文 `#f5f3ee`、次要文字 `#6b6964`、强调 `#c9a96e`；无 extraction warnings，保真覆盖率为 `0.782`，eligible ratio 为 `0.4`。
