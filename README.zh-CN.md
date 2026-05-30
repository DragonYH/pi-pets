<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/pi--pets-🐾-FF6B6B?style=for-the-badge">
    <img src="https://img.shields.io/badge/pi--pets-🐾-FF6B6B?style=for-the-badge" alt="pi-pets" height="48">
  </picture>
</p>

<p align="center">
  <strong><a href="https://github.com/earendil-works/pi-coding-agent">pi</a> 编码助手的虚拟宠物系统</strong>
  <br>
  <sub>导入精灵图宠物、确定性孵化、陪伴编码——你的伙伴，就住在终端里</sub>
</p>

<p align="center">
  <a href="#-特性"><img src="https://img.shields.io/badge/特性-📋-FF6B6B?style=flat-square"></a>
  <a href="#-安装"><img src="https://img.shields.io/badge/安装-📦-00B894?style=flat-square"></a>
  <a href="#-快速开始"><img src="https://img.shields.io/badge/快速开始-🚀-0984E3?style=flat-square"></a>
  <a href="#-命令列表"><img src="https://img.shields.io/badge/命令-⌨️-6C5CE7?style=flat-square"></a>
  <a href="#-宠物文件"><img src="https://img.shields.io/badge/宠物文件-📥-FD79A8?style=flat-square"></a>
  <a href="#-语言"><img src="https://img.shields.io/badge/语言-🌐-00CECE?style=flat-square"></a>
  <a href="./README.md"><img src="https://img.shields.io/badge/English-🇬🇧-FADB4A?style=flat-square"></a>
</p>

---

## 📋 特性

