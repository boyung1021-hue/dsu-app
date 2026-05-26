// 로컬 LLM 유틸리티

export async function llmChat(messages) {
  return window.api.llm.chat(messages)
}

// 자유 입력 → 체크리스트 파싱
export async function parseTasks(rawInput) {
  const reply = await llmChat([
    {
      role: 'system',
      content: `당신은 할 일 정리 도우미입니다.
사용자가 오늘 할 일을 자유롭게 말하면, 각 항목을 명확한 액션 아이템으로 정리해주세요.
반드시 아래 형식으로만 응답하세요. 다른 설명은 절대 쓰지 마세요:

- 할 일 1
- 할 일 2
- 할 일 3`
    },
    { role: 'user', content: rawInput }
  ])

  return reply
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('- '))
    .map(l => ({ text: l.slice(2).trim(), done: false }))
}

// DSU 필드 다듬기
export async function polishField(text, field) {
  const instructions = {
    yesterday: '어제 한 일을 bullet point(• 시작)로 간결하게 정리해주세요.',
    today: '오늘 할 일을 bullet point(• 시작)로 간결하게 정리해주세요.',
    blocker: '장애물을 한두 문장으로 명확하게 정리해주세요. 없으면 "없음"으로만 작성하세요.'
  }

  return llmChat([
    { role: 'system', content: `당신은 DSU 정리 도우미입니다. ${instructions[field] || ''} 원본 내용을 유지하면서 자연스럽게 다듬어주세요. 다른 설명 없이 정리된 텍스트만 응답하세요.` },
    { role: 'user', content: text }
  ])
}

// 챗봇 시스템 프롬프트
export const CHAT_SYSTEM = (dsuData) => {
  const base = `당신은 개인 DSU(Daily Stand-Up) 도우미 봇입니다.
사용자의 하루 업무 기록을 도와주며, 친근하고 간결하게 대화합니다.
DSU와 관련된 질문(어제 한 일, 오늘 할 일, 장애물)을 도와주고, 필요시 업무 조언도 드립니다.
한국어로 대화합니다.`

  if (!dsuData) return base

  const done = dsuData.tasks.filter(t => t.done).length
  const total = dsuData.tasks.length
  const taskLines = dsuData.tasks.length > 0
    ? dsuData.tasks.map(t => `  - [${t.done ? '완료' : '미완료'}] ${t.text}`).join('\n')
    : '  (없음)'

  return `${base}

---
[오늘의 DSU 현황]
- 오늘 할 일: ${dsuData.today || '(미작성)'}
- 어제 한 일: ${dsuData.yesterday || '(미작성)'}
- 장애물: ${dsuData.blocker || '(없음)'}
- 체크리스트: 전체 ${total}개 중 ${done}개 완료
${taskLines}
- 메모: ${(dsuData.memos || []).length > 0 ? dsuData.memos.map(m => m.title || '제목 없음').join(', ') : '(없음)'}
---
위 DSU 정보를 바탕으로 사용자 질문에 답변하세요.`
}

// 쿼리 의도 분류: RECENT | ALL
export async function classifyQuery(query) {
  try {
    const result = await Promise.race([
      llmChat([
        {
          role: 'system',
          content: `사용자 질문이 아래 중 어느 유형인지 판단해서 딱 한 단어만 답해줘.
RECENT: 특정 내용, 최근 기록, 오늘/어제/며칠 전 관련 질문
ALL: 전체 통계, 패턴 분석, 요약, 추이, 얼마나 자주 등 전체 기간 분석 필요
답변은 RECENT 또는 ALL 중 하나만.`
        },
        { role: 'user', content: query }
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ])
    return result.toUpperCase().includes('ALL') ? 'ALL' : 'RECENT'
  } catch {
    return 'RECENT'
  }
}

// 키워드 기반 관련 기록 상위 N개 추출
export function findRelevantRecords(query, records, limit = 5) {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1)
  const scored = records.map(r => {
    const text = [r.today, r.yesterday, r.blocker, r.memo,
      ...(r.tasks || []).map(t => t.text)].filter(Boolean).join(' ').toLowerCase()
    const score = words.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0)
    return { r, score }
  })
  scored.sort((a, b) => b.score - a.score || b.r.date.localeCompare(a.r.date))
  return scored.slice(0, limit).map(s => s.r)
}

// 기록 배열 → LLM 컨텍스트 문자열
export function formatRecordsContext(records) {
  if (!records || records.length === 0) return ''
  return records.map(r => {
    const done = (r.tasks || []).filter(t => t.done).length
    const total = (r.tasks || []).length
    const parts = [`### ${r.date}`]
    if (r.today) parts.push(`오늘 할 일: ${r.today}`)
    if (r.yesterday) parts.push(`어제 한 일: ${r.yesterday}`)
    if (r.blocker) parts.push(`장애물: ${r.blocker}`)
    if (total > 0) parts.push(`체크리스트(${done}/${total}): ${r.tasks.map(t => `[${t.done ? '✓' : '○'}] ${t.text}`).join(', ')}`)
    if (r.memos && r.memos.length > 0) parts.push(`메모: ${r.memos.map(m => m.title || '제목 없음').join(', ')}`)
    return parts.join('\n')
  }).join('\n\n')
}

// DSU 미작성 시 봇이 먼저 말 걸기 메시지
export const GREETING_MSG = (date) =>
  `안녕하세요! 오늘(${date}) DSU가 아직 작성되지 않았네요 📋\n\n오늘 어떤 일들을 할 예정인가요? 자유롭게 말씀해주시면 제가 체크리스트로 정리해드릴게요!`
