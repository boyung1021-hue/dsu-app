# DSU App

개인용 Daily Stand-Up 데스크탑 앱 — Electron + React + 로컬 LLM

매일 아침 스탠드업 기록을 빠르게 작성하고, 로컬 AI가 내용을 정리해주며, 마크다운 파일로 그대로 저장됩니다. 외부 서버 없이 완전히 로컬에서 동작합니다.

## 주요 기능

### AI 어시스턴트
- **챗봇 자동 인사** — 오늘 DSU가 없으면 앱 실행 시 챗봇이 먼저 말을 걸어 할 일을 물어봄
- **자연어 → 체크리스트** — 자유롭게 입력하면 로컬 LLM이 할 일 목록으로 파싱
- **AI 다듬기** — 각 DSU 필드에서 로컬 LLM으로 내용 자동 정리
- **챗봇 액션** — 대화로 체크리스트 추가/완료, DSU 필드 수정, 메모 추가/수정 가능

### 업무 기록
- **오늘 탭** — 어제 한 일 · 오늘 할 일 · 장애물 · 체크리스트 작성
- **미완료 자동 이월** — 전날 체크 안 된 항목은 다음날 자동으로 넘어옴
- **자동 저장** — 1.5초 디바운스로 입력 중 자동 저장

### 메모 & 기록
- **메모 탭** — 마크다운 에디터로 자유롭게 메모 작성 및 관리
- **Daily Stand-up 메모 자동 동기화** — DSU 작성 내용이 메모로 자동 저장
- **기록 탭** — 날짜별 과거 DSU 기록 조회
- **달력 탭** — 달력 뷰로 날짜별 기록 탐색

### 설정
- **LLM 서버 URL 변경** — 우상단 ⚙ 버튼으로 언제든 로컬 LLM 주소 변경 가능
- **마크다운 저장** — `data/YYYY-MM-DD.md` 형태로 로컬 저장

## 시작하기

### 1. 로컬 LLM 서버 실행

[LM Studio](https://lmstudio.ai/)를 사용하는 경우:
1. 모델 다운로드 및 로드
2. Local Server 탭 → Start Server (기본 포트: `1234`)

다른 OpenAI 호환 서버(Ollama 등)도 사용 가능합니다. 앱 설치 후 ⚙ 설정에서 URL을 변경하세요.

### 2. 패키지 설치 및 실행

```bash
npm install
npm run dev
```

### 3. 빌드

```bash
npm run build
```

빌드 결과물은 `dist-electron/` 에 생성됩니다.

## 데이터 저장 구조

```
data/
├── settings.json        ← 앱 설정 (LLM URL 등)
├── 2026-05-26.md
├── 2026-05-27.md
└── ...
```

각 날짜 파일은 표준 마크다운 형식으로 저장되어 외부 편집기에서도 그대로 읽을 수 있습니다.

```markdown
# DSU — 2026-05-26

## 어제 한 일
• API 연동 완료
• 버그 수정 3건

## 오늘 할 일
코드 리뷰하고 테스트 작성하기

## 장애물
없음

## 체크리스트
- [x] 코드 리뷰
- [ ] 테스트 작성
- [ ] PR 올리기

## 메모
### Daily Stand-up <!-- id:... createdAt:... -->
...
```

## 프로젝트 구조

```
src/
├── main.js              ← Electron 메인 (파일 I/O, LLM 프록시, 설정 관리)
├── preload.js           ← IPC 브릿지
└── renderer/
    ├── App.jsx          ← 레이아웃, 탭, 챗봇/설정 버튼
    ├── llm.js           ← LLM 유틸 & 프롬프트
    ├── pages/
    │   ├── Today.jsx    ← DSU 작성 + 체크리스트
    │   ├── History.jsx  ← 기록 조회
    │   ├── Calendar.jsx ← 달력 뷰
    │   └── Memos.jsx    ← 메모 목록
    └── components/
        ├── DsuField.jsx      ← 입력 필드 + AI 다듬기
        ├── Checklist.jsx     ← 체크리스트 UI
        ├── ChatBot.jsx       ← AI 챗봇 패널
        ├── MemoPanel.jsx     ← 마크다운 메모 에디터
        └── SettingsModal.jsx ← LLM URL 설정 모달
```

## 기술 스택

- **Electron** — 크로스 플랫폼 데스크탑 앱
- **React 18** — UI
- **Vite** — 번들러
- **로컬 LLM** — OpenAI 호환 API (LM Studio, Ollama 등)