pi-pets 是 [pi 编码助手](https://github.com/earendil-works/pi-coding-agent)的一个**扩展**，为你的终端带来一只虚拟宠物。与纯装饰性的宠物插件不同，pi-pets 的宠物**会响应你的编码行为**——代码写得好就成长，错误堆积就闹脾气，还需要你定时照顾。

- ✅ **导入制物种** — 无内置物种；从 Codex 生态导入任意宠物（`pet.json` + `spritesheet.webp`）
- ✅ **确定性孵化** — 基于种子的 PRNG（mulberry32），同一 seed + 物种永远生成同一只宠物
- ✅ **5 级稀有度** — 普通(60%) → 稀有(25%) → 精良(10%) → 史诗(4%) → 传说(1%)，外加 1% 闪光概率
- ✅ **5 阶段成长** — 幼生体 → 成长体 → 进化体 → 完全体 → 究极体，经验值来自编码行为
- ✅ **8 种情绪状态** — 开心、好奇、兴奋、疲惫、饥饿、沮丧、工作中、生病——由需求和编码事件驱动
- ✅ **3 轴需求系统** — 饥饿、精力、快乐随时间衰减；喂食和抚摸让你的宠物保持健康
- ✅ **事件驱动反应** — 完成对话轮次、工具调用、测试通过、修复错误均可获得经验值
- ✅ **精灵图动画** — 导入使用与 Codex 兼容的宠物文件（`pet.json` + `spritesheet.webp`），以真彩色半块 ANSI 艺术渲染
- ✅ **覆盖层 + 面板 UI** — 可切换的宠物覆盖层，包含精灵图、属性条和对话气泡；小终端支持紧凑模式
- ✅ **底部状态栏** — 始终可见的状态行，显示宠物名字、等级、情绪和需求
- ✅ **全局伙伴** — 一只宠物跨所有项目陪伴你
- ✅ **双语言支持** — 支持中英文，自动检测系统语言

## 📦 安装

### 方式一：npm 安装（推荐）

```bash
pi install npm:@rokiy/pi-pets
```

### 方式二：GitHub 安装

```bash
pi install git:github.com/DragonYH/pi-pets
```

### 方式三：本地开发

```bash
git clone https://github.com/DragonYH/pi-pets.git
cd pi-pets
npm install
pi install ./
```

### 验证安装

重启 pi。一切就绪——但孵化之前需要先导入宠物文件（见[快速开始](#-快速开始)）。

## 🚀 快速开始

pi-pets 会在设置完成后**自动响应**你的编码会话：

- **会话开始时** — 加载宠物状态，应用离线恢复
- **每轮对话后** — 根据 token 使用量给予经验值
- **工具调用后** — 追踪成功/错误，更新情绪（连续 3+ 错误 → 沮丧）
- **会话关闭时** — 保存宠物状态并清理定时器

### 快速入门流程

由于 pi-pets **没有内置物种**，孵化之前必须先导入至少一个宠物文件：

**第一步：下载宠物文件** — 从 [Codex Pet 社区](https://codex-pet.org/) 或 [PetDex](https://petdex.crafter.run/) 下载。每个宠物需要同目录下的 `pet.json`（元数据）和 `spritesheet.webp`（动画帧）。

**第二步：导入宠物**：

```bash
/pets import /path/to/downloaded-pet-folder
```

这会验证宠物文件、将精灵图转换为动画帧，并缓存到本地以便快速渲染。

**第三步：孵化你的第一只宠物** — pi-pets 从所有已导入物种中随机选择：

```bash
/pets hatch
# 或者用自定义种子，同一种子永远生成同一只宠物：
/pets hatch my-secret-seed
```

**第四步：互动** — 宠物会立即对你的编码活动做出反应：

```bash
/pets pet      # 抚摸它增加快乐
/pets feed     # 饿了就喂食
/pets info     # 查看宠物的状态和心情
/pets list     # 在多个宠物间切换
```

**第五步：切换 UI** — 宠物覆盖层会显示在终端中：

```bash
/pets ui       # 显示/隐藏宠物覆盖层
```

底部状态栏也会实时显示宠物的名字、等级、情绪和需求值。

## ⌨️ 命令列表

| 命令 | 说明 |
|------|------|
| `/pets` | 显示全部命令及说明 |
| `/pets hatch [seed]` | 孵化新宠物（可选 seed 字符串，用于确定性生成） |
| `/pets info` | 显示宠物详细档案（物种、稀有度、属性、个性） |
| `/pets list` | 列出已孵化宠物并交互切换 |
| `/pets pet` | 抚摸宠物（+快乐，+XP） |
| `/pets feed` | 喂食宠物（+饥饿，+XP） |
| `/pets rename <名字>` | 给宠物改名（1-32 字符，自动过滤控制字符） |
| `/pets ui` | 显示/隐藏宠物覆盖层 |
| `/pets release` | 永久放生（需确认） |
| `/pets import <path>` | 从目录导入精灵图宠物 |
| `/pets clean [species]` | 清除指定物种图像缓存（默认当前宠物） |
| `/pets delete <species>` | 删除指定物种缓存文件（仅当没有宠物使用该物种） |
| `/pets lang <zh-CN\|en>` | 切换显示语言 |
| `/pets help` | 显示全部命令及说明 |

```bash
# 用自定义种子孵化
/pets hatch my-secret-seed

# 查看宠物
/pets info

# 删除物种文件（仅当无宠物使用时）
/pets delete meow

# 快速互动
/pets pet
/pets feed

# 切换语言
/pets lang en
```

## 📥 宠物文件

pi-pets 使用与 Codex 生态系统兼容的精灵图宠物文件。每个宠物需要同目录下的一对文件：**pet.json**（元数据）和 **spritesheet.webp**（动画帧）。

### 推荐下载来源

- **[Codex Pet](https://codex-pet.org/)** — 使用基于网页的宠物创建器创建和下载宠物。浏览社区画廊获取其他用户分享的宠物，或自行设计宠物形象。

- **[PetDex](https://petdex.crafter.run/)** — 综合性宠物档案网站，提供可直接使用的精灵图和详细的物种数据。

### 文件格式

- `pet.json` — 物种元数据（名称、emoji、描述）
- `spritesheet.webp` — 8 列 × 9 行动画帧网格（每帧 192×208px），覆盖 9 种动画状态：idle、run、sleep、eat、attack、hurt、jump、play、failed

### 导入

下载宠物文件包后，通过以下命令导入：

```bash
/pets import /path/to/downloaded-pet-folder
```

导入后即可孵化：

```bash
/pets hatch
```

pi-pets 从所有已导入物种中随机选择。你可以导入任意数量的宠物，并通过 `/pets list` 管理它们。

## 🌱 成长阶段

| 阶段 | 等级范围 | 经验需求 | 解锁内容 |
|------|----------|----------|----------|
| **幼生体** (Baby) | Lv 1-2 | 0-399 | 基础情绪 |
| **成长体** (Child) | Lv 3-4 | 400-899 | 情绪互动 |
| **进化体** (Teen) | Lv 5-7 | 900-2,499 | — |
| **完全体** (Adult) | Lv 8-12 | 2,500-7,199 | — |
| **究极体** (Elder) | Lv 13+ | 7,200+ | — |

### 经验来源

| 事件 | 经验值 |
|------|--------|
| 完成一轮对话 | 5-15 |
| 工具调用成功 | 3-8 |
| 测试全部通过 | +20 |
| 修复一个错误 | +25 |
| `/pets pet` | +2（每日上限 10 次） |
| `/pets feed` | +1（每日上限 5 次） |
| 会话结束 | +10 |

等级公式：`等级 = floor(sqrt(经验值 / 100))`

## 💎 稀有度

| 稀有度 | 概率 | 效果 |
|--------|------|------|
| **普通** | 60% | 标准名称颜色 |
| **稀有** | 25% | 绿色名称 |
| **精良** | 10% | 蓝色名称 |
| **史诗** | 4% | 紫色名称 + 闪光特效 |
| **传说** | 1% | 金色名称 |

> ✨ **闪光**：任意稀有度上独立 1% 概率——颜色反转 + 特殊标记。

所有稀有度抽取均基于种子确定性生成——相同种子 + 物种 = 相同稀有度。

## 😊 情绪与需求

**8 种情绪**响应你的编码行为：

- 😊 **开心** — 默认状态，需求充足
- 🤔 **好奇** — 近期活跃且需求舒适
- 🎉 **兴奋** — 测试全通过、升级、进化
- 😴 **疲惫** — 精力低于 30%
- 🍽️ **饥饿** — 饥饿低于 30%
- 😤 **沮丧** — 连续 3+ 次错误
- 💻 **工作中** — 5 分钟内有活动
- 🤒 **生病** — 任意需求严重不足（低于 10）

**3 轴需求**实时衰减：

| 需求 | 衰减速率 | 恢复方式 |
|------|----------|----------|
| 饥饿 | 0.025/分钟 | `/pets feed` (+40) |
| 精力 | 0.015/分钟（活跃）| 30+ 分钟不操作 (+20) |
| 快乐 | 0.010/分钟 | `/pets pet` (+15), 编码成功 (+5) |

## 🧠 架构

```
┌────────────────────────────────────────────────────────────┐
│  pi 编码助手                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [对话界面]                                          │  │
│  │                                                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  状态栏: 🐾 "小橘" Lv.4 🙂 *1500XP H:60 E:45       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ 扩展: pi-pets ──────────────────────────────────────┐  │
│  │  session_start     ──►  load() + applyIdleRecovery() │  │
│  │  turn_end          ──►  onTurnComplete() → addXp()   │  │
│  │  tool_execution_end──►  onToolExecuted() → emotion   │  │
│  │  session_shutdown  ──►  save() + clearTimers()       │  │
│  │  setInterval(60s)  ──►  tick() → decayNeeds()        │  │
│  │  setInterval(500ms)──►  render() → setWidget()       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ 持久化 (~/.pi/agent/pets/) ─────────────────────────┐  │
│  │  骨骼 (seed→PRNG): 物种ID、稀有度、属性、闪光        │  │
│  │  灵魂:             名字、个性                         │  │
│  │  运行时状态:        经验、等级、阶段、情绪、需求      │  │
│  │  缓存:              ~/.pi/agent/pets/pet-cache/      │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 监听的事件

- **`session_start`** — 加载宠物状态，计算离线衰减恢复
- **`turn_end`** — 给予本轮经验值，检查升级/进化
- **`tool_execution_end`** — 追踪成功/错误次数，更新情绪
- **`session_shutdown`** — 保存状态，清理定时器

## 🌐 语言

pi-pets 支持双语显示（中文和英文）。

### 自动检测

语言会自动从系统环境变量中检测：
- `LANG`、`LC_ALL` 或 `LC_MESSAGES` 以 `zh` 开头 → 中文
- 否则 → 英文

### 手动切换

通过 `/pets lang` 命令随时切换：

```bash
/pets lang zh-CN    # 切换到简体中文
/pets lang en       # 切换到英文
```

语言设置在每次会话中有效——重启后重新检测系统语言。

## 🏗️ 项目结构

```
pi-pets/
├── src/
│   ├── index.ts                   # 扩展入口
│   ├── types.ts                   # TypeScript 类型定义
│   ├── config.ts                  # 配置常量
│   ├── pet_instance.ts            # PetEngine — 核心状态机
│   ├── commands.ts                # /pets 命令注册
│   ├── events.ts                  # 生命周期事件绑定 + UI 渲染循环
│   ├── hatchery.ts                # 孵化逻辑 (seed→骨骼)
│   ├── evolution.ts               # 成长阶段逻辑
│   ├── needs.ts                   # 3 轴需求衰减与恢复
│   ├── xp.ts                      # 经验计算与等级曲线
│   ├── species.ts                 # 物种解析器（无内置物种——全部导入）
│   ├── name_generator.ts          # 备用名称生成器
│   ├── persistence.ts             # 状态存取
│   ├── prng.ts                    # 确定性 PRNG (mulberry32)
│   ├── renderer/                  # 宠物渲染管线
│   │   ├── art-provider.ts        # 帧缓存与动画状态管理
│   │   ├── cache.ts               # 持久帧缓存
│   │   ├── converter.ts           # Spritesheet.webp → 像素网格转换
│   │   ├── importer.ts            # pet.json + spritesheet.webp 导入流程
│   │   └── renderer.ts            # ANSI 半块与文本回退渲染
│   ├── ui/                        # UI 组件
│   │   ├── pet-overlay.ts         # 宠物覆盖层显示逻辑
│   │   ├── widget.ts              # 面板渲染
│   │   ├── overlay.ts             # 升级/进化特效
│   │   ├── bubbles.ts             # 8 情绪 × 对话气泡池（i18n）
│   │   ├── footer.ts              # 状态栏渲染
│   │   └── visual-utils.ts        # ANSI 可视化工具函数
│   └── i18n/                      # 国际化
│       ├── index.ts               # i18n 核心（t(), setLanguage, 自动检测）
│       ├── en.ts                  # 英文翻译字典
│       └── zh-CN.ts               # 中文翻译字典
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── README.md
└── README.zh-CN.md
```

## 🛠️ 开发者

### 类型检查

```bash
npx tsc --noEmit
```

### 构建

```bash
npm run build
```

### 在 pi 中运行

```bash
pi -e ./src/index.ts
```

### 测试

```bash
npm test
```

## 📄 许可证

[MIT](./LICENSE)

---

<p align="center">
  <sub>为 <a href="https://github.com/earendil-works/pi-coding-agent">pi 编码助手</a> 生态构建</sub>
  <br>
  <a href="./README.md"><img src="https://img.shields.io/badge/🇬🇧_Read_in_English-FFD700?style=for-the-badge"></a>
</p>
