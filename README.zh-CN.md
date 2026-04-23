# CodeLingo

[한국어](README.ko.md) · [English](README.en.md) · [日本語](README.ja.md) · [中文](README.zh-CN.md)

用于快速、安全地理解陌生代码的 Claude Code 斜杠命令集。

一共 3 个命令，开箱即用。可以直接加入任何项目，并与 Claude Code 原生 `/` 命令系统无缝集成。

## 命令

### `/explain-file <路径>`

根据你的技能水平分析源文件，并将结果保存到 `.codelingo/`。

- 询问你对该语言的熟悉程度（初级 / 熟悉 / 专家），并调整说明深度
- 将分析结果保存到 `.codelingo/<文件名>.md`
- 可选择直接在源文件中添加注释:
  - **A** - 在文件顶部添加 TL;DR 摘要块
  - **B** - 在每个函数或类前添加简短说明注释
  - **C** - 对每个不明显的逻辑行添加内联注释

### `/change-impact <路径> ["拟议变更"]`

在动手修改前，先分析变更的影响范围。

- 显示直接受影响的函数和行，并附带行号
- 以 `probably / possibly / unknown` 的置信度推断可能的调用者
- 标记会限制静态分析的动态模式，例如事件发射器、DI、动态导入
- 提供 Before/After 检查清单
- 保存到 `.codelingo/change-impact-<文件名>.md`

### `/handoff <路径>`

为任意源文件生成结构化的交接文档。

- 询问目标读者（同团队开发者 / 外部开发者 / 非开发者），并调整说明深度
- 覆盖模块目的、架构术语表、关键决策及其原因、依赖关系图、常见修改方式和已知陷阱
- 可选择在源文件顶部插入 TL;DR 注释
- 保存到 `.codelingo/HANDOFF-<文件名>.md`

## 安装

**通过 npm 安装（推荐）:**

```bash
npm install -g codelingo
codelingo install
```

**手动安装（复制 3 个文件）:**

```bash
mkdir -p ~/.claude/commands
curl -o ~/.claude/commands/explain-file.md   https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/explain-file.md
curl -o ~/.claude/commands/change-impact.md  https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/change-impact.md
curl -o ~/.claude/commands/handoff.md        https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/handoff.md
```

完成。安装后即可在任何 Claude Code 会话中立即使用这些命令。

## 使用方法

```text
/explain-file src/utils/scheduler.py
/change-impact src/utils/scheduler.py "我想添加一个重试次数参数"
/handoff src/auth/middleware.ts
```

**持久化配置:**

首次运行时，语言偏好和技能水平会保存到 `.codelingo/config.json`。后续运行将跳过这些问题。

若要重置技能水平，请删除 `.codelingo/config.json` 中的 `skillLevel` 字段。

## CLI 参考

```text
codelingo install      将命令复制到 ~/.claude/commands/
codelingo uninstall    从 ~/.claude/commands/ 中删除命令
codelingo list         显示已安装的命令列表
```

## 系统要求

- [Claude Code](https://claude.ai/code)（任意套餐）
- 已在 Claude Code 中配置好的 Anthropic API 密钥
- Node.js 16+（仅 npm 安装方式需要）
