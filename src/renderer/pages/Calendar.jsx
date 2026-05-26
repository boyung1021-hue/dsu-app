import { useState, useEffect } from 'react'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const _td = new Date()
const todayStr = [_td.getFullYear(), String(_td.getMonth() + 1).padStart(2, '0'), String(_td.getDate()).padStart(2, '0')].join('-')

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay()
}

function fmtPreviewDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'long'
  })
}

function DetailPanel({ record, dateStr, onDateSelect, onMemoSelect }) {
  if (!record) {
    const isFuture = dateStr > todayStr
    const isToday = dateStr === todayStr
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 12, padding: 32
      }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>
          {isFuture ? '아직 기록이 없는 날이에요' : isToday ? '오늘 DSU를 아직 작성하지 않았어요' : '이 날의 기록이 없어요'}
        </div>
        <button
          onClick={() => onDateSelect(dateStr)}
          style={{
            padding: '7px 16px', background: 'var(--accent2)',
            color: 'var(--accent)', border: '1px solid rgba(127,119,221,0.25)',
            fontSize: 12, borderRadius: 'var(--radius-sm)'
          }}
        >
          {isFuture ? '이 날짜에 미리 작성하기 →' : '작성하기 →'}
        </button>
      </div>
    )
  }

  const done = record.tasks.filter(t => t.done).length
  const total = record.tasks.length

  return (
    <div style={{ padding: '24px 20px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
          {fmtPreviewDate(dateStr)}
        </div>
        <button
          onClick={() => onDateSelect(dateStr)}
          style={{
            padding: '5px 12px', background: 'var(--accent2)',
            color: 'var(--accent)', border: '1px solid rgba(127,119,221,0.25)',
            fontSize: 11, borderRadius: 'var(--radius-sm)', flexShrink: 0
          }}
        >
          편집하기 →
        </button>
      </div>

      {total > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            체크리스트
          </div>
          <div style={{
            padding: '10px 12px', background: 'var(--bg3)',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 4
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ height: 4, flex: 1, background: 'var(--bg4)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: `${total > 0 ? Math.round((done / total) * 100) : 0}%`,
                  background: done === total ? 'var(--success)' : 'var(--accent)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <span style={{ fontSize: 11, minWidth: 40, textAlign: 'right', color: done === total ? 'var(--success)' : 'var(--text2)' }}>
                {done}/{total}
              </span>
            </div>
            {record.tasks.map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                fontSize: 13, lineHeight: 1.7,
                color: t.done ? 'var(--text3)' : 'var(--text2)',
                textDecoration: t.done ? 'line-through' : 'none'
              }}>
                <span style={{ color: t.done ? 'var(--success)' : 'var(--text3)', flexShrink: 0, marginTop: 1 }}>
                  {t.done ? '✓' : '○'}
                </span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {[
        { key: 'yesterday', label: '어제 한 일' },
        { key: 'today', label: '오늘 할 일' },
        { key: 'blocker', label: '장애물' }
      ].map(({ key, label }) => record[key]?.trim() ? (
        <div key={key} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {label}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            {record[key]}
          </div>
        </div>
      ) : null)}

      {record.memos && record.memos.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            메모 {record.memos.length}개
          </div>
          {record.memos.map(m => (
            <div
              key={m.id}
              onClick={() => { onDateSelect(dateStr); if (onMemoSelect) onMemoSelect(m.id) }}
              style={{
                padding: '6px 10px', marginBottom: 4,
                background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                fontSize: 13, color: 'var(--text2)',
                cursor: 'pointer', transition: 'border-color 0.12s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {m.title || '제목 없음'}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Calendar({ selectedDate: editingDate, onDateSelect, onMemoSelect }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [records, setRecords] = useState({})
  const [selected, setSelected] = useState(editingDate || todayStr)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.dsu.list().then(list => {
      const map = {}
      list.forEach(r => { map[r.date] = r })
      setRecords(map)
      setLoading(false)
    })
  }, [])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const cells = []

  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)' }}>
      불러오는 중...
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* 달력 영역 */}
      <div style={{
        flex: '0 0 400px', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '28px 24px', overflow: 'hidden'
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 12 }}>
          <button
            onClick={prevMonth}
            style={{ background: 'var(--bg3)', color: 'var(--text2)', padding: '4px 10px', border: '1px solid var(--border)' }}
          >
            ‹
          </button>
          <span style={{ flex: 1, textAlign: 'center', fontWeight: 500, fontSize: 15 }}>
            {year}년 {month + 1}월
          </span>
          <button
            onClick={nextMonth}
            style={{ background: 'var(--bg3)', color: 'var(--text2)', padding: '4px 10px', border: '1px solid var(--border)' }}
          >
            ›
          </button>
        </div>

        {/* 요일 헤더 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
          {DAYS.map((d, i) => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 11,
              color: i === 0 ? '#e05555' : i === 6 ? 'var(--accent)' : 'var(--text3)',
              padding: '4px 0', fontWeight: 500, letterSpacing: '0.04em'
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} />

            const dateStr = toDateStr(year, month, day)
            const hasRecord = !!records[dateStr]
            const isToday = dateStr === todayStr
            const isEditing = dateStr === editingDate   // Today 탭에서 편집 중인 날짜
            const isLocalSelected = dateStr === selected // 달력 내 미리보기 선택
            const isSun = idx % 7 === 0
            const isSat = idx % 7 === 6

            // 배경: 미리보기 선택 > 오늘 > 기본
            const bg = isLocalSelected
              ? 'var(--accent2)'
              : isToday ? 'var(--accent3)'
              : 'transparent'

            // 테두리: 편집 중인 날짜는 solid accent, 오늘은 연한 accent
            const border = isEditing
              ? '2px solid var(--accent)'
              : isLocalSelected ? '1px solid rgba(127,119,221,0.35)'
              : isToday ? '1px solid rgba(127,119,221,0.3)'
              : '1px solid transparent'

            const color = isToday ? 'var(--accent)'
              : isSun ? '#e05555'
              : isSat ? 'var(--accent)'
              : 'var(--text)'

            return (
              <button
                key={dateStr}
                onClick={() => setSelected(dateStr)}
                style={{
                  position: 'relative', aspectRatio: '1',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: 8, background: bg, color,
                  border, fontWeight: isToday ? 600 : 400,
                  fontSize: 13, gap: 3, cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
              >
                {day}
                {hasRecord
                  ? <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                  : <span style={{ width: 4, height: 4 }} />
                }
              </button>
            )
          })}
        </div>

        {/* 범례 */}
        <div style={{ marginTop: 'auto', paddingTop: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text3)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            DSU 기록 있음
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text3)' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, border: '2px solid var(--accent)', display: 'inline-block' }} />
            편집 중
          </div>
        </div>
      </div>

      {/* 상세 패널 */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selected ? (
          <DetailPanel
            record={records[selected] || null}
            dateStr={selected}
            onDateSelect={onDateSelect}
            onMemoSelect={onMemoSelect}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontSize: 13 }}>
            날짜를 선택하면 DSU 내용을 확인할 수 있어요
          </div>
        )}
      </div>
    </div>
  )
}