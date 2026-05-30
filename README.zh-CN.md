<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/pi--pets-🐾-FF6B6B?style=for-the-badge">
    <img src="https://img.shields.io/badge/pi--pets-🐾-FF6B6B?style=for-the-badge" alt="pi-pets" height="48">
  </picture>
</p>

<p align="center">
  <strong><a href="https://github.com/earendil-works/pi-coding-agent">pi</a> 编码助手的虚拟宠物系统</strong>
  <br>
  <sub>孵化、培养、陪伴——你的编码伙伴，就住在终端里</sub>
</p>

<p align="center">
  <a href="#-特性"><img src="https://img.shields.io/badge/特性-📋-FF6B6B?style=flat-square"></a>
  <a href="#-安装"><img src="https://img.shields.io/badge/安装-📦-00B894?style=flat-square"></a>
  <a href="#-使用"><img src="https://img.shields.io/badge/使用-🚀-0984E3?style=flat-square"></a>
  <a href="#-物种"><img src="https://img.shields.io/badge/物种-🐾-FD79A8?style=flat-square"></a>
  <a href="./README.md"><img src="https://img.shields.io/badge/English-🇬🇧-FADB4A?style=flat-square"></a>
</p>

---

## 📋 特性

pi-pets 是 [pi 编码助手](https://github.com/earendil-works/pi-coding-agent)的一个**扩展**，为你的终端带来一只虚拟宠物。与纯装饰性的宠物插件不同，pi-pets 的宠物**会响应你的编码行为**——代码写得好就成长，错误堆积就闹脾气，还需要你定时照顾。

- ✅ **12 种独特物种** — 每种绑定一个编程领域（前端、系统、ML、DevOps、安全……）
- ✅ **确定性孵化** — 基于种子的 PRNG（mulberry32），同一 seed 永远生成同一只宠物
- ✅ **5 级稀有度** — 普通(60%) → 稀有(25%) → 精良(10%) → 史诗(4%) → 传说(1%)，外加 1% 闪光概率
- ✅ **5 阶段成长** — 幼生体 → 成长体 → 进化体 → 完全体 → 究极体，经验值来自编码行为
- ✅ **7 种情绪状态** — 开心、好奇、兴奋、疲惫、饥饿、沮丧、生病——由需求和编码事件驱动
- ✅ **3 轴需求系统** — 饥饿、精力、快乐随时间衰减；喂食和抚摸让你的宠物保持健康
- ✅ **事件驱动反应** — 完成对话轮次、工具调用、测试通过、修复错误均可获得经验值
- ✅ **精灵图动画** — 导入宠物使用与 Codex 相同的宠物文件（pet.json + spritesheet.webp），以真彩色半块 ANSI 艺术渲染
- ✅ **状态栏 + 面板 UI** — 始终可见的底部状态行，以及可切换的 Widget 面板
- ✅ **全局伙伴** — 一只宠物跨所有项目陪伴你

## 📦 安装

### 方式一：npm 安装（推荐）

```bash
pi install npm:pi-pets
```

### 方式二：GitHub 安装

```bash
pi install git:github.com/<user>/pi-pets
```

### 方式三：本地开发

```bash
git clone https://github.com/<user>/pi-pets.git
cd pi-pets
npm install
pi install ./
```

### 验证安装

重启 pi。输入 `/pets hatch` 孵化你的第一只宠物。

## 🚀 使用

安装后，pi-pets **自动响应**你的编码会话：

- **会话开始时** — 加载宠物状态，应用离线恢复
- **每轮对话后** — 根据 token 使用量给予经验值
- **工具调用后** — 追踪成功/错误，更新情绪（连续 3+ 错误 → 沮丧）
- **会话关闭时** — 保存宠物状态并清理定时器

### 命令

| 命令 | 说明 |
|---------|-------------|
| `/pets` | 显示全部命令及说明 |
| `/pets hatch [seed]` | 孵化新宠物（可选 seed 字符串） |
| `/pets info` | 显示宠物详细档案（物种、稀有度、属性、个性、技能） |
| `/pets pet` | 抚摸宠物（+快乐，+XP，显示具体数值） |
| `/pets feed` | 喂食宠物（+饥饿，+XP，显示具体数值） |
| `/pets rename <名字>` | 给宠物改名（1-32 字符） |
| `/pets ui` | 显示/隐藏宠物面板 |
| `/pets release` | 永久放生（需确认） |
| `/pets import <path>` | 从目录导入精灵图宠物 |
| `/pets list` | 列出已导入的宠物 |
| `/pets clean [species]` | 清除指定物种图像缓存（默认当前宠物） |
| `/pets delete <species>` | 删除指定物种文件（仅当没有宠物使用该物种） |
| `/pets help` | 显示全部命令及说明 |
| `/pets name <名字>` | rename 的别名（兼容保留） |
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
```

## 🧠 架构

```
┌────────────────────────────────────────────────────────────┐
│  pi 编码助手                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [对话界面]                                          │  │
│  │                                                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  状态栏: Fox "小橘" Lv.4 :) *1500XP H:60 E:45       │  │
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
│  ┌─ 持久化 (~/.pi/pets/state.json) ─────────────────────┐  │
│  │  骨骼 (seed→PRNG): 物种、稀有度、属性、闪光          │  │
│  │  灵魂 (LLM生成):   名字、个性                         │  │
│  │  运行时状态:        经验、等级、阶段、情绪、需求      │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 监听的事件

