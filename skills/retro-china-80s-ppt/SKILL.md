---
name: retro-china-80s-ppt
description: >
  生成中国 80 年代怀旧风格 PPT 演示文稿（.pptx）。
  独特视觉：搪瓷红/米黄/墨绿配色、宋体、红双喜边框、奖状纹样、
  方格底纹、印章标题。支持四种模板：老课本、奖状喜报、语录本、挂历。
  适用于：年会汇报、怀旧主题分享、生日祝福、复古美学作品等。
metadata:
  clawpet:
    builtin: false
    version: "1.0.0"
    emoji: "📜"
    tools:
      - name: create_retro_ppt
        displayName: "生成 80 年代风格 PPT"
        description: |
          根据用户提供的主题和幻灯片内容大纲，生成一份中国 80 年代
          怀旧风格的 .pptx 文件。调用者（LLM）应先帮用户把内容整理成
          幻灯片数组（每页 title + bullets），再把数组传给此工具。

          输入参数：
          - title:      演示文稿主标题（会作为首页大字 + 文件标题）
          - subtitle:   副标题（可选，显示在首页标题下方）
          - author:     作者 / 单位名（可选，默认 "ClawPet"）
          - template:   模板风格 "textbook"(老课本) | "award"(奖状喜报) |
                        "quotation"(语录本) | "calendar"(挂历)，默认 "textbook"
          - slides:     幻灯片数组 [{ title, bullets: string[], note?: string }]
          - outputPath: 输出 .pptx 绝对路径（可选，默认保存到 dataDir）

          返回：{ success, filePath, slideCount } 或 { error }
        inputSchema:
          type: object
          properties:
            title:
              type: string
              description: "演示文稿主标题"
            subtitle:
              type: string
              description: "副标题（可选）"
            author:
              type: string
              description: "作者或单位名，默认 ClawPet"
            template:
              type: string
              enum: [textbook, award, quotation, calendar]
              description: "模板风格：textbook=老课本, award=奖状喜报, quotation=语录本, calendar=挂历"
            slides:
              type: array
              description: "幻灯片数组，每项包含 title 和 bullets"
              items:
                type: object
                properties:
                  title:
                    type: string
                    description: "本页标题"
                  bullets:
                    type: array
                    items:
                      type: string
                    description: "本页要点列表（3-6 条为宜）"
                  note:
                    type: string
                    description: "页脚备注（可选，如日期、章节号）"
                required: [title, bullets]
            outputPath:
              type: string
              description: "输出 .pptx 绝对路径（可选）"
          required: [title, slides]
        riskLevel: MODERATE
        scriptEntry: scripts/retro-ppt.bundle.cjs
        confirmHint: "生成 80 年代风格 PPT: {title}"
---

# Retro China 80s PPT — 中国 80 年代怀旧风格 PPT 📜

一个把普通大纲变成**年代感十足的怀旧 PPT** 的工具。

## 使用场景

**何时应调用本工具**：用户明确要求"做 PPT / 生成演示文稿 / 写汇报"并且带有以下关键词：
- 80 年代、怀旧、复古、老课本、大字报、奖状、喜报、红双喜、挂历、语录
- 年代感、复古风、民国风（可用老课本模板近似）

**不该调用的情况**：用户只想聊天、只想要大纲文字、或要求 "现代简约 PPT"。

### 示例对话

1. **明确风格**
   - 用户：`"帮我做个80年代风格的 PPT，主题是我们年会回顾"`
   - 调用：
     ```json
     {
       "title": "1988 我们的年会",
       "template": "textbook",
       "slides": [
         { "title": "开篇寄语", "bullets": ["光阴似箭", "岁月如歌", "回望来时路"] },
         { "title": "今年成就", "bullets": ["营收翻一番", "三项专利", "新开两个分厂"] }
       ]
     }
     ```

2. **奖状模板**
   - 用户：`"给我闺女做张生日奖状 PPT，叫她年度最佳女儿"`
   - 调用：template = `"award"`，slides 含表彰词。

3. **语录本**
   - 用户：`"做一页红色语录本的 PPT，写几条程序员名言"`
   - 调用：template = `"quotation"`。

4. **挂历**
   - 用户：`"做一个挂历风的年度回顾 PPT"`
   - 调用：template = `"calendar"`。

## LLM 使用指南（重要）

1. **内容组织是 LLM 的工作**：用户通常只给主题 / 方向，LLM 需要：
   - 构思 4-8 张幻灯片的结构（开篇 → 正文 → 总结）
   - 每页标题 4-10 字为宜（和老课本视觉匹配）
   - 每页 3-6 条 bullets，每条不超过 20 字（避免挤爆版面）
2. **模板选择**：
   - 正式汇报 / 课堂分享 → `textbook`
   - 庆祝 / 表彰 / 祝福 → `award`
   - 名言 / 格言 / 语录集 → `quotation`
   - 年度回顾 / 日期相关 → `calendar`
3. **文件输出后**：
   - 工具返回 `filePath` 后，**主动告诉用户文件已保存到哪里**
   - 建议用户用 PowerPoint / WPS / Keynote 打开
   - 可附加一句怀旧风打趣话

## 注意事项

- 输出真实的 `.pptx` 二进制文件，可直接用 PowerPoint 打开
- 幻灯片数量建议 3-12 张，过多会让文件臃肿
- 所有文字使用宋体（SimSun / Songti SC），英文系统也能降级显示
- 文件默认存到 Skill 的 `dataDir`；如需指定路径，传 `outputPath`
- 生成属于 MODERATE 风险（写磁盘文件），需用户确认

## 模板视觉说明

| 模板 | 配色 | 关键元素 |
|------|------|----------|
| `textbook` | 宣纸米黄 + 墨黑 + 朱砂红 | 课本边框、页码、方格背景、红色批注印章 |
| `award` | 奖状金 + 搪瓷红 | 红双喜 / 奖状波浪边、烫金标题、大红印章 |
| `quotation` | 正红底 + 黄字 | 语录本大红封面、毛体风标题、落款 |
| `calendar` | 米黄底 + 墨绿 + 红 | 挂历撕页感、日期方块、节气提示 |
