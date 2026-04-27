# CodeLingo

[한국어](README.ko.md) · [English](README.en.md) · [日本語](README.ja.md) · [中文](README.zh-CN.md)

낯선 코드를 빠르고 안전하게 이해하기 위한 Claude Code 슬래시 커맨드 모음입니다.

매번 프롬프트를 새로 짜서 AI에게 물어보는 대신, CodeLingo는 세 가지 상황에 맞는 커맨드를 제공합니다. 파일을 이해할 때, 변경 영향도를 보기 전에, 그리고 다른 사람에게 인수인계 문서를 만들 때입니다.

## 이런 사람에게 맞습니다

- 처음 보는 저장소를 빠르게 읽어야 하는 개발자
- AI가 생성했거나 바이브 코딩으로 만든 코드를 다시 이해해야 하는 사람
- 무거운 사내 문서 시스템 없이도 최소한의 구조화된 문서를 남기고 싶은 팀

## 빠른 시작

1. 패키지를 설치합니다.
2. Claude Code용 슬래시 커맨드를 복사합니다.
3. 실제 파일 하나에 바로 실행해 봅니다.

```bash
npm install -g codelingo
codelingo install
```

그다음 Claude Code에서:

```text
/explain-file src/utils/scheduler.py
```

처음 몇 분 안에 감이 오면, 나머지 커맨드도 바로 이해됩니다.

## 커맨드 구성

| 커맨드 | 이런 때 사용 | 출력 파일 |
|--------|--------------|-----------|
| `/explain-file <경로>` | 파일을 수정하기 전에 먼저 이해해야 할 때 | `.codelingo/<파일명>.md` |
| `/change-impact <경로> ["변경 내용"]` | 수정 전에 영향 범위를 추정하고 싶을 때 | `.codelingo/change-impact-<파일명>.md` |
| `/handoff <경로>` | 다음 사람을 위한 인수인계 문서를 만들고 싶을 때 | `.codelingo/HANDOFF-<파일명>.md` |

### `/explain-file <경로>`

내 실력 수준에 맞춰 소스 파일을 설명하고 결과를 저장합니다.

무엇을 해주나:
- 언어 숙련도: 초보, 보통, 숙련을 먼저 묻습니다
- 누구에게나 같은 설명을 하지 않고 깊이를 조절합니다
- 라인 번호, 제어 흐름, 의존성, 함정, 다음에 읽을 파일까지 정리합니다
- 원하면 소스 파일에 주석을 직접 추가할 수도 있습니다

예시:

```text
/explain-file src/services/billing/retry_policy.ts
```

### `/change-impact <경로> ["변경 내용"]`

파일을 수정하기 전에 무엇이 깨질 수 있는지, 어디를 같이 봐야 하는지 정리합니다.

무엇을 해주나:
- 먼저 이 파일의 역할을 짧게 설명해 영향 분석의 맥락을 잡습니다
- 직접 바뀌는 함수, 클래스, 상수, 라인을 짚습니다
- 예상 호출자를 `probably`, `possibly`, `unknown` 신뢰도로 나눠 적습니다
- 변경 전/후 체크리스트를 만들어서 더 안전하게 수정할 수 있게 합니다

예시:

```text
/change-impact src/services/billing/retry_policy.ts "최대 backoff 제한을 추가하고 싶어"
```

### `/handoff <경로>`

다음 사람이 실제로 읽을 수 있는 인수인계 문서를 만듭니다.

무엇을 해주나:
- 대상 독자가 누구인지 묻습니다: 같은 팀 개발자, 외부 개발자, 비개발자
- 독자에 맞춰 설명 깊이와 용어 수준을 조절합니다
- 모듈 목적, 주요 결정 사항, 의존성 맵, 자주 하는 변경 방법, 알려진 함정을 정리합니다
- 원하면 소스 파일 맨 위에 TL;DR 블록도 추가할 수 있습니다

예시:

```text
/handoff src/services/billing/retry_policy.ts
```

## 설치

