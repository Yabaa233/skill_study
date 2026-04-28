# ClawPet Skill Registry (Monorepo)

ClawPet 桌面宠物的 **Skill 索引 + 代码 Monorepo** 仓库。

本仓库同时承担两件事：

1. **索引**：根目录 `registry.json` 枚举所有可安装 Skill 的元数据；
2. **源码**：`skills/<name>/` 目录存放每个 Skill 的完整实现。

客户端拉取 Skill 时会 clone 本仓库并按 `subdirectory` 字段抽取对应子目录到 `~/.clawpet/skills/<name>/`。

---

## 目录结构

```
skill_study/                          ← 仓库根
├── README.md                         ← 本文件
├── registry.json                     ← 主索引（所有 Skill 的元数据）
├── .gitattributes                    ← Git LFS 规则（统一管理二进制资源）
└── skills/                           ← Monorepo：所有 Skill 源码
    └── geo-aware-custom/             ← 地理位置与天气 Skill
        ├── SKILL.md
        ├── plugin.cjs
        ├── scripts/geo.cjs
        ├── ui/index.html
        ├── test.cjs
        └── README.md
```

---

## 当前已收录的 Skills

| 名称 | Emoji | 简介 | 版本 |
|------|-------|------|------|
| [`geo-aware-custom`](./skills/geo-aware-custom) | 🌍 | IP 定位 + 实时天气 + 多日预报 + 独立 UI 窗口 | 1.0.0 |

---

## `registry.json` 格式

```jsonc
{
  "version": "1.0.0",
  "updatedAt": "YYYY-MM-DDTHH:mm:ssZ",
  "skills": [
    {
      "name": "your-skill-name",              // 与 skills/<name>/ 目录同名
      "description": "Skill 简介",
      "author": "作者",
      "emoji": "🎯",
      "version": "1.0.0",
      "repository": "",                       // 本仓库远端地址（可留空由客户端注入）
      "subdirectory": "skills/your-skill-name",
      "ref": null,                            // 可指定 tag/branch/commit；null 表示默认分支最新
      "tags": ["tag1", "tag2"],
      "os": ["win32", "darwin", "linux"],
      "minAppVersion": "1.0.0",
      "changelog": "v1.0.0: 初始版本说明"
    }
  ]
}
```

**关键字段约定**

| 字段 | 说明 |
|------|------|
| `name` | Skill 唯一标识（小写 + 连字符），**必须**与 `skills/<name>/` 目录名一致 |
| `subdirectory` | 固定格式 `skills/<name>` |
| `ref` | 可指定 tag / branch / commit；`null` 表示默认分支最新 |
| `os` | 支持的操作系统列表 |

---

## 如何添加新 Skill

1. 在 `skills/<your-skill-name>/` 下创建 Skill 目录，必须包含 `SKILL.md`（符合 AgentSkills / OpenClaw 规范）；
2. 在 `registry.json` 的 `skills` 数组中追加一条记录；
3. 更新 `registry.json` 顶部的 `updatedAt`（ISO 8601 格式）；
4. 二进制资源（图片 / 音视频 / 字体 / 3D 模型等）会由 `.gitattributes` 自动走 Git LFS，新增后正常 `git add` 即可；
5. 提交 MR 到主分支。

## 如何更新已有 Skill

1. 修改 `skills/<name>/` 下的文件；
2. 更新 `SKILL.md` 中的 `version`；
3. 同步更新 `registry.json` 中该 Skill 的 `version` 和 `changelog`；
4. 更新 `registry.json` 的 `updatedAt`；
5. 提交 MR。

---

## Git LFS

仓库使用 Git LFS 管理常见二进制文件（图片、音视频、字体、3D 模型、机器学习模型、压缩包、可执行文件、PDF 等）。

首次 clone 前请确保已安装 Git LFS：

```bash
git lfs install
git clone <repo-url>
```

查看当前 LFS 追踪规则：

```bash
git lfs track
```

新增二进制类型时，编辑 `.gitattributes` 添加对应规则。
