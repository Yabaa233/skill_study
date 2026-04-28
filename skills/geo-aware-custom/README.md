# 🌍 cpskill-geo-aware-custom

**地理位置感知与天气查询** — ClawPet 内置 Skill（v1.0.0）。

通过 IP 定位感知用户所在城市，查询实时天气，让桌面宠物在对话中自然地提及天气状况。

> **状态：内置（builtin: true）** — 作为 ClawPet 核心能力集成，同时保留为 Plugin 开发教学示例。

## 功能

| 能力 | 描述 |
|---|---|
| 🌐 **IP 精确定位** | 通过出口 IP 获取城市、省份、经纬度、时区 |
| ☀️ **实时天气** | 温度/体感温度/湿度/风向风力/能见度/日出日落 |
| 📅 **多日预报** | 支持当天 + 未来 7 天预报 |
| 💡 **智能建议** | 自动生成穿衣、出行、安全建议（雨天带伞/高温预警等） |
| 💨 **天气代码映射** | 完整覆盖 WMO 46 种天气现象（含雷暴/沙尘暴/龙卷风） |
| 🖥️ **独立窗口** | 可视化天气面板，动画图标 + 预报卡片 |
| 🔄 **智能缓存** | 位置缓存 1h / 天气缓存 10min，避免频繁请求 |

## 目录结构（位于仓库 `skills/geo-aware-custom/`）

```
skills/geo-aware-custom/
├── SKILL.md                      # 元数据 + tools 声明 + LLM 使用指南
├── plugin.cjs                    # 插件主逻辑（IP定位 + 天气引擎 + IPC）
├── scripts/
│   └── geo.cjs                   # LLM tool 执行入口
├── ui/
│   └── index.html                # 独立天气窗口
├── test.cjs                      # 功能验证脚本
└── README.md                     # 本文件
```

> 本 Skill 是 monorepo 内的一员，注册表 `registry.json` 通过 `subdirectory: "skills/geo-aware-custom"` 索引到此目录。

## 演示的 Plugin 能力

| 能力 | 实现位置 | 说明 |
|---|---|---|
| **插件生命周期** | `plugin.cjs` — `activate()` / `deactivate()` | 注册 IPC / 初始化缓存目录 |
| **IPC 通信** | `ctx.registerIpcHandler()` | 3 个 handler：location / weather / brief |
| **独立 HTML 窗口** | `plugin.ui` → `ui/index.html` | 天气可视化面板 |
| **托盘菜单集成** | `plugin.trayMenu.label` | `🌍 查看天气` 快捷入口 |
| **LLM 工具调用** | SKILL.md `tools` × 3 + `scriptEntry` | Agent 自然触发 |
| **桌面宠物气泡** | `ctx.sendToMainWindow('ai:proactive-message')` | 天气简报通过宠物展示 |
| **HTTP 网络请求** | Node.js 原生 `https/http` 模块 | IP API + Open-Meteo 天气 API |
| **文件持久化** | `ctx.dataDir` + JSON 文件缓存 | 位置/天气本地缓存 |
| **数据转换** | WMO 天气代码 → 图标/建议 | 46 种天气现象完整映射 |

## 使用方式

### 对话触发（LLM Agent）

| 用户输入 | 触发 Tool | 输出 |
|---|---|---|
| `"今天天气怎么样"` | `get_weather` | `🌤️ 深圳 · 26°C 多云...` |
| `"我在哪"` | `get_location` | `📍 深圳市，广东省，中国...` |
| `"明天要带伞吗"` | `get_weather {days:2}` | `🌧️ 小雨，降水概率 80%...` |
| `(闲聊场景)` | `geo_weather_brief` | `📍 深圳 \| 🌤️ 26°C \| 💧 75%` |

### CLI 直接执行

```bash
# IP 定位
node scripts/geo.cjs --action location

# 查询城市天气
node scripts/geo.cjs --action weather --city Shenzhen --days 3

# 一站式位置+天气
node scripts/geo.cjs --action brief
```

### 功能验证

```bash
node test.cjs
```

预期输出：全部测试项 ✅ 通过（需要网络连接）。

## 技术架构

```
用户对话 → Agent (LLM)
              │
              ├── get_location ──→ ip-api.com ──→ 城市坐标
              │                        │
              │                   缓存 (1h TTL)
              │
              ├── get_weather ──→ geocoding-api (城市名→坐标) ──→ open-meteo API
              │                       │                          │
              │                  缓存 (10min TTL)           当前+预报
              │
              └── geo_weather_brief ──→ 先定位再查天气（组合调用）

结果返回 → Agent 格式化输出 → 用户
         → sendToMainWindow → 宠物气泡展示
```

### 数据源

| 用途 | API | 认证 | 说明 |
|---|---|---|---|
| IP 定位 | ip-api.com | 免费，无需 key | 支持 IPv4/IPv6，中文友好 |
| 地理编码 | Open-Meteo Geocoding | 免费，无需 key | 全球城市搜索 |
| 天气数据 | Open-Meteo Forecast | 免费，无需 key | 基于 ECMWF/NOAA 数据 |

**所有 API 均无需 Key，零配置即可使用。**

## 天气现象覆盖

完整支持 WMO 46 种天气代码分类：

- **雷暴** (200-232)：从轻雷暴到剧烈雷暴/阵雪
- **毛毛雨/雨** (300-314, 500-531)：从小雨到极端降雨
- **雪** (600-622)：小雪到大雪、霰、雨夹雪
- **雾/大气** (701-781)：雾、烟雾、沙尘暴、龙卷风
- **晴到阴** (800-804)：晴天到完全阴天

每种天气自动关联：
- Unicode 图标（⛈️🌧️❄️🌫️☀️ 等）
- 危险等级（normal/rainy/snowy/warning/danger）
- 中文描述文本
- 智能出行建议

## 技术要求

- **OS**: win32 / darwin / linux
- **运行时**: Node.js >= 16（用于 plugin.cjs 和 geo.cjs）
- **依赖**: 无第三方依赖（纯 Node.js 原生模块）
- **网络**: 需要访问公网（IP API + Open-Meteo）
- **ClawPet**: >= 1.0.0（支持 Plugin 系统）

## License

MIT
