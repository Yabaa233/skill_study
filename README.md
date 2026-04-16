# 🎲 cpskill-dice-roll

**骰子 Skill** — ClawPet Plugin 系统的完整开发示例（娱乐类）。

一个功能完整但代码简洁的骰子插件，演示 ClawPet Plugin 系统的所有核心集成能力。

> **注意：** 本项目同时作为 **Plugin 开发教学示例** 保留在 Skill 市场中。

## 功能

| 能力 | 描述 |
|---|---|
| 🎲 标准骰子 | 掷 d6，带 Unicode 骰面显示 |
| 🎯 自定义面数 | d20 / d100 等任意面数 |
| 🎲🎲🎲 多颗骰子 | 一次掷多颗，返回每颗 + 总和 |
| 🎰 骰宝模式 | 大小判定（1-3 小 / 4-6 大） |
| 📊 投掷历史 | 自动记录最近 100 条结果 |
| 🖥️ 独立窗口 | 可视化动画 UI，支持连掷 |
| 🔔 双重通知 | 系统通知 + 桌面宠物气泡 |

## 目录结构

```
cpskill-dice-roll/
├── SKILL.md                      # 元数据 + tools 声明 + LLM 使用指南
├── plugin.cjs                    # 插件主逻辑（生命周期 + IPC + 业务）
├── scripts/
│   ├── roll.cjs                  # LLM tool 执行入口（Node.js）
│   └── roll.ps1                  # PowerShell 骰子引擎（CLI 兼容）
├── ui/
│   └── index.html                # 独立骰子窗口（动画交互）
├── test.cjs                      # 功能验证脚本
└── README.md                     # 本文件
```

## 演示的 Plugin 能力

| 能力 | 实现位置 | 说明 |
|---|---|---|
| **插件生命周期** | `plugin.cjs` — `activate()` / `deactivate()` | 注册/清理资源 |
| **独立 HTML 窗口** | `plugin.ui` → `ui/index.html` | `ctx.openPluginWindow()` |
| **托盘菜单集成** | `plugin.trayMenu.label` | 右键托盘图标快捷入口 |
| **IPC 通信** | `ctx.registerIpcHandler()` + `window.pluginAPI.invoke()` | UI↔主进程双向通信 |
| **LLM 工具调用** | SKILL.md `tools` + `scriptEntry` | Agent 通过 tool 声明自动调用 |
| **桌面宠物气泡** | `ctx.sendToMainWindow('ai:proactive-message', ...)` | 结果通过宠物气泡展示 |
| **文件持久化** | `ctx.dataDir` + JSON 文件 | 投掷历史本地存储 |
| **系统通知** | `ctx.showNotification()` | 到达提醒（可扩展） |

## 快速开始

### 1. 功能验证

```bash
node test.cjs
```

预期输出：全部测试项 ✅ 通过。

### 2. CLI 直接执行

```bash
# 标准 d6
pwsh scripts/roll.ps1

# d20
pwsh scripts/roll.ps1 -Sides 20

# 3d6
pwsh scripts/roll.ps1 -Count 3

# 骰宝
pwsh scripts/roll.ps1 -Mode sicbo
```

### 3. LLM Tool 调用

```bash
node scripts/roll.cjs --mode standard
node scripts/roll.cjs --mode multi --sides 6 --count 3
node scripts/roll.cjs --mode sicbo
```

### 4. 安装到 ClawPet

将本仓库放入 Skill Registry 扫描路径，ClawPet 会自动识别 SKILL.md 并加载插件。

## 对话使用示例

| 用户输入 | 输出 |
|---|---|
| `"掷个骰子"` | `🎲 [::::] 你掷出了 **6** 点！` |
| `"来把骰宝"` | `🎲 骰宝结果：**5** → 大！` |
| `"帮我掷 3 个 d20"` | `🎲 3d20 结果：[17, 3, 11] = **31**` |
| `"掷个硬币"` | `🎲 d2 结果：**1**` |

## 技术要求

- **OS**: win32 / darwin / linux
- **运行时**: Node.js (用于 plugin.cjs 和 roll.cjs) / PowerShell (用于 roll.ps1)
- **依赖**: 无第三方依赖，纯原生 API
- **ClawPet**: >= 1.0.0（支持 Plugin 系统）

## License

MIT
