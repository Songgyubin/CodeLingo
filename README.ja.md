# CodeLingo

[한국어](README.ko.md) · [English](README.en.md) · [日本語](README.ja.md) · [中文](README.zh-CN.md)

見慣れないコードを素早く安全に理解するための Claude Code スラッシュコマンド集です。

コマンドは3つだけ。どんなプロジェクトにもすぐに追加でき、Claude Code のネイティブな `/` コマンドシステムとそのまま連携します。

## コマンド

### `/explain-file <パス>`

スキルレベルに合わせてソースファイルを解析し、結果を `.codelingo/` に保存します。

- 言語の習熟度（初級 / 普通 / 上級）を確認し、説明の深さを調整します
- 解析結果を `.codelingo/<ファイル名>.md` に保存します
- ソースファイルに直接コメントを追加するオプションもあります:
  - **A** - ファイル先頭に TL;DR サマリーブロック
  - **B** - 各関数・クラスの前に簡単な説明コメント
  - **C** - 難解なロジック行ごとにインラインコメント

### `/change-impact <パス> ["変更内容"]`

変更前に、その影響範囲を把握します。

- 直接影響を受ける関数・行を行番号付きで表示します
- 呼び出し元を `probably / possibly / unknown` の信頼度で推論します
- イベントエミッター、DI、動的インポートなど、静的解析の限界となる動的パターンを明示します
- Before/After チェックリストを提供します
- `.codelingo/change-impact-<ファイル名>.md` に保存します

### `/handoff <パス>`

任意のソースファイルに対して、構造化されたハンドオフドキュメントを生成します。

- 読み手（同じチームの開発者 / 外部開発者 / 非開発者）を確認し、説明の深さを調整します
- モジュールの目的、アーキテクチャ用語集、主要な判断とその理由、依存関係マップ、よくある変更方法、既知の落とし穴を整理します
- ソースファイル先頭に TL;DR コメントを挿入するオプションもあります
- `.codelingo/HANDOFF-<ファイル名>.md` に保存します

## インストール

**npm でインストール（推奨）:**

```bash
npm install -g codelingo
codelingo install
```

**手動インストール（3ファイルをコピー）:**

```bash
mkdir -p ~/.claude/commands
curl -o ~/.claude/commands/explain-file.md   https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/explain-file.md
curl -o ~/.claude/commands/change-impact.md  https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/change-impact.md
curl -o ~/.claude/commands/handoff.md        https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/handoff.md
```

以上です。インストール直後から、すべての Claude Code セッションでコマンドを使えます。

## 使い方

```text
/explain-file src/utils/scheduler.py
/change-impact src/utils/scheduler.py "リトライ回数パラメータを追加したい"
/handoff src/auth/middleware.ts
```

**設定の保存:**

初回実行時に言語設定とスキルレベルを `.codelingo/config.json` に保存します。以降の実行では、それらの質問をスキップします。

スキルレベルをリセットするには、`.codelingo/config.json` から `skillLevel` フィールドを削除してください。

## CLI リファレンス

```text
codelingo install      コマンドを ~/.claude/commands/ にコピー
codelingo uninstall    コマンドを ~/.claude/commands/ から削除
codelingo list         インストール済みコマンドの一覧表示
```

## 動作要件

- [Claude Code](https://claude.ai/code)（すべてのプラン）
- Claude Code に設定された Anthropic API キー
- Node.js 16 以上（npm インストール方式のみ）
