---
name: geo-aware-custom
displayName: "🌍 地理位置 (Geo Aware)"
description: >
  地理位置感知与天气查询。通过 IP 定位获取用户所在城市，
  查询当地实时天气。宠物可以在对话中自然地提及天气状况。
  触发词：天气、气温、温度、下雨、下雪、今天天气、明天天气、
  我在哪、定位、IP地址、地理位置、城市、weather、location、
  几度、穿什么、带伞吗、冷不冷、热不热
version: "1.0.0"
license: MIT
author: Yabaa233
tags: [geo, weather, location, ip, utility, built-in]
os: [win32, darwin, linux]
builtin: true

plugin:
  entry: "./plugin.cjs"
  ui:
    label: "🌍 天气"
    path: "./ui/index.html"
    width: 420
    height: 560
  trayMenu:
    label: "🌍 查看天气"

scriptEntry: "./scripts/geo.cjs"

tools:
  - name: get_location
    displayName: "获取位置"
    description: >
      通过 IP 定位获取用户当前的地理位置信息（城市、经纬度、
      时区等）。用于在对话中感知用户所在位置。
    parameters:
      - name: ip
        type: string
        required: false
        description: "指定 IP 地址查询（可选，默认使用当前出口 IP）"
    examples:
      - input: "我在哪"
        output: "📍 当前位置：深圳市，广东省，中国（22.54°N, 114.06°E）"
      - input: "我的 IP 定位"
        output: "🌐 IP: x.x.x.x → 深圳市，中国"

  - name: get_weather
    displayName: "查询天气"
    description: >
      查询指定城市的实时天气信息，包括温度、湿度、风速、
      天气状况、体感温度、日出日落时间等。
    parameters:
      - name: city
        type: string
        required: false
        description: "城市名称（如：深圳、北京、Tokyo），默认使用当前位置"
      - name: days
        type: number
        required: false
        default: 1
        description: "预报天数：1=当天，2=含明天，最多7天"
    examples:
      - input: "今天天气怎么样"
        output: "🌤️ 深圳 · 今天\n🌡️ 26°C（体感 28°C）| 💧 湿度 75%\n💨 东风 3级 | 🌅 日出 06:02 日落 18:47"
      - input: "上海明天要带伞吗"
        output: "🌧️ 上海·明天预报：小雨 18~22°C，降水概率 80%，建议携带雨具 ☂️"

  - name: geo_weather_brief
    displayName: "地理天气简报"
    description: >
      一站式获取当前位置 + 实时天气的组合接口。适合宠物在对话
      中自然提及天气时调用。
    parameters: []
    examples:
      - input: (用户闲聊时)
        output: "📍 深圳 | 🌤️ 26°C 多云 | 💧 75% | 💨 东北风3级"
---

# 🌍 Geo Aware — 内置地理位置与天气 Skill

通过 IP 定位感知用户所在城市，并查询当地实时天气，让桌面宠物能够在对话中自然地提及天气状况。

## 功能

- **IP 精确定位** — 通过公网 IP 获取城市、省份、经纬度、时区
- **实时天气** — 温度、体感温度、湿度、风向风力、能见度
- **天气预报** — 支持当天及未来多日预报（最长7天）
- **智能建议** — 根据天气自动给出穿衣/出行建议
- **独立窗口** — 可视化天气面板，实时展示气象数据
- **缓存机制** — 避免频繁请求，位置缓存 1h，天气缓存 10min

## 使用方式

### 对话触发（LLM 工具调用）

| 用户输入 | Agent 调用 | 输出示例 |
|---|---|---|
| `"今天天气怎么样"` | `get_weather` | `🌤️ 深圳 · 26°C 多云...` |
| `"我在哪"` | `get_location` | `📍 深圳市，广东省，中国` |
| `"明天要带伞吗"` | `get_weather {days: 2}` | `🌧️ 小雨，降水概率 80%...` |
| `(闲聊场景)` | `geo_weather_brief` | `📍 深圳 \| 🌤️ 26°C...` |

### 独立 UI 窗口

通过托盘菜单 `🌍 查看天气` 打开可视化天气面板。

### 命令行执行

```bash
node scripts/geo.cjs --action location
node scripts/geo.cjs --action weather --city 深圳
node scripts/geo.cjs --action brief
```

## 技术要求

- **OS**: win32 / darwin / linux
- **依赖**: 无第三方依赖（使用 Node.js 原生 https 模块）
- **网络**: 需要访问公网（IP 定位 + 天气 API）
- **ClawPet**: >= 1.0.0

## 目录结构

```
cpskill-geo-aware-custom/
├── SKILL.md                      ← 元数据 + tools 声明 + 本文件
├── plugin.cjs                    ← 插件主逻辑（IP定位引擎 + 天气查询 + IPC）
├── scripts/
│   └── geo.cjs                   ← LLM tool 执行入口
├── ui/
│   └── index.html                ← 天气展示窗口（可视化面板）
├── test.cjs                      ← 功能验证脚本
└── README.md                     ← 项目说明
```

## LLM 集成指南

### Agent 何时调用

1. **明确询问**: "天气怎么样"、"几度了"、"下雨吗"
2. **隐式关联**: "今天出门穿什么"、"要带伞吗"、"适合跑步吗"
3. **位置相关": "我在哪"、"这是哪"、"IP定位"
4. **闲聊切入**: 用户提到热/冷/雨/晴等感受时，可主动调用 `geo_weather_brief`

### 返回值处理

Agent 收到天气结果后：
1. **直接呈现** — 将格式化结果返回给用户
2. **自然融入** — 结合上下文，以口语化方式描述（如"深圳今天 26 度挺舒服的"）
3. **附加建议** — 如有雨/极端温度，主动提醒（如"记得带伞哦"）

### 隐私注意

- 仅通过出口 IP 进行粗粒度定位（城市级别），**不获取精确 GPS**
- 天气查询使用公开 API，不涉及个人敏感信息
- 所有缓存数据仅存本地 `ctx.dataDir`
