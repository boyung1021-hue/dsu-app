import { useState, useEffect, useCallback, useRef } from 'react'
import DsuField from '../components/DsuField.jsx'
import Checklist from '../components/Checklist.jsx'
import MemoPanel from '../components/MemoPanel.jsx'

const emptyForm = { yesterday: '', today: '', blocker: '', tasks: [] }

const getTodayStr = () => {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-')
}

const fmtDisplay = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short'
  })

export default function Today({ selectedDate, onDateChange, onRefresh, selectedMemoId, onMemoSelect, refreshKey = 0 }) {
  const saveTimerRef = useRef(null)
  const pendingSaveRef = useRef(null)
  const selectedDateRef = useRef(selectedDate)
  const carryoverDoneRef = useRef(false)

  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  // ref 동기화: 클로저에서 항상 최신 selectedDate 참조
  useEffect(() => { selectedDateRef.current = selectedDate }, [selectedDate])

  // selectedDate 변경 시 데이터 로드
  useEffect(() => {
    let mounted = true
    setLoading(true)
    setForm({ ...emptyForm })

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }

    if (pendingSaveRef.current) {
      const { date, form: pendingForm } = pendingSaveRef.current
      pendingSaveRef.current = null
      window.api.dsu.save(date, pendingForm)
    }

    const load = async () => {
      const TODAY = getTodayStr()
      if (selectedDate === TODAY && !carryoverDoneRef.current) {
        await window.api.dsu.carryover(addDays(TODAY, -1), TODAY)
        carryoverDoneRef.current = true
      }
      const data = await window.api.dsu.load(selectedDate)
      if (mounted) {
        setForm(data || { ...emptyForm })
        setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [selectedDate, refreshKey])

  const autoSave = useCallback((newForm) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const date = selectedDateRef.current
    pendingSaveRef.current = { date, form: newForm }
    saveTimerRef.current = setTimeout(async () => {
      pendingSaveRef.current = null
      await window.api.dsu.save(date, newForm)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
      if (date === getTodayStr()) onRefresh()
    }, 1500)
  }, [onRefresh])

  const update = (key, val) => {
    const next = { ...form, [key]: val }
    setForm(next)
    autoSave(next)
  }

  const updateTasks = (tasks) => {
    const next = { ...form, tasks }
    setForm(next)
    autoSave(next)
  }

  const TODAY = getTodayStr()
  const badge = selectedDate === TODAY
    ? { label: '오늘', color: 'var(--accent)', bg: 'var(--accent2)' }
    : selectedDate > TODAY
    ? { label: '예정', color: 'var(--warn)', bg: 'var(--warn2)' }
    : null

  const hasCarried = selectedDate === TODAY && form.tasks.length > 0 && !form.today

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)' }}>
      불러오는 중...
    </div>
  )

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '28px 32px' }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Daily Stand-Up
            </div>

            {/* 날짜 네비게이터 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => onDateChange(addDays(selectedDate, -1))}
                style={{
                  background: 'transparent', border: 'none', padding: '2px 4px',
                  fontSize: 18, color: 'var(--text3)', lineHeight: 1
                }}
              >‹</button>

              {/* 날짜 텍스트 — 클릭하면 date input 열림 */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => e.target.value && onDateChange(e.target.value)}
                  style={{
                    position: 'absolute', inset: 0,
                    opacity: 0, cursor: 'pointer', zIndex: 1,
                    width: '100%', height: '100%',
                    border: 'none', padding: 0, background: 'transparent'
                  }}
                />
                <span style={{ fontSize: 20, fontWeight: 500, cursor: 'pointer', userSelect: 'none' }}>
                  {fmtDisplay(selectedDate)}
                </span>
              </div>

              <button
                onClick={() => onDateChange(addDays(selectedDate, 1))}
                style={{
                  background: 'transparent', border: 'none', padding: '2px 4px',
                  fontSize: 18, color: 'var(--text3)', lineHeight: 1
                }}
              >›</button>

              {badge && (
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 99,
                  background: badge.bg, color: badge.color, fontWeight: 500
                }}>
                  {badge.label}
                </span>
              )}

              {selectedDate !== TODAY && (
                <button
                  onClick={() => onDateChange(TODAY)}
                  style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 99,
                    background: 'var(--bg3)', color: 'var(--text2)',
                    border: '1px solid var(--border)'
                  }}
                >
                  오늘로
                </button>
              )}
            </div>
          </div>

          <div style={{ fontSize: 12, color: saved ? 'var(--success)' : 'var(--text3)', transition: 'color 0.3s' }}>
            {saved ? '✓ 저장됨' : '자동 저장'}
          </div>
        </div>

        {/* 이월 배너 */}
        {hasCarried && (
          <div className="fade-in" style={{
            background: 'var(--warn2)', border: '1px solid rgba(186,117,23,0.25)',
            borderRadius: 'var(--radius-sm)', padding: '9px 14px',
            fontSize: 12, color: 'var(--warn)', marginBottom: 20
          }}>
            ↩ 어제 미완료 항목 {form.tasks.length}개가 이월되었어요
          </div>
        )}

        {/* DSU 필드들 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <DsuField label="오늘 할 일" field="today"
            value={form.today} onChange={v => update('today', v)}
            placeholder="오늘 진행할 작업들..." rows={4} />

          <DsuField label="장애물" field="blocker"
            value={form.blocker} onChange={v => update('blocker', v)}
            placeholder="막히는 부분이나 도움이 필요한 것..." rows={2} />

          {form.tasks.length > 0 && (
            <div className="fade-in">
              <Checklist tasks={form.tasks} onChange={updateTasks} />
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              메모
            </div>
            <MemoPanel
              date={selectedDate}
              selectedMemoId={selectedMemoId}
              onMemoSelect={onMemoSelect}
            />
          </div>

          <DsuField label="어제 한 일" field="yesterday"
            value={form.yesterday} onChange={v => update('yesterday', v)}
            placeholder="어제 완료한 작업들..." rows={4} />
        </div>
      </div>
    </div>
  )
}