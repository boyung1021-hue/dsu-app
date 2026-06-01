import { useState, useEffect, useRef, useCallback } from 'react'
import MarkdownRenderer from '../utils/markdown.jsx'

const getTodayStr = () => {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

const fmtDate = (s) =>
  new Date(s + 'T00:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

const extractTags = (content = '') => [...new Set((content.match(/#[\w가-힣]+/g) || []))]

export default function Memos() {
  const [allData, setAllData] = useState([])
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('edit')
  const [activeTag, setActiveTag] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState(null)
  const saveTimerRef = useRef(null)
  const textareaRef = useRef(null)
  const selectedRef = useRef(null)

  useEffect(() => { selectedRef.current = selected }, [selected])

  const loadAll = useCallback(async () => {
    const records = await window.api.dsu.list()
    const data = records
      .map(r => ({ date: r.date, memos: r.memos || [] }))
      .filter(r => r.memos.length > 0)
    setAllData(data)
    setLoading(false)
    // Auto-expand most recent date
    if (data.length > 0) {
      setExpanded(prev => Object.keys(prev).length === 0 ? { [data[0].date]: true } : prev)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Auto-resize textarea
  useEffect(() => {
    if (mode !== 'edit' || !textareaRef.current) return
    const el = textareaRef.current
    el.style.height = 'auto'
    el.style.height = Math.max(el.scrollHeight, 200) + 'px'
  }, [selected?.content, mode])

  const allMemos = allData.flatMap(d => d.memos.map(m => ({ ...m, date: d.date })))
  const allTags = [...new Set(allMemos.flatMap(m => extractTags(m.content)))]

  // Filter by active tag, then group by date
  const byDate = (() => {
    const filtered = activeTag
      ? allData.map(d => ({ ...d, memos: d.memos.filter(m => extractTags(m.content).includes(activeTag)) })).filter(d => d.memos.length > 0)
      : allData
    return filtered
  })()

  const handleSelect = (date, id) => {
    const d = allData.find(r => r.date === date)
    const memo = d?.memos.find(m => m.id === id)
    if (memo) {
      if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null }
      setSelected({ ...memo, date })
      setMode('edit')
    }
  }

  const handleAdd = async () => {
    const today = getTodayStr()
    const newMemo = await window.api.memo.add(today, { title: '', content: '' })
    await loadAll()
    setSelected({ ...newMemo, date: today })
    setExpanded(prev => ({ ...prev, [today]: true }))
    setMode('edit')
    setTimeout(() => {
      const el = document.querySelector('input[data-memo-title]')
      if (el) el.focus()
    }, 50)
  }

  const handleDelete = async (date, id) => {
    await window.api.memo.delete(date, id)
    if (selectedRef.current?.id === id) setSelected(null)
    await loadAll()
  }

  const autoSave = useCallback((memo) => {
    if (!memo) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaving(true)
    saveTimerRef.current = setTimeout(async () => {
      await window.api.memo.update(memo.date, memo.id, { title: memo.title, content: memo.content })
      setAllData(prev => prev.map(d =>
        d.date !== memo.date ? d : { ...d, memos: d.memos.map(m => m.id === memo.id ? { ...m, title: memo.title, content: memo.content } : m) }
      ))
      setSaving(false)
    }, 800)
  }, [])

  const handleTitleChange = (val) => {
    const next = { ...selected, title: val }
    setSelected(next)
    autoSave(next)
  }

  const handleContentChange = (val) => {
    const next = { ...selected, content: val }
    setSelected(next)
    autoSave(next)
  }

  const toggleDate = (date) => setExpanded(prev => ({ ...prev, [date]: !prev[date] }))

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontSize: 13 }}>불러오는 중...</div>
  }

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>

      {/* ── 좌측 사이드바 ── */}
      <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg2)' }}>

        <button
          onClick={handleAdd}
          style={{ padding: '11px 14px', background: 'transparent', color: 'var(--accent)', border: 'none', borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: 13, fontWeight: 500, borderRadius: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent3)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          + 새 메모
        </button>

        {/* 메모 트리 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {byDate.length === 0 ? (
            <div style={{ padding: '20px 14px', fontSize: 12, color: 'var(--text3)' }}>
              {activeTag ? `${activeTag} 태그의 메모가 없어요` : '메모가 없어요'}
            </div>
          ) : byDate.map(({ date, memos }) => (
            <div key={date}>
              {/* 날짜 헤더 */}
              <div
                onClick={() => toggleDate(date)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', cursor: 'pointer', userSelect: 'none', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 9, color: 'var(--text3)', width: 8 }}>{expanded[date] ? '▾' : '▸'}</span>
                <span style={{ flex: 1, fontSize: 11, color: 'var(--text2)', fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{fmtDate(date)}</span>
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>{memos.length}</span>
              </div>

              {/* 메모 목록 */}
              {expanded[date] && memos.map(m => {
                const isSel = selected?.id === m.id
                const isHov = hoveredId === m.id
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelect(date, m.id)}
                    onMouseEnter={() => setHoveredId(m.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px 7px 26px', cursor: 'pointer', background: isSel ? 'var(--accent2)' : isHov ? 'var(--bg3)' : 'transparent', borderLeft: isSel ? '2px solid var(--accent)' : '2px solid transparent' }}
                  >
                    <span style={{ flex: 1, fontSize: 12, color: isSel ? 'var(--accent)' : 'var(--text)', fontWeight: isSel ? 500 : 400, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {m.title || '제목 없음'}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(date, m.id) }}
                      style={{ width: 16, height: 16, padding: 0, background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: 3, opacity: isHov || isSel ? 1 : 0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.background = 'var(--bg4)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
                    >×</button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* 태그 목록 */}
        {allTags.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '10px 12px', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>태그</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {allTags.map(tag => (
                <span
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  style={{
                    fontSize: 11, padding: '2px 7px', borderRadius: 99, cursor: 'pointer',
                    background: activeTag === tag ? 'var(--accent2)' : 'var(--bg3)',
                    color: activeTag === tag ? 'var(--accent)' : 'var(--text3)',
                    border: `1px solid ${activeTag === tag ? 'rgba(127,119,221,0.3)' : 'transparent'}`,
                    transition: 'all 0.12s'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 우측 에디터 영역 ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>
            ← 메모를 선택하거나 새로 만들어보세요
          </div>
        ) : (
          <>
            {/* 제목 + 모드 토글 */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingRight: 12, flexShrink: 0 }}>
              <input
                data-memo-title
                value={selected.title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="제목"
                style={{ flex: 1, padding: '14px 20px', background: 'transparent', border: 'none', borderRadius: 0, fontSize: 18, fontWeight: 600, color: 'var(--text)' }}
              />
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                {['edit', 'preview'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{ padding: '4px 10px', fontSize: 12, background: mode === m ? 'var(--accent2)' : 'transparent', color: mode === m ? 'var(--accent)' : 'var(--text3)', border: 'none', borderRadius: 'var(--radius-sm)' }}
                  >
                    {m === 'edit' ? '편집' : '미리보기'}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 11, color: saving ? 'var(--text3)' : 'var(--success)', marginLeft: 10, transition: 'color 0.3s', minWidth: 48 }}>
                {saving ? '저장 중...' : '자동 저장'}
              </span>
            </div>

            {/* 내용 영역 */}
            {mode === 'edit' ? (
              <div style={{ flex: 1, overflow: 'auto' }}>
                <textarea
                  ref={textareaRef}
                  value={selected.content}
                  onChange={e => handleContentChange(e.target.value)}
                  placeholder={'마크다운으로 내용을 입력하세요...\n\n# 제목\n**굵게**, *기울임*, `코드`\n- [ ] 체크박스\n#태그 지원'}
                  style={{ width: '100%', minHeight: '100%', padding: '20px 24px', background: 'transparent', border: 'none', borderRadius: 0, fontSize: 13, color: 'var(--text2)', resize: 'none', lineHeight: 1.9, height: 'auto', overflow: 'hidden', boxSizing: 'border-box' }}
                />
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
                {selected.content
                  ? <MarkdownRenderer content={selected.content} />
                  : <span style={{ color: 'var(--text3)', fontSize: 13 }}>내용 없음</span>
                }
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}