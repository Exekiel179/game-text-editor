
## 1. 本次MVP范围
- 2D像素风场景 1 个（家庭客厅）。
- 主角可上下左右移动。
- 2 个NPC可对话（母亲、父亲）。
- 1 个精灵引导系统（提示事实/想法）。
- 1 套CBT训练闭环（至少6轮对话）。
- 存档（章节进度 + 分数）。


---

## 2. 验收定义
满足以下全部即通过：
1. 可从主菜单进入第一章并完成通关。
2. 玩家至少完成3次“事实/想法”正确区分。
3. 至少1次错误后能看到精灵纠偏提示并继续流程。
4. Boss阶段可触发、可成功、可失败后重试。
5. 退出后重进可恢复章节进度。

---

## 3. 最小系统设计

### 3.1 3C（锁定）
- Character：主角 + 精灵（仅玩家可见）。
- Camera：2D跟随，进入对话时轻微聚焦。
- Control：
  - `WASD/方向键` 移动
  - `E` 交互/确认
  - `J` 打开认知记录
  - `H` 请求精灵提示

### 3.2 训练循环
探索 → 触发对话 → 选择回答或自由输入 → 系统判定（事实/想法）→ 精灵反馈 → 状态更新（压力/清晰度）→ 下一轮。

### 3.3 最小状态变量
- `stress`（冲突压力，0~100）
- `clarity`（认知清晰度，0~100）
- `hint_count`（精灵提示剩余）
- `chapter_progress`（流程节点）
- 

---

## 4. 对话与AI最小方案

### 4.1 对话结构（先规则，后AI）
- 每条对话有：`speaker`、`text`、`tag`（fact/thought/mixed）、`next`。
- 第一章总对话节点建议：20~30个（含分支收束）。

### 4.2 AI输入适配
- 玩家自由输入后，不直接改剧情。
- 先做意图归类：`fact_like` / `thought_like` / `emotion` / `unclear`。
- 再映射到固定训练节点，避免分支爆炸。
- AI不可用时回退到预设选项。

---

## 5. 目录与命名（供参考）
```text
/scenes/ch01/ch01_lv01_training_core.tscn
/scenes/ch01/ch01_boss_dialogue.tscn
/scripts/core/game_state.gd
/scripts/dialogue/dialogue_runner.gd
/scripts/ai/ai_adapter.gd
/scripts/ui/ui_dialogue.gd
/data/dialogue/ch01/dlg_ch01_core_v1.json
/data/dialogue/ch01/dlg_ch01_boss_v1.json
/ui/dialogue/ui_dialogue_choice_default.tscn
/audio/bgm/ch01_home_loop.ogg
/audio/sfx/ui_confirm.ogg
```

外部显示名：
- 章节：`第一章：家里的风暴`
- 关卡：`训练1：事实，还是想法？`

---

## 6. 任务拆分

### 程序
1. 角色移动与交互触发。
2. 对话运行器（读取JSON、跳转、判定）。
3. 状态管理（stress/clarity）。
4. AI适配器（可回退）。
5. 存档读档。

### 内容/策划
1. 写20~30条第一章训练对话。
2. 为每条标注 fact/thought 标签与教学意图。

### 美术/UI/音频
1. 主角、母亲、精灵基础像素素材。
2. 对话UI、压力条、清晰度条。
3. 1条循环BGM + 4个基础SFX。

---

## 7. 测试清单
- [ ] 键鼠操作无卡死。
- [ ] 所有对话节点可达，不出现死链。
- [ ] 错误判定后提示文本正确显示。
- [ ] AI超时能自动回退预设选项。
- [ ] Boss可成功/可失败/可重试。
- [ ] 存档后重开仍在正确流程节点。

---

## 8. 版本门槛（发布MVP）

- 完整通关时长 3-5分钟。
- 首次玩家可在引导下理解“事实 vs 想法”。
- 无阻断性Bug（卡死、黑屏、存档损坏）。
