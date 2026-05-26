import { useState, useEffect } from 'react'

const fmtDate = (s) => new Date(s).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

function DsuCard({ record }) {
  const [open, setOpen] = useState(false)
  const done = record.tasks.filter(t => t.done).length
  const total = record.tasks.length

  return (
    <div onClick={() => setOpen(o => !o)} style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '14px 16px', cursor: 'pointer',
      transition: 'border-color 0.15s'
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 500, flex: 1 }}>{fmtDate(record.date)}</span>
        {total > 0 && (
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 99,
            background: done === total ? 'var(--success2)' : 'var(--bg4)',
            color: done === total ? 'var(--success)' : 'var(--text2)'
          }}>
            {done}/{total} 완료
          </span>
        )}
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>

      {!open && record.today && (
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 5,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {record.today.split('\n')[0]}
        </div>
      )}

      {open && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12,
          display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'yesterday', label: '어제 한 일' },
            { key: 'today', label: '오늘 할 일' },
            { key: 'blocker', label: '장애물' }
          ].map(({ key, label }) => record[key]?.trim() ? (
            <div key={key}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{record[key]}</div>
            </div>
          ) : null)}

          {record.memos && record.memos.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>메모</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                {record.memos.map(m => m.title || '제목 없음').join(' · ')}
              </div>
            </div>
          )}

          {record.tasks.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>체크리스트</div>
              {record.tasks.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0',
                  fontSize: 13, color: t.done ? 'var(--text3)' : 'var(--text2)',
                  textDecoration: t.done ? 'line-through' : 'none' }}>
                  <span>{t.done ? '✓' : '○'}</span>
                  <span>{t.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function History() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.dsu.list().then(list => { setRecords(list); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)' }}>
      불러오는 중...
    </div>
  )

  if (records.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
      <div style={{ fontSize: 28, marginBottom: 4 }}>📋</div>
      <div style={{ color: 'var(--text2)' }}>아직 기록이 없어요</div>
      <div style={{ fontSize: 12, color: 'var(--text3)' }}>오늘 탭에서 첫 DSU를 작성해보세요</div>
    </div>
  )

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '28px 32px' }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
          기록 {records.length}개
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {records.map(r => <DsuCard key={r.date} record={r} />)}
        </div>
      </div>
    </div>
  )
}
