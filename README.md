# DSU App

개인용 Daily Stand-Up 데스크탑 앱 — Electron + React + 로컬 LLM

## 기능

- **AI 봇 자동 인사** — 오늘 DSU가 없으면 앱 실행 시 챗봇이 먼저 말을 걸어 할 일을 물어봄
- **체크리스트 자동 생성** — 자유롭게 입력하면 로컬 LLM이 할 일 목록으로 정리
- **미완료 자동 이월** — 전날 체크 안 된 항목은 다음날 자동으로 넘어옴
- **AI 챗봇 버튼** — 우상단 ✦ 버튼으로 언제든 챗봇 열기/닫기
- **AI 다듬기** — 각 DSU 필드에서 로컬 LLM으로 내용 정리
- **마크다운 저장** — `data/YYYY-MM-DD.md` 형태로 프로젝트 내 저장
- **자동 저장** — 1.5초 디바운스로 입력 중 자동 저장

## 시작하기

### 1. LM Studio 실행
- [LM Studio](https://lmstudio.ai/) 에서 모델 로드
- Local Server 탭 → Start Server (기본 포트 1234)

### 2. 패키지 설치 및 실행
```bash
npm install
npm run dev
```

### 3. 빌드
```bash
npm run build
```

## 데이터 저장 구조

```
data/
├── 2026-05-26.md
├── 2026-05-27.md
└── ...
```

### 마크다운 포맷 예시
```markdown
# DSU — 2026-05-26

## 어제 한 일
• API 연동 완료
• 버그 수정 3건

## 오늘 할 일
코드 리뷰하고 테스트 작성하기

## 블로커
없음

## 체크리스트
- [x] 코드 리뷰
- [ ] 테스트 작성
- [ ] PR 올리기

## 메모
내일 배포 예정
```

## 구조

```
src/
├── main.js              ← Electron (파일 I/O, LLM 프록시)
├── preload.js           ← IPC 브릿지
└── renderer/
    ├── App.jsx          ← 레이아웃, 탭, 챗봇 버튼
    ├── llm.js           ← LLM 유틸 & 프롬프트
    ├── pages/
    │   ├── Today.jsx    ← DSU 작성 + 체크리스트
    │   └── History.jsx  ← 기록 조회
    └── components/
        ├── DsuField.jsx    ← 입력 필드 + AI 다듬기
        ├── Checklist.jsx   ← 체크리스트 UI
        └── ChatBot.jsx     ← AI 챗봇 패널
```
