# CodeLingo

[한국어](README.ko.md) · [English](README.en.md) · [日本語](README.ja.md) · [中文](README.zh-CN.md)

用于快速、安全地理解陌生代码的 Claude Code 斜杠命令集。

与其每次都临时写一段提示词去问 AI，CodeLingo 直接把三类高频场景做成了三个命令：先理解文件、修改前评估影响、以及为下一个读者生成交接文档。

## 适合谁

- 第一次阅读陌生仓库的开发者
- 需要回头理解 AI 生成代码或 vibe coding 代码的人
- 不想搭建重型内部文档系统，但又想保留结构化说明的团队

## 快速开始

1. 安装包。
2. 把斜杠命令复制到 Claude Code。
3. 直接对一个真实文件运行一次。

```bash
npm install -g @gyub.s/codelingo
codelingo install
```

然后在 Claude Code 里：

```text
/explain-file src/utils/scheduler.py
```

如果前几分钟就感觉顺手，后面的工作流基本也会成立。

## 命令说明

| 命令 | 适用场景 | 输出文件 |
|------|----------|----------|
| `/explain-file <路径>` | 修改前先理解文件 | `.codelingo/<文件名>.md` |
| `/change-impact <路径> ["拟议变更"]` | 修改前先估算影响范围 | `.codelingo/change-impact-<文件名>.md` |
| `/handoff <路径>` | 为下一位读者生成交接文档 | `.codelingo/HANDOFF-<文件名>.md` |

### `/explain-file <路径>`

按你的熟悉程度解释源文件，并把结果保存下来。

它会做什么：
- 先询问你对该语言的熟悉程度：初级、熟悉、专家
- 不给所有人同一套解释，而是按深度调整
- 整理行号、控制流、依赖、陷阱以及下一步该读什么
- 还可以选择把注释直接写回源文件

示例：

```text
/explain-file src/services/billing/retry_policy.ts
```

### `/change-impact <路径> ["拟议变更"]`

在真正修改前，先整理出哪些地方可能会受影响、哪些地方容易出问题。

它会做什么：
- 先简要说明这个文件的职责，让影响分析有上下文
- 指出会直接变化的函数、类、常量和行
- 用 `probably`、`possibly`、`unknown` 标记可能的调用方
- 生成修改前和修改后的检查清单，降低误改风险

示例：

```text
/change-impact src/services/billing/retry_policy.ts "我想增加一个最大 backoff 上限"
```

### `/handoff <路径>`

生成一份下一个人真的能读懂、能接手的交接文档。

它会做什么：
- 先问目标读者是谁：同团队开发者、外部开发者、非开发者
- 根据读者调整术语和解释深度
- 覆盖模块目的、关键决策、依赖关系图、常见修改方式和已知陷阱
- 还可以选择在源文件顶部加入 TL;DR 注释块

示例：

```text
/handoff src/services/billing/retry_policy.ts
```

## 安装

### 1. 通过 npm 安装

```bash
npm install -g @gyub.s/codelingo
codelingo install
```

这会把 3 个 Markdown 命令文件复制到 `~/.claude/commands/`。

### 2. 手动安装

如果你不想使用 npm 包，也可以直接复制文件：

```bash
mkdir -p ~/.claude/commands
curl -o ~/.claude/commands/explain-file.md   https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/explain-file.md
curl -o ~/.claude/commands/change-impact.md  https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/change-impact.md
curl -o ~/.claude/commands/handoff.md        https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/handoff.md
```

安装完成后，就可以在任何 Claude Code 会话里直接使用。

## 实际工作流

### 首次运行

首次使用时，偏好会写入 `.codelingo/config.json`。

- `language`: `en`、`ko`、`ja`、`zh`
- `skillLevel`: `/explain-file` 使用的 `beginner`、`familiar`、`expert`

保存一次之后，后续就不会重复问这些问题。

如果想重置解释深度，删除 `.codelingo/config.json` 里的 `skillLevel` 字段即可。

### 生成文件保存到哪里

所有输出都会写到项目内的 `.codelingo/` 目录。

- `/explain-file src/utils/job_scheduler.py`
  → `.codelingo/job_scheduler.md`
- `/change-impact src/utils/job_scheduler.py "..."`
  → `.codelingo/change-impact-job_scheduler.md`
- `/handoff src/utils/job_scheduler.py`
  → `.codelingo/HANDOFF-job_scheduler.md`

重点是结果不会只留在聊天记录里，而是作为文件保存在代码旁边。

### 注释写回源文件

有两个命令可以选择修改源文件：

- `/explain-file`：添加 TL;DR 头部、函数/类级别注释、逐行注释
- `/handoff`：添加指向交接文档的 TL;DR 头部

命令里包含幂等规则，所以已有的 CodeLingo 块会被替换，不会不断重复追加。

## 使用示例

### 修改前先看懂文件

```text
/explain-file src/auth/middleware.ts
```

适合“已经打开文件，但还不敢改”的时刻。

### 重构前先确认风险

```text
/change-impact src/auth/middleware.ts "我想把 token 解析和权限检查拆开"
```

适合那种表面上看起来很小、实际上可能牵一发动全身的修改。

### 给别人留下接手文档

```text
/handoff src/auth/middleware.ts
```

当你需要向同事、外部开发者或 PM 解释上下文时很有用。

## CLI 参考

```text
codelingo install      将斜杠命令复制到 ~/.claude/commands/
codelingo uninstall    从 ~/.claude/commands/ 删除斜杠命令
codelingo list         查看安装状态
codelingo help         显示帮助
```

## 运行要求

- [Claude Code](https://claude.ai/code)
- 已在 Claude Code 中配置的 Anthropic API Key
- 如果使用 npm 安装方式，需要 Node.js 16+

## 预期与边界

- 这是基于提示词的工作流，不是 AST 驱动的静态分析器
- `/change-impact` 对调用方推断会明确标出置信度
- 对生成文件或噪音很大的文件，正常行为是拒绝分析，而不是硬解释

如果你想在 Claude Code 里把“理解代码”这件事做得更结构化，这个项目就是为这个目标准备的。
