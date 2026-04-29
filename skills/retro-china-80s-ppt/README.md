#  📜 retro-china-80s-ppt

**中国 80 年代怀旧风格 PPT 生成器** — ClawPet Skill（v1.0.0）。

把普通大纲变成带有年代感的 `.pptx` 演示文稿。四种模板任选：

| 模板 | 效果 | 适用 |
|------|------|------|
| `textbook` 老课本 | 宣纸米黄 + 墨黑 + 朱砂红，双线边框 + 方格底纹 + 印章 | 正式汇报、课堂分享 |
| `award` 奖状喜报 | 金底红字 + 红双喜 + 波浪边框 + 大红印 | 表彰、祝贺、生日奖状 |
| `quotation` 语录本 | 正红底 + 黄字 + 五角星 + 金边 | 名言、格言、语录集 |
| `calendar` 挂历 | 米黄 + 墨绿大日期块 + 挂绳 | 年度回顾、日期相关 |

---

## 目录结构（位于仓库 `skills/retro-china-80s-ppt/`）

```
skills/retro-china-80s-ppt/
├── SKILL.md                      # 元数据 + tools 声明 + LLM 使用指南
├── package.json                  # npm 依赖声明（pptxgenjs + esbuild）
├── build.js                      # esbuild 打包脚本
├── src/
│   └── retro-ppt.cjs             # 源文件（开发时编辑）
├── scripts/
│   └── retro-ppt.bundle.cjs      # 构建产物（运行时入口，提交前生成）
├── test.cjs                      # 验证脚本（生成 4 份 demo PPT）
└── README.md                     # 本文件
```

---

## 本地构建

```bash
cd skills/retro-china-80s-ppt
npm install
node build.js           # 生成 scripts/retro-ppt.bundle.cjs
node test.cjs           # 运行验证脚本（会在 out/ 下生成 4 份 demo PPT）
```

**注意**：`scripts/retro-ppt.bundle.cjs` 是**必须提交**到仓库的构建产物，因为客户端环境没有 `node_modules`，运行时直接加载 bundle。

---

## 工具参数

工具名：`create_retro_ppt`

| 参数 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| `title` | string | ✅ | 主标题 |
| `subtitle` | string | – | 副标题 |
| `author` | string | – | 作者 / 单位，默认 `ClawPet` |
| `template` | `textbook`\|`award`\|`quotation`\|`calendar` | – | 默认 `textbook` |
| `slides` | `{title, bullets[], note?}[]` | ✅ | 至少 1 页 |
| `outputPath` | string | – | 输出 `.pptx` 绝对路径，默认存到 `dataDir` |

返回：`{ success, filePath, slideCount, template, message }` 或 `{ success: false, error }`。

---

## LLM 使用示例

```jsonc
{
  "title": "一九八八年度工作报告",
  "subtitle": "回首过往 · 再启新程",
  "author": "某某厂劳资科",
  "template": "textbook",
  "slides": [
    { "title": "开篇寄语", "bullets": ["光阴似箭", "岁月如歌", "望同志们批评指正"] },
    { "title": "今年成就", "bullets": ["完成指标 112%", "获得三项专利", "新开两条生产线"] },
    { "title": "明年展望", "bullets": ["技术革新", "质量管理", "争创一流"] }
  ]
}
```

---

## 技术要求

- **OS**: win32 / darwin / linux
- **依赖**: `pptxgenjs`（已 bundle，运行时无需安装）
- **运行时**: Node.js >= 16
- **输出**: 标准 `.pptx`（13.33 × 7.5 英寸宽屏）

## License

MIT