- **`session_start`** — 加载宠物状态，计算离线衰减恢复
- **`turn_end`** — 给予本轮经验值，检查升级/进化
- **`tool_execution_end`** — 追踪成功/错误次数，更新情绪
- **`session_shutdown`** — 保存状态，清理定时器

## 🐾 物种

| # | 物种 | 领域 | 高属性 |
|---|---------|--------|------------|
| 1 | **Pyrofox** (火狐) | 前端开发 | SNARK, CHAOS |
| 2 | **Rustacean** (铁甲蟹) | 系统编程 | WISDOM, PATIENCE |
| 3 | **Pythonidae** (灵蟒) | 脚本/ML | WISDOM |
| 4 | **Gopher** (地鼠) | 后端服务 | PATIENCE |
| 5 | **TypeWhale** (巨鲸) | 类型系统 | DEBUGGING, WISDOM |
| 6 | **BashBat** (蝙蝠) | DevOps | CHAOS |
| 7 | **Kotlincat** (科猫) | 移动端 | PATIENCE, DEBUGGING |
| 8 | **Javaroo** (袋鼠) | 企业级 | PATIENCE, WISDOM |
| 9 | **LispLizard** (蜥蜴) | 函数式 | WISDOM, CHAOS |
| 10 | **QueryQuail** (鹌鹑) | 数据库 | DEBUGGING |
| 11 | **HexHound** (猎犬) | 安全/逆向 | DEBUGGING, CHAOS |
| 12 | **PixelPanda** (熊猫) | 全栈/设计 | 均衡 |

## 🌱 成长阶段

| 阶段 | 等级范围 | 经验需求 | 解锁内容 |
|-------|-------------|-------------|---------|
| **幼生体** (Baby) | Lv 1-2 | 0-399 | 基础情绪 |
| **成长体** (Child) | Lv 3-4 | 400-899 | 情绪互动 |
| **进化体** (Teen) | Lv 5-7 | 900-2,499 | 技能槽位 (P2) |
| **完全体** (Adult) | Lv 8-12 | 2,500-7,199 | 进化 + 第二技能 (P2) |
| **究极体** (Elder) | Lv 13+ | 7,200+ | 终极被动 (P2) |

### 经验来源

| 事件 | 经验值 |
|-------|-----|
| 完成一轮对话 | 5-15 |
| 工具调用成功 | 3-8 |
| 测试全部通过 | +20 |
| 修复一个错误 | +25 |
| `/pets pet` | +2（每日上限 10 次） |
| `/pets feed` | +1（每日上限 5 次） |
| 会话结束 | +10 |