### 1. npm 설치

```bash
npm install -g codelingo
codelingo install
```

이 명령은 세 개의 Markdown 커맨드 파일을 `~/.claude/commands/`로 복사합니다.

### 2. 수동 설치

npm 패키지를 쓰고 싶지 않다면 파일만 직접 복사해도 됩니다.

```bash
mkdir -p ~/.claude/commands
curl -o ~/.claude/commands/explain-file.md   https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/explain-file.md
curl -o ~/.claude/commands/change-impact.md  https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/change-impact.md
curl -o ~/.claude/commands/handoff.md        https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/handoff.md
```

설치가 끝나면 어떤 Claude Code 세션에서든 바로 사용할 수 있습니다.

## 실제 사용 흐름

### 첫 실행

처음 사용할 때 설정은 `.codelingo/config.json`에 저장됩니다.

- `language`: `en`, `ko`, `ja`, `zh`
- `skillLevel`: `/explain-file`용 `beginner`, `familiar`, `expert`

한 번 저장되면 다음부터는 같은 질문을 반복하지 않습니다.

설명 깊이를 다시 고르고 싶다면 `.codelingo/config.json`에서 `skillLevel` 필드를 삭제하면 됩니다.

### 결과물 저장 위치

모든 결과물은 프로젝트 안의 `.codelingo/` 디렉터리에 저장됩니다.

- `/explain-file src/utils/job_scheduler.py`
  → `.codelingo/job_scheduler.md`
- `/change-impact src/utils/job_scheduler.py "..."`
  → `.codelingo/change-impact-job_scheduler.md`
- `/handoff src/utils/job_scheduler.py`
  → `.codelingo/HANDOFF-job_scheduler.md`

대화창에만 남지 않고 코드 옆에 파일로 남는다는 점이 핵심입니다.

### 주석 삽입

두 커맨드는 원본 파일도 선택적으로 수정할 수 있습니다.

- `/explain-file`: TL;DR 헤더, 함수/클래스 단위 주석, 줄 단위 주석
- `/handoff`: 인수인계 문서를 가리키는 TL;DR 헤더

중복 삽입을 막기 위한 규칙이 포함되어 있어서 기존 CodeLingo 블록은 덮어쓰도록 설계되어 있습니다.

## 사용 예시

### 수정 전에 파일 구조 먼저 이해하기

```text
/explain-file src/auth/middleware.ts
```

파일을 열었지만 아직 건드리기 불안할 때 쓰는 커맨드입니다.

### 리팩터링 전에 위험 범위 확인하기

```text
/change-impact src/auth/middleware.ts "토큰 파싱과 권한 체크를 분리하고 싶어"
```

겉보기에 작아 보여도 실제로는 넓게 번질 수 있는 변경에 적합합니다.

### 다른 사람에게 넘길 문서 만들기

```text
/handoff src/auth/middleware.ts
```

팀원, 외부 개발자, PM에게 맥락까지 포함해 설명해야 할 때 유용합니다.

## CLI 레퍼런스

```text
codelingo install      슬래시 커맨드를 ~/.claude/commands/ 에 복사
codelingo uninstall    슬래시 커맨드를 ~/.claude/commands/ 에서 제거
codelingo list         설치된 커맨드 상태 확인
codelingo help         도움말 출력
```

## 필요 조건

- [Claude Code](https://claude.ai/code)
- Claude Code에 설정된 Anthropic API 키
- npm 설치 방식을 쓸 경우 Node.js 16 이상

## 기대할 점과 한계

- AST 기반 정적 분석기가 아니라 프롬프트 기반 워크플로입니다
- `/change-impact`의 호출자 추론은 일부러 신뢰도를 명시합니다
- 생성 코드나 노이즈가 큰 파일은 과하게 설명하지 않고 거절하는 것이 정상 동작입니다

Claude Code 안에서 코드 이해용 워크플로를 더 구조적으로 만들고 싶다면, 이 프로젝트의 역할은 거기에 맞춰져 있습니다.
