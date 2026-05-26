import { useState } from 'react'

export default function Checklist({ tasks, onChange }) {
  const [newText, setNewText] = useState('')

  const toggle = (i) => {
    const next = tasks.map((t, idx) => idx === i ? { ...t, done: !t.done } : t)
    onChange(next)
  }

  const remove = (i) => onChange(tasks.filter((_, idx) => idx !== i))

  const add = () => {
    const text = newText.trim()
    if (!text) return
    onChange([...tasks, { text, done: false }])
    setNewText('')
  }

  const done = tasks.filter(t => t.done).length

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '14px 16px'
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          체크리스트
        </span>
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 99,
          background: done === tasks.length && tasks.length > 0 ? 'var(--success2)' : 'var(--bg4)',
          color: done === tasks.length && tasks.length > 0 ? 'var(--success)' : 'var(--text3)'
        }}>
          {done} / {tasks.length}
        </span>
      </div>

      {/* 태스크 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
        {tasks.map((t, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 8px', borderRadius: 'var(--radius-sm)',
            background: t.done ? 'transparent' : 'var(--bg3)',
            border: '1px solid', borderColor: t.done ? 'transparent' : 'var(--border)',
            cursor: 'pointer', transition: 'all 0.15s',
            group: true
          }}
          onClick={() => toggle(i)}
          onMouseEnter={e => { if (!t.done) e.currentTarget.style.borderColor = 'var(--border2)' }}
          onMouseLeave={e => { if (!t.done) e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            {/* 체크박스 */}
            <div style={{
              width: 18, height: 18, borderRadius: 5, flexShrink: 0,
              border: `1.5px solid ${t.done ? 'var(--success)' : 'var(--border2)'}`,
              background: t.done ? 'var(--success)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: '#fff', transition: 'all 0.15s'
            }}>
              {t.done ? '✓' : ''}
            </div>

            <span style={{
              flex: 1, fontSize: 13, lineHeight: 1.5,
              color: t.done ? 'var(--text3)' : 'var(--text)',
              textDecoration: t.done ? 'line-through' : 'none',
              transition: 'all 0.15s'
            }}>
              {t.text}
            </span>

            <button
              onClick={e => { e.stopPropagation(); remove(i) }}
              style={{
                width: 20, height: 20, flexShrink: 0,
                background: 'transparent', border: 'none', padding: 0,
                borderRadius: 4,
                color: 'var(--text3)', fontSize: 14,
                opacity: t.done ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'color 0.15s, background 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.background = 'var(--bg4)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
            >×</button>
          </div>
        ))}
      </div>

      {/* 추가 입력 */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="항목 추가..."
          style={{ fontSize: 13, padding: '6px 10px' }}
        />
        <button onClick={add} style={{
          padding: '6px 12px', background: 'var(--accent2)',
          color: 'var(--accent)', border: '1px solid rgba(127,119,221,0.25)',
          fontSize: 13, flexShrink: 0
        }}>+</button>
      </div>
    </div>
  )
}