## 💎 稀有度

| 稀有度 | 概率 | 效果 |
|--------|-------------|--------|
| **普通** | 60% | 标准名称颜色 |
| **稀有** | 25% | 绿色名称 |
| **精良** | 10% | 蓝色名称 |
| **史诗** | 4% | 紫色名称 + 闪光特效 |
| **传说** | 1% | 金色名称 + 独特待机动画 |

> ✨ **闪光**：任意稀有度上独立 1% 概率——颜色反转 + 特殊标记。

## 😊 情绪与需求

**7 种情绪**响应你的编码行为：

- 😊 **开心** — 默认状态，需求充足
- 🤔 **好奇** — 遇到新文件或新工具
- 🎉 **兴奋** — 测试全通过、升级、进化
- 😴 **疲惫** — 精力低于 30%
- 🍽️ **饥饿** — 饥饿低于 30%
- 😤 **沮丧** — 连续 3+ 次错误
- 🤒 **生病** — 任意需求归零持续 10 分钟以上

**3 轴需求**实时衰减：

| 需求 | 衰减速率 | 恢复方式 |
|------|-----------|----------|
|| 饥饿 | 0.025/分钟 | `/pets feed` (+40) |
|| 精力 | 0.015/分钟（活跃）/ 0.1/分钟（空闲）| 30+ 分钟不操作 (+20) |
|| 快乐 | 0.010/分钟 | `/pets pet` (+15), 编码成功 (+5) |

## 🏗️ 项目结构

```
pi-pets/
├── src/
│   ├── index.ts                  # 扩展入口
│   ├── types.ts                   # TypeScript 类型定义
│   ├── config.ts                  # 配置常量
│   ├── prng.ts                    # 确定性 PRNG (mulberry32)
│   ├── species.ts                 # 12 个物种定义
│   ├── hatchery.ts                # 孵化逻辑 (seed→骨骼)
│   ├── name_generator.ts          # 备用名称池（60 个名字）
│   ├── persistence.ts             # 状态存取 (~/.pi/pets/state.json)
│   ├── pet_instance.ts            # PetEngine — 核心状态机
│   ├── needs.ts                   # 3 轴需求衰减与恢复
│   ├── xp.ts                      # 经验计算与等级曲线
│   ├── evolution.ts               # 成长阶段逻辑
│   ├── commands.ts                # /pets 命令注册（多个子命令处理器）
│   ├── events.ts                  # 生命周期事件绑定 + UI 渲染循环
│   ├── renderer/                   # 宠物渲染管线
│   │   ├── art-provider.ts        # 帧缓存与动画状态管理
│   │   ├── cache.ts               # 持久帧缓存 (~/.pi/pets/pet-cache/)
│   │   ├── converter.ts           # Spritesheet.webp → 像素网格转换
│   │   ├── importer.ts            # pet.json + spritesheet.webp 导入流程
│   │   └── renderer.ts            # ANSI 半块与文本回退渲染
│   └── ui/
│       ├── footer.ts              # 状态栏渲染
│       ├── widget.ts              # 面板渲染（宠物图 + 属性条 + 气泡）
│       ├── pet-overlay.ts         # 宠物覆盖层显示逻辑
│       ├── visual-utils.ts        # 可视化工具函数
│       ├── overlay.ts             # 升级/进化特效
│       └── bubbles.ts             # 7 情绪 × 5 条对话气泡池
├── tsconfig.json
├── package.json
├── README.md
└── README.zh-CN.md
```

## 🛠️ 开发者

### 类型检查

```bash
npx tsc --noEmit
```

### 在 pi 中运行

```bash
pi -e ./src/index.ts
```

## 📄 许可证

[MIT](./LICENSE)

---

<p align="center">
  <sub>为 <a href="https://github.com/earendil-works/pi-coding-agent">pi 编码助手</a> 生态构建</sub>
  <br>
  <a href="./README.md"><img src="https://img.shields.io/badge/🇬🇧_Read_in_English-FFD700?style=for-the-badge"></a>
</p>
