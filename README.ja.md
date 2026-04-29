# CodeLingo

[한국어](README.ko.md) · [English](README.en.md) · [日本語](README.ja.md) · [中文](README.zh-CN.md)

見慣れないコードを素早く安全に理解するための Claude Code スラッシュコマンド集です。

毎回その場でプロンプトを書く代わりに、CodeLingo は3つの典型的な状況に合わせたコマンドを用意します。ファイルを理解したいとき、変更の影響を読む前に把握したいとき、そして次の人のためにハンドオフ文書を作りたいときです。

## 向いている人

- 初めて見るリポジトリを素早く読みたい開発者
- AI 生成コードやバイブコーディングしたコードを後から理解し直したい人
- 大げさな社内ドキュメント基盤なしで、最低限の構造化ドキュメントを残したいチーム

## クイックスタート

1. パッケージをインストールします。
2. Claude Code 用のスラッシュコマンドをコピーします。
3. 実際のファイル1つにすぐ実行します。

```bash
npm install -g @gyub.s/codelingo
codelingo install
```

そのあと Claude Code で:

```text
/explain-file src/utils/scheduler.py
```

最初の数分でしっくり来れば、残りのコマンドの使いどころもすぐ分かります。

## コマンド一覧

| コマンド | 使う場面 | 出力ファイル |
|---------|----------|-------------|
| `/explain-file <パス>` | 修正前にまずファイルを理解したいとき | `.codelingo/<ファイル名>.md` |
| `/change-impact <パス> ["変更内容"]` | 修正前に影響範囲を見積もりたいとき | `.codelingo/change-impact-<ファイル名>.md` |
| `/handoff <パス>` | 次の人向けの引き継ぎ文書を作りたいとき | `.codelingo/HANDOFF-<ファイル名>.md` |

### `/explain-file <パス>`

スキルレベルに合わせてソースファイルを説明し、結果を保存します。

できること:
- 言語への習熟度として初級、普通、上級を先に確認します
- 誰にでも同じ説明を返さず、深さを調整します
- 行番号、制御フロー、依存関係、落とし穴、次に読むべきものまで整理します
- 必要ならソースファイルへコメントを直接追加できます

例:

```text
/explain-file src/services/billing/retry_policy.ts
```

### `/change-impact <パス> ["変更内容"]`

ファイルを修正する前に、何が壊れそうか、どこを一緒に確認すべきかを整理します。

できること:
- まずこのファイルの役割を短く説明して、影響分析の前提をそろえます
- 直接変わる関数、クラス、定数、行を挙げます
- 想定される呼び出し元を `probably`、`possibly`、`unknown` で分けて示します
- 変更前後のチェックリストを作り、安全に修正しやすくします

例:

```text
/change-impact src/services/billing/retry_policy.ts "backoff の最大値を追加したい"
```

### `/handoff <パス>`

次の読み手が実際に使えるハンドオフ文書を生成します。

できること:
- 読み手が誰かを確認します: 同じチームの開発者、外部開発者、非開発者
- その相手に合わせて説明の深さや用語を調整します
- モジュールの目的、主要な判断、依存関係マップ、よくある変更、既知の落とし穴を整理します
- 必要ならソースファイル先頭に TL;DR ブロックも追加できます

例:

```text
/handoff src/services/billing/retry_policy.ts
```

## インストール

### 1. npm でインストール

```bash
npm install -g @gyub.s/codelingo
codelingo install
```

このコマンドは 3 つの Markdown コマンドファイルを `~/.claude/commands/` にコピーします。

### 2. 手動インストール

npm パッケージを使いたくない場合は、ファイルだけ直接コピーしても構いません。

```bash
mkdir -p ~/.claude/commands
curl -o ~/.claude/commands/explain-file.md   https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/explain-file.md
curl -o ~/.claude/commands/change-impact.md  https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/change-impact.md
curl -o ~/.claude/commands/handoff.md        https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/handoff.md
```

インストール後は、どの Claude Code セッションでもすぐ使えます。

## 実際の使われ方

### 初回実行

初回利用時の設定は `.codelingo/config.json` に保存されます。

- `language`: `en`, `ko`, `ja`, `zh`
- `skillLevel`: `/explain-file` 用の `beginner`, `familiar`, `expert`

一度保存されれば、次回以降は同じ質問を繰り返しません。

説明の深さを選び直したい場合は、`.codelingo/config.json` から `skillLevel` フィールドを削除してください。

### 生成されるファイル

すべての出力はプロジェクト内の `.codelingo/` ディレクトリに保存されます。

- `/explain-file src/utils/job_scheduler.py`
  → `.codelingo/job_scheduler.md`
- `/change-impact src/utils/job_scheduler.py "..."`
  → `.codelingo/change-impact-job_scheduler.md`
- `/handoff src/utils/job_scheduler.py`
  → `.codelingo/HANDOFF-job_scheduler.md`

チャットの中に埋もれず、コードの近くにファイルとして残るのがポイントです。

### コメント挿入

2つのコマンドは、必要に応じて元ファイルも変更できます。

- `/explain-file`: TL;DR ヘッダー、関数/クラス単位コメント、行単位コメント
- `/handoff`: ハンドオフ文書を指す TL;DR ヘッダー

重複挿入を避けるルールがあるため、既存の CodeLingo ブロックは追加ではなく置き換えになります。

## 使用例

### 修正前にファイル構造を理解する

```text
/explain-file src/auth/middleware.ts
```

ファイルは開いたが、まだ安全に触れる自信がないときに使います。

### リファクタ前に影響範囲を確認する

```text
/change-impact src/auth/middleware.ts "トークン解析と権限チェックを分離したい"
```

小さく見えるが実は広がりそうな変更に向いています。

### 次の人向けに説明を残す

```text
/handoff src/auth/middleware.ts
```

チームメンバー、外部開発者、PM に背景つきで説明したいときに有効です。

## CLI リファレンス

```text
codelingo install      スラッシュコマンドを ~/.claude/commands/ にコピー
codelingo uninstall    スラッシュコマンドを ~/.claude/commands/ から削除
codelingo list         インストール状態を表示
codelingo agents       利用できる役割プロンプトを表示
codelingo tasks        利用できるハーネスタスクを表示
codelingo run          ソースファイル用のハーネス実行プロンプトを生成
codelingo help         ヘルプを表示
```

## ハーネスモード

CodeLingo には、スラッシュコマンドと同じタスクモデルを使う軽量 agent ベースのハーネスランナーも含まれます。

```bash
codelingo agents
codelingo tasks
codelingo run explain-file src/utils/scheduler.py --language ja --skill familiar
codelingo run change-impact src/utils/scheduler.py --change "最大リトライ回数を追加"
codelingo run handoff src/auth/middleware.ts --audience "external developer"
```

役割プロンプトは `agents/*.md` にあります。`codelingo run` はソースファイルのガードを適用し、対象ファイルを読み取り、task に対応する agent プロンプトを組み合わせて provider に渡せるプロンプトを `.codelingo/runs/` に保存します。プロンプトには最終出力先も含まれます。

## 要件

- [Claude Code](https://claude.ai/code)
- Claude Code に設定済みの Anthropic API キー
- npm インストール方式を使う場合は Node.js 16 以上

## 想定していることと限界

- AST ベースの静的解析ではなく、プロンプト駆動のワークフローです
- `/change-impact` の呼び出し元推定は、あえて信頼度を明示します
- 生成コードやノイズの多いファイルは、無理に説明せず拒否するのが正常動作です

Claude Code の中で、コード理解の流れをもう少し構造化したいなら、このプロジェクトはそこに焦点を当てています。
