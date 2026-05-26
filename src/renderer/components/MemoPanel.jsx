import { useState, useEffect, useRef, useCallback } from 'react'

const fmtTime = (isoStr) => {
  try {
    return new Date(isoStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function MemoItem({ memo, selected, onSelect, onDelete }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '9px 12px',
        cursor: 'pointer',
        background: selected ? 'var(--accent2)' : hovered ? 'var(--bg3)' : 'transparent',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-start', gap: 6,
        transition: 'background 0.12s'
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          color: selected ? 'var(--accent)' : 'var(--text)',
          fontWeight: selected ? 500 : 400,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
        }}>
          {memo.title || '제목 없음'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
          {fmtTime(memo.createdAt)}
        </div>
      </div>
      {(hovered || selected) && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          style={{
            width: 18, height: 18, padding: 0, flexShrink: 0,
            background: 'transparent', border: 'none',
            color: 'var(--text3)', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text2)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)' }}
        >×</button>
      )}
    </div>
  )
}

export default function MemoPanel({ date, selectedMemoId, onMemoSelect }) {
  const [memos, setMemos] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', content: '' })
  const saveTimerRef = useRef(null)
  const textareaRef = useRef(null)
  const selectedMemoIdRef = useRef(selectedMemoId)

  useEffect(() => { selectedMemoIdRef.current = selectedMemoId }, [selectedMemoId])

  // 날짜 변경 시 메모 목록 로드
  useEffect(() => {
    let mounted = true
    window.api.dsu.load(date).then(data => {
      if (!mounted) return
      const list = data?.memos || []
      setMemos(list)
      const extId = selectedMemoIdRef.current
      const hasTarget = extId && list.some(m => m.id === extId)
      setSelectedId(hasTarget ? extId : (list[0]?.id || null))
    })
    return () => { mounted = false }
  }, [date])

  // 외부(달력)에서 memo 선택 시
  useEffect(() => {
    if (!selectedMemoId) return
    setSelectedId(selectedMemoId)
  }, [selectedMemoId])

  // selectedId 변경 시 편집 폼 동기화
  useEffect(() => {
    if (!selectedId) { setEditForm({ title: '', content: '' }); return }
    const memo = memos.find(m => m.id === selectedId)
    if (memo) setEditForm({ title: memo.title, content: memo.content })
  }, [selectedId, memos])

  // textarea 높이 자동 조절
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [editForm.content])

  const autoSave = useCallback((id, form) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      await window.api.memo.update(date, id, form)
      setMemos(ms => ms.map(m => m.id === id ? { ...m, ...form } : m))
    }, 1000)
  }, [date])

  const handleChange = (key, val) => {
    const next = { ...editForm, [key]: val }
    setEditForm(next)
    if (selectedId) autoSave(selectedId, next)
  }

  const addMemo = async () => {
    const newMemo = await window.api.memo.add(date, { title: '', content: '' })
    setMemos(ms => [...ms, newMemo])
    setSelectedId(newMemo.id)
    if (onMemoSelect) onMemoSelect(newMemo.id)
  }

  const deleteMemo = async (id) => {
    await window.api.memo.delete(date, id)
    setMemos(ms => {
      const next = ms.filter(m => m.id !== id)
      if (selectedId === id) {
        setSelectedId(next.length > 0 ? next[0].id : null)
      }
      return next
    })
  }

  const selectMemo = (id) => {
    setSelectedId(id)
    if (onMemoSelect) onMemoSelect(id)
  }

  return (
    <div style={{
      display: 'flex',
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      minHeight: 240
    }}>
      {/* 목록 패널 */}
      <div style={{
        width: 200, flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column'
      }}>
        <button
          onClick={addMemo}
          style={{
            padding: '10px 12px',
            background: 'transparent',
            color: 'var(--accent)',
            border: 'none',
            borderBottom: '1px solid var(--border)',
            textAlign: 'left',
            fontSize: 12, fontWeight: 500,
            borderRadius: 0
          }}
        >
          + 새 메모
        </button>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {memos.length === 0 ? (
            <div style={{ padding: '14px 12px', fontSize: 12, color: 'var(--text3)' }}>
              메모가 없어요
            </div>
          ) : memos.map(m => (
            <MemoItem
              key={m.id}
              memo={m}
              selected={m.id === selectedId}
              onSelect={() => selectMemo(m.id)}
              onDelete={() => deleteMemo(m.id)}
            />
          ))}
        </div>
      </div>

      {/* 편집 패널 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!selectedId ? (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text3)', fontSize: 13
          }}>
            ← 메모를 선택하거나 새로 만들어보세요
          </div>
        ) : (
          <>
            <input
              value={editForm.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="제목"
              style={{
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                borderRadius: 0,
                fontSize: 17, fontWeight: 600,
                color: 'var(--text)',
                width: '100%'
              }}
            />
            <textarea
              ref={textareaRef}
              value={editForm.content}
              onChange={e => handleChange('content', e.target.value)}
              placeholder="내용을 입력하세요..."
              style={{
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                borderRadius: 0,
                fontSize: 13,
                color: 'var(--text2)',
                resize: 'none',
                lineHeight: 1.8,
                minHeight: 200,
                height: 'auto',
                overflow: 'hidden',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}