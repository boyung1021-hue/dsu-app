import { useState, useEffect, useRef } from 'react'
import { llmChat, parseTasks, CHAT_SYSTEM, GREETING_MSG, classifyQuery, findRelevantRecords, formatRecordsContext } from '../llm.js'

const toDateStr = () => new Date().toISOString().split('T')[0]

// DSU 미작성 여부에 따라 초기 모드 결정
// mode: 'onboarding' | 'chat'
export default function ChatBot({ todayData, onClose, onRefresh }) {
  const today = toDateStr()
  const isNew = !todayData

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState(isNew ? 'onboarding' : 'chat')
  const bottomRef = useRef(null)

  // 초기 인사
  useEffect(() => {
    if (isNew) {
      setMessages([{
        role: 'assistant',
        content: GREETING_MSG(today),
        type: 'greeting'
      }])
    } else {
      setMessages([{
        role: 'assistant',
        content: '안녕하세요! 무엇이든 물어보세요 😊\nDSU 내용 수정, 메모 추가, 업무 조언 등 도와드릴게요.',
        type: 'greeting'
      }])
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const addMsg = (role, content, extra = {}) => {
    setMessages(m => [...m, { role, content, ...extra }])
  }

  const updateLoadingMsg = (content) => {
    setMessages(m => m.map(msg => msg.type === 'loading' ? { ...msg, content } : msg))
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    addMsg('user', text)
    setLoading(true)

    try {
      // 온보딩 모드: 첫 응답을 체크리스트로 변환
      if (mode === 'onboarding') {
        addMsg('assistant', '잠깐만요, 할 일 목록을 정리할게요...', { type: 'loading' })

        const tasks = await parseTasks(text)

        // 로딩 메시지 제거 후 결과 표시
        setMessages(m => m.filter(msg => msg.type !== 'loading'))

        if (tasks.length > 0) {
          // 오늘 DSU에 체크리스트 저장
          const existing = await window.api.dsu.load(today) || {}
          const newData = { ...existing, today: text, tasks }
          await window.api.dsu.save(today, newData)
          onRefresh()

          addMsg('assistant',
            `✅ ${tasks.length}개 항목으로 정리했어요!\n\n` +
            tasks.map(t => `• ${t.text}`).join('\n') +
            '\n\n왼쪽 화면에서 체크리스트를 확인하고, 완료한 항목을 체크해주세요. 미완료 항목은 내일 자동으로 이월돼요.',
            { type: 'result', tasks }
          )
          setMode('chat')
        } else {
          addMsg('assistant', '할 일 항목을 추출하지 못했어요. 조금 더 구체적으로 말씀해주시겠어요?')
        }
      } else {
        // 일반 챗 모드 — 3단계 파이프라인
        addMsg('assistant', '🤔 질문 분석 중...', { type: 'loading' })

        const queryType = await classifyQuery(text)

        updateLoadingMsg(queryType === 'ALL' ? '📂 전체 기록 분석 중...' : '🔍 관련 기록 검색 중...')

        const allRecords = await window.api.dsu.list()
        const contextRecords = queryType === 'ALL'
          ? allRecords.slice(0, 60)
          : findRelevantRecords(text, allRecords, 5)

        updateLoadingMsg('💬 답변 생성 중...')

        const contextStr = formatRecordsContext(contextRecords)
        const systemContent = CHAT_SYSTEM(todayData) +
          (contextStr ? `\n\n---\n[참고 기록]\n${contextStr}\n---` : '')

        const history = messages
          .filter(m => m.role !== 'system' && m.type !== 'loading')
          .map(m => ({ role: m.role, content: m.content }))

        const reply = await llmChat([
          { role: 'system', content: systemContent },
          ...history,
          { role: 'user', content: text }
        ])

        setMessages(m => m.filter(msg => msg.type !== 'loading'))
        addMsg('assistant', reply)
      }
    } catch (e) {
      setMessages(m => m.filter(msg => msg.type !== 'loading'))
      addMsg('assistant', `⚠️ LLM 연결 오류: ${e.message}\n\nLM Studio가 실행 중이고 http://127.0.0.1:1234 에서 서빙 중인지 확인해주세요.`, { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 헤더 */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--accent2)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13
          }}>✦</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>DSU 봇</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>127.0.0.1:1234</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          width: 24, height: 24, background: 'transparent',
          color: 'var(--text3)', fontSize: 16, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>×</button>
      </div>

      {/* 메시지 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} className="fade-in" style={{
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '88%',
              padding: '9px 12px',
              borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
              background: m.role === 'user' ? 'var(--accent)' : 'var(--bg3)',
              color: m.role === 'user' ? '#fff' : (m.type === 'error' ? '#ef9f7b' : 'var(--text)'),
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              border: m.role === 'user' ? 'none' : '1px solid var(--border)'
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '9px 14px', borderRadius: '12px 12px 12px 3px',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              fontSize: 13, color: 'var(--text3)'
            }}>
              <span style={{ animation: 'pulse 1s infinite' }}>생각 중...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: 8, flexShrink: 0
      }}>
        <textarea
          rows={2}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
          }}
          placeholder={mode === 'onboarding' ? '오늘 할 일을 자유롭게...' : '메시지 입력 (Enter 전송)'}
          style={{ fontSize: 13, padding: '8px 10px', flex: 1 }}
          disabled={loading}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          padding: '0 14px',
          background: 'var(--accent)', color: '#fff',
          fontWeight: 500, fontSize: 13, alignSelf: 'stretch'
        }}>
          전송
        </button>
      </div>
    </div>
  )
}
