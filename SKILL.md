---
name: dice-roll
displayName: "🎲 骰子 (Dice Roll)"
description: >
  掷骰子！支持多种模式：标准骰子(d6)、自定义面数(d20/d100)、
  多颗骰子(3d6)、骰宝模式(大小)。
  触发词：掷骰子、摇骰子、roll dice、掷个d20、roll d100、
  掷3颗骰子、来把骰宝、dice、骰子、随机数
version: "1.0.0"
license: MIT
author: Yabaa233
tags: [game, dice, random, fun, entertainment]
os: [win32, darwin, linux]

plugin:
  entry: "./plugin.cjs"
  ui:
    label: "🎲 骰子"
    path: "./ui/index.html"
    width: 420
    height: 520
  trayMenu:
    label: "🎲 掷骰子"

scriptEntry: "./scripts/roll.cjs"

tools:
  - name: roll_dice
    displayName: "掷骰子"
    description: >
      执行骰子投掷操作。支持标准模式(d6)、自定义面数、多颗骰子、
      骰宝大小模式。返回结构化的投掷结果。
    parameters:
      - name: mode
        type: string
        required: false
        default: "standard"
        enum: ["standard", "multi", "sicbo"]
        description: "投掷模式：standard=单颗标准, multi=多颗骰子, sicbo=骰宝大小"
      - name: sides
        type: number
        required: false
        default: 6
        description: "骰子面数，默认6（standard/multi模式生效）"
      - name: count
        type: number
        required: false
        default: 1
        description: "骰子数量，默认1（仅multi模式生效）"
    examples:
      - input: "掷个骰子"
        output: "🎲 [::::] 你掷出了 **6** 点！"
      - input: "掷一个 d20"
        output: "🎲 d20 结果：**17**"
      - input: "掷 3 颗 6 面骰子"
        output: "🎲 3d6 结果：[2, 5, 1] = **8**"
      - input: "来把骰宝"
        output: "🎲 骰宝结果：**5** → 大！"
---

# 🎲 Dice Roll — ClawPet Skill

一个用于 ClawPet Skill Registry 的骰子 Skill，完整演示 Plugin 系统核心能力。

## 功能

- **标准骰子** — 掷 1 个 6 面骰子（d6），带 Unicode 骰面显示
- **自定义面数** — 指定面数（如 d20、d100）
- **多颗骰子** — 一次掷多颗，返回每颗结果与总和
- **骰宝模式** — 判定大小（1-3 小 / 4-6 大）

## 使用方式

### 对话触发（LLM 工具调用）

用户自然语言请求时，Agent 通过 `roll_dice` tool 自动调用脚本执行。

| 输入 | 输出 |
|---|---|
| `"掷骰子"` | `🎲 [::::] 你掷出了 **6** 点！` |
| `"掷个 d20"` | `🎲 d20 结果：**17**` |
| `"掷 3 颗骰子"` | `🎲 3d6 结果：[2, 5, 1] = **8**` |
| `"来把骰宝"` | `🎲 骰宝结果：**5** → 大！` |

### 独立 UI 窗口

通过托盘菜单 `🎲 掷骰子` 或插件 API 打开独立窗口，可视化交互操作。

### 命令行直接执行

```bash
# 标准 d6
pwsh scripts/roll.ps1

# 自定义面数
pwsh scripts/roll.ps1 -Sides 20

# 多颗骰子
pwsh scripts/roll.ps1 -Count 3

# 骰宝模式
pwsh scripts/roll.ps1 -Mode sicbo
```

## 技术要求

- **OS**: win32 / darwin / linux
- **依赖**: 无（纯 PowerShell + Node.js）
- **ClawPet**: >= 1.0.0（支持 Plugin 系统）

## 目录结构

```
cpskill-dice-roll/
├── SKILL.md                      ← 元数据 + tools 声明 + 本文件
├── plugin.cjs                    ← 插件主逻辑（生命周期 + IPC + 菜单）
├── scripts/
│   ├── roll.cjs                  ← LLM tool 执行入口（Node.js）
│   └── roll.ps1                  ← PowerShell 骰子引擎（CLI 兼容）
├── ui/
│   └── index.html                ← 独立骰子窗口（动画交互）
├── test.cjs                      ← 功能验证脚本
└── README.md                     ← 项目说明
```

## LLM 集成指南

### Agent 何时调用此 Skill

当用户表达以下意图时，Agent 应通过 `roll_dice` tool 执行：

1. **明确掷骰**: "掷骰子"、"摇骰子"、"roll dice"、"来一颗"
2. **指定参数**: "掷个 d20"、"roll 2d6"、"来把骰宝"
3. **游戏场景**: TRPG、桌游、随机决策相关请求
4. **隐喻用法**: "看运气"、"随机选一个"（可结合场景推荐使用）

### 返回值处理

Agent 收到 `roll Dice` 的输出后，应：
1. **直接呈现** — 将格式化结果原样返回给用户
2. **结合场景** — 如用户在玩 TRPG，可附加判定说明（如"命中！"、"失败"）
3. **不编造** — 严格以脚本输出为准，不得自行修改点数

### 多次投掷

如用户需要连续多次投掷（如攻击+伤害），每次调用为独立随机事件，Agent 应逐次调用 `roll Dice` tool。
