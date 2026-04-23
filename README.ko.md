# CodeLingo

[한국어](README.ko.md) · [English](README.en.md) · [日本語](README.ja.md) · [中文](README.zh-CN.md)

낯선 코드를 빠르고 안전하게 이해하기 위한 Claude Code 슬래시 커맨드 모음입니다.

커맨드 3개. 어떤 프로젝트에도 바로 추가해서 사용할 수 있습니다. Claude Code의 기본 `/` 커맨드 시스템과 완벽하게 통합됩니다.

## 커맨드

### `/explain-file <경로>`

파일을 내 실력 수준에 맞게 분석하고 결과를 `.codelingo/`에 저장합니다.

- 언어 친숙도(초보 / 보통 / 숙련)를 물어보고 설명 깊이를 조절합니다
- 분석 결과를 `.codelingo/<파일명>.md`에 저장합니다
- 소스 파일에 직접 주석을 추가하는 옵션도 제공합니다:
  - **A** - 파일 맨 위에 TL;DR 요약 블록
  - **B** - 함수/클래스마다 간단한 설명 주석
  - **C** - 복잡한 로직 줄마다 인라인 주석

### `/change-impact <경로> ["변경 내용"]`

변경하기 전에 영향 범위를 미리 파악합니다.

- 직접 영향을 받는 함수/줄을 라인 번호와 함께 표시합니다
- 호출자를 `probably / possibly / unknown` 신뢰도로 추론합니다
- 이벤트 이미터, DI, 동적 import 등 정적 분석의 한계를 명시합니다
- Before/After 체크리스트를 제공합니다
- `.codelingo/change-impact-<파일명>.md`에 저장합니다

### `/handoff <경로>`

어떤 소스 파일에 대해서든 구조화된 인수인계 문서를 생성합니다.

- 읽을 대상(같은 팀 개발자 / 외부 개발자 / 비개발자)을 물어보고 깊이를 조절합니다
- 모듈 목적, 아키텍처 용어, 주요 결정사항과 그 이유, 의존성 맵, 자주 하는 변경 방법, 알려진 함정을 다룹니다
- 소스 파일 맨 위에 TL;DR 주석을 삽입하는 옵션도 있습니다
- `.codelingo/HANDOFF-<파일명>.md`에 저장합니다

## 설치

**npm으로 설치 (권장):**

```bash
npm install -g codelingo
codelingo install
```

**수동 설치 (파일 3개 복사):**

```bash
mkdir -p ~/.claude/commands
curl -o ~/.claude/commands/explain-file.md   https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/explain-file.md
curl -o ~/.claude/commands/change-impact.md  https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/change-impact.md
curl -o ~/.claude/commands/handoff.md        https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/handoff.md
```

이것으로 끝입니다. 설치 즉시 모든 Claude Code 세션에서 커맨드를 사용할 수 있습니다.

## 사용법

```text
/explain-file src/utils/scheduler.py
/change-impact src/utils/scheduler.py "재시도 횟수 파라미터를 추가하고 싶어"
/handoff src/auth/middleware.ts
```

**설정 저장:**

처음 실행 시 언어 설정과 실력 수준을 `.codelingo/config.json`에 저장합니다. 이후 실행 시에는 해당 질문을 건너뜁니다.

실력 수준을 초기화하려면 `.codelingo/config.json`에서 `skillLevel` 필드를 삭제하세요.

## CLI 레퍼런스

```text
codelingo install      커맨드를 ~/.claude/commands/ 에 복사
codelingo uninstall    커맨드를 ~/.claude/commands/ 에서 제거
codelingo list         설치된 커맨드 목록 확인
```

## 필요 조건

- [Claude Code](https://claude.ai/code) (모든 플랜)
- Claude Code에 설정된 Anthropic API 키
- Node.js 16 이상 (npm 설치 방식만 해당)
