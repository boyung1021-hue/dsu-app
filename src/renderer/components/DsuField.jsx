import { useState } from 'react'
import { polishField } from '../llm.js'

export default function DsuField({ label, field, value, onChange, placeholder, rows = 4, noPolish = false }) {
  const [polishing, setPolishing] = useState(false)

  const handlePolish = async () => {
    if (!value.trim() || polishing) return
    setPolishing(true)
    try {
      const result = await polishField(value, field)
      onChange(result)
    } catch (e) {
      console.error('polish error', e)
    } finally {
      setPolishing(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </label>
        {!noPolish && (
          <button onClick={handlePolish} disabled={polishing || !value.trim()} style={{
            padding: '2px 9px',
            background: polishing ? 'var(--bg3)' : 'var(--accent3)',
            color: polishing ? 'var(--text3)' : 'var(--accent)',
            border: '1px solid', borderColor: polishing ? 'var(--border)' : 'rgba(127,119,221,0.25)',
            fontSize: 11, fontWeight: 500
          }}>
            {polishing ? '✦ 정리 중...' : '✦ AI 다듬기'}
          </button>
        )}
      </div>
      <textarea rows={rows} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
