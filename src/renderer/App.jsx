import { useState, useEffect, useCallback, useRef } from 'react'
import Today from './pages/Today.jsx'
import History from './pages/History.jsx'
import Calendar from './pages/Calendar.jsx'
import Memos from './pages/Memos.jsx'
import ChatBot from './components/ChatBot.jsx'
import SettingsModal from './components/SettingsModal.jsx'

const toDateStr = () => {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

export default function App() {
  const [page, setPage] = useState('today')
  const [chatOpen, setChatOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [chatWidth, setChatWidth] = useState(340)
  const dragRef = useRef(null)
  const [todayData, setTodayData] = useState(null)
  const [loadingToday, setLoadingToday] = useState(true)
  const [selectedDate, setSelectedDate] = useState(toDateStr())
  const [selectedMemoId, setSelectedMemoId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    window.api.dsu.load(toDateStr()).then(data => {
      setTodayData(data)
      setLoadingToday(false)
    })
  }, [])

  const refreshToday = useCallback(async () => {
    const data = await window.api.dsu.load(toDateStr())
    setTodayData(data)
  }, [])

  const refreshFromBot = useCallback(async () => {
    const data = await window.api.dsu.load(toDateStr())
    setTodayData(data)
    setRefreshKey(k => k + 1)
  }, [])

  // DSU 미작성이면 챗봇 자동 열기
  useEffect(() => {
    if (!loadingToday && !todayData) {
      setTimeout(() => setChatOpen(true), 600)
    }
  }, [loadingToday, todayData])

  const startDrag = useCallback((e) => {
    const startX = e.clientX
    const startWidth = chatWidth

    const onMove = (e) => {
      const next = Math.min(600, Math.max(260, startWidth + (startX - e.clientX)))
      setChatWidth(next)
    }
    const onUp = () => {
      document.body.style.userSelect = 'auto'
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      dragRef.current = null
    }

    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    dragRef.current = { onMove, onUp }
  }, [chatWidth])

  useEffect(() => {
    return () => {
      if (dragRef.current) {
        document.removeEventListener('mousemove', dragRef.current.onMove)
        document.removeEventListener('mouseup', dragRef.current.onUp)
      }
    }
  }, [])

  const handleDateSelect = useCallback((dateStr) => {
    setSelectedDate(dateStr)
    setPage('today')
  }, [])

  const handleMemoOpen = useCallback((date, memoId) => {
    setSelectedDate(date)
    setSelectedMemoId(memoId)
    setPage('today')
  }, [])

  const tabs = [
    { id: 'today', label: '오늘' },
    { id: 'history', label: '기록' },
    { id: 'calendar', label: '달력' },
    { id: 'memos', label: '메모' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* 타이틀바 */}
      <div style={{
        height: 48,
        WebkitAppRegion: 'drag',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 80,
        paddingRight: 16,
        gap: 4,
        flexShrink: 0
      }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setPage(tab.id)} style={{
            WebkitAppRegion: 'no-drag',
            padding: '4px 14px',
            background: page === tab.id ? 'var(--accent2)' : 'transparent',
            color: page === tab.id ? 'var(--accent)' : 'var(--text2)',
            border: 'none',
            fontSize: 13,
            fontWeight: page === tab.id ? 500 : 400
          }}>
            {tab.label}
          </button>
        ))}

        {/* 우측 버튼 그룹 */}
        <div style={{ marginLeft: 'auto', WebkitAppRegion: 'no-drag', display: 'flex', gap: 6 }}>
          <button
            onClick={() => setSettingsOpen(true)}
            title="설정"
            style={{
              width: 32, height: 32,
              background: 'var(--bg3)',
              color: 'var(--text2)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ⚙
          </button>
          <button
            onClick={() => setChatOpen(o => !o)}
            title="AI 챗봇"
            style={{
              width: 32, height: 32,
              background: chatOpen ? 'var(--accent2)' : 'var(--bg3)',
              color: chatOpen ? 'var(--accent)' : 'var(--text2)',
              border: '1px solid',
              borderColor: chatOpen ? 'rgba(127,119,221,0.3)' : 'var(--border)',
              borderRadius: '50%',
              fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ✦
          </button>
        </div>
      </div>

      {/* 바디 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 메인 페이지 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {page === 'today' && (
            <Today
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onRefresh={refreshToday}
              selectedMemoId={selectedMemoId}
              onMemoSelect={setSelectedMemoId}
              refreshKey={refreshKey}
            />
          )}
          {page === 'history' && <History />}
          {page === 'calendar' && (
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onMemoSelect={setSelectedMemoId}
            />
          )}
          {page === 'memos' && (
            <Memos onMemoOpen={handleMemoOpen} />
          )}
        </div>

        {/* 챗봇 사이드패널 */}
        {chatOpen && (
          <div style={{
            width: chatWidth,
            position: 'relative',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg2)',
            flexShrink: 0
          }} className="fade-in">
            <div
              onMouseDown={startDrag}
              style={{
                position: 'absolute', left: 0, top: 0,
                width: 6, height: '100%',
                cursor: 'col-resize', zIndex: 10,
                background: 'transparent',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            />
            <ChatBot
              todayData={todayData}
              selectedDate={selectedDate}
              selectedMemoId={selectedMemoId}
              onClose={() => setChatOpen(false)}
              onRefresh={refreshFromBot}
            />
          </div>
        )}
      </div>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}