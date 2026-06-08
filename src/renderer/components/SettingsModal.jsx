import { useState, useEffect } from 'react'

const DEFAULT_LLM_URL = 'http://127.0.0.1:1234'

export default function SettingsModal({ onClose }) {
  const [llmUrl, setLlmUrl] = useState(DEFAULT_LLM_URL)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.settings.get().then(s => {
      if (s.llmUrl) setLlmUrl(s.llmUrl)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await window.api.settings.set({ llmUrl: llmUrl.trim() || DEFAULT_LLM_URL })
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 800)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border2)',
          borderRadius: 'var(--radius)',
          padding: '28px 28px 24px',
          width: 440,
          display: 'flex', flexDirection: 'column', gap: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>설정</span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', color: 'var(--text2)',
              fontSize: 18, lineHeight: 1, padding: '2px 6px'
            }}
          >×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--text2)' }}>
            로컬 LLM 서버 URL
          </label>
          <input
            value={llmUrl}
            onChange={e => setLlmUrl(e.target.value)}
            placeholder={DEFAULT_LLM_URL}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            style={{ fontSize: 13 }}
          />
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>
            LM Studio 기본값: {DEFAULT_LLM_URL}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px',
              background: 'var(--bg3)',
              color: 'var(--text2)',
              border: '1px solid var(--border)'
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            style={{
              padding: '7px 16px',
              background: saved ? 'var(--success)' : 'var(--accent)',
              color: '#fff',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saved ? '저장됨 ✓' : saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
