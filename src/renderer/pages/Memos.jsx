import { useState, useEffect } from 'react'

const fmtDate = (s) => new Date(s).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
const fmtTime = (s) => new Date(s).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

export default function Memos({ onMemoOpen }) {
  const [allMemos, setAllMemos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.dsu.list().then(records => {
      const flat = []
      for (const record of records) {
        for (const memo of (record.memos || [])) {
          flat.push({ ...memo, date: record.date })
        }
      }
      flat.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setAllMemos(flat)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontSize: 13 }}>
        불러오는 중...
      </div>
    )
  }

  if (allMemos.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontSize: 13 }}>
        저장된 메모가 없습니다.
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 0' }}>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
          전체 메모 · {allMemos.length}개
        </div>
        {allMemos.map(memo => (
          <div
            key={`${memo.date}-${memo.id}`}
            onClick={() => onMemoOpen(memo.date, memo.id)}
            style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '14px 16px',
              cursor: 'pointer', transition: 'border-color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: memo.content ? 6 : 0 }}>
              <span style={{ fontWeight: 500, fontSize: 13, flex: 1 }}>
                {memo.title || '(제목 없음)'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>
                {fmtDate(memo.date)} · {fmtTime(memo.createdAt)}
              </span>
            </div>
            {memo.content && (
              <div style={{
                fontSize: 12, color: 'var(--text3)', lineHeight: 1.5,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
              }}>
                {memo.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
