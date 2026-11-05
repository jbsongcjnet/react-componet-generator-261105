---
name: create-pr
description: 현재 브랜치의 변경사항을 분석해 템플릿에 맞는 GitHub Pull Request를 생성한다. 이 프로젝트(react-component-generator)는 한국어 템플릿, 그 외 프로젝트는 영어 템플릿을 쓴다. "PR 만들어줘", "PR 생성", "풀리퀘스트 올려줘", "create a PR", "open a pull request" 같은 요청에 활성화한다.
context: fork
agent: general-purpose
allowed-tools: Bash(git *), Bash(gh *), Read, Grep, Glob
---

# create-pr

현재 브랜치의 커밋·diff를 분석해 PR을 생성한다. `context: fork`로 서브 에이전트에서 실행되므로, 메인 대화의 맥락 없이 아래 절차만으로 완결되어야 한다. 마지막에 PR URL만 간결히 보고한다.

## 언어 규칙
| 대상 프로젝트 | 템플릿 | PR 제목·본문 언어 |
|---|---|---|
| 이 프로젝트 (`package.json`의 `name`이 `react-component-generator`이거나 `origin`이 `react-componet-generator-261105`) | `references/pr-template.ko.md` | 한국어 |
| 그 외 모든 프로젝트 | `references/pr-template.en.md` | 영어 |

- 판별은 `package.json`의 `name`과 `git remote get-url origin`으로 한다. 하나라도 일치하면 이 프로젝트다.
- 템플릿 섹션 구조는 그대로 유지하고, 내용만 채운다. 해당 없는 섹션은 `N/A`로 둔다.

## 절차

### 1. 사전 확인
- `git branch --show-current`로 현재 브랜치를 확인한다. 기본 브랜치(`main`/`master`)에 있으면 PR을 만들 수 없으니 중단하고 알린다.
- 기본 브랜치는 `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`으로 얻는다.
- `git status --short`에 커밋되지 않은 변경이 있으면 알리고 중단한다. (커밋은 `commit` 스킬의 몫이며 임의로 커밋하지 않는다.)
- 이미 열린 PR이 있는지 `gh pr view --json url 2>/dev/null`로 확인한다. 있으면 그 URL을 알리고 중단한다.

### 2. 변경 분석
- `git log <base>..HEAD --oneline`과 `git diff <base>...HEAD`를 읽는다. 마지막 커밋만이 아니라 브랜치 전체 커밋을 기준으로 한다.
- 변경 목적(feat/fix/refactor/chore 등)과 영향 범위를 파악한다.
- 테스트 파일 변경 여부와, 가능하면 프로젝트의 테스트 명령 결과를 확인해 "테스트" 섹션에 사실만 적는다. 실행하지 않은 것을 통과했다고 쓰지 않는다.

### 3. PR 작성
- 언어 규칙에 따라 템플릿을 `Read`한다.
- 제목은 70자 이내, `type: 요약` 형태(커밋 컨벤션과 동일)로 쓴다.
- 본문은 템플릿을 채워 작성한다. 변경 파일 나열이 아니라 **왜/무엇이 바뀌었는지**를 쓴다.
- 비밀 값(.env, 토큰 등)이 diff에 있으면 PR을 만들지 말고 경고한다.

### 4. 푸시 및 생성
- 원격에 브랜치가 없거나 뒤처져 있으면 `git push -u origin <branch>`로 푸시한다. force push는 하지 않는다.
- `gh pr create --base <base> --title "<제목>" --body-file <임시 파일>`로 생성한다. 본문은 heredoc/임시 파일로 넘겨 줄바꿈이 깨지지 않게 한다.
- 기본은 일반 PR이다. 사용자가 "draft"를 요청했을 때만 `--draft`를 붙인다.
- PR 본문 끝에는 시스템이 지정한 attribution 줄이 있으면 그대로 덧붙인다.

### 5. 보고
- 생성된 PR URL, 제목, 사용한 템플릿 언어를 한두 줄로 보고한다.

## 금지
- 기본 브랜치로 직접 푸시, force push, 기존 PR 덮어쓰기 금지.
- 사용자 요청 없이 리뷰어·라벨·머지 설정 금지.
