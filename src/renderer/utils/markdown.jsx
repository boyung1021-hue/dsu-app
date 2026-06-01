function parseInline(text, keyBase) {
  const result = []
  const regex = /\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`|(#[\w가-힣]+)/g
  let lastIndex = 0
  let match
  let i = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) result.push(text.slice(lastIndex, match.index))
    const k = `${keyBase}-${i++}`
    if (match[1] !== undefined)
      result.push(<strong key={k}>{match[1]}</strong>)
    else if (match[2] !== undefined)
      result.push(<em key={k}>{match[2]}</em>)
    else if (match[3] !== undefined)
      result.push(<code key={k} style={{ fontFamily: 'monospace', background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3, fontSize: '0.9em' }}>{match[3]}</code>)
    else
      result.push(<span key={k} style={{ color: 'var(--accent)', fontWeight: 500 }}>{match[4]}</span>)
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) result.push(text.slice(lastIndex))
  return result.length ? result : text
}

export default function MarkdownRenderer({ content }) {
  if (!content) return null
  const lines = content.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const k = String(i)

    if (line.startsWith('```')) {
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) codeLines.push(lines[i++])
      elements.push(
        <pre key={k} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12, overflowX: 'auto', margin: '8px 0' }}>
          <code style={{ fontFamily: 'monospace' }}>{codeLines.join('\n')}</code>
        </pre>
      )
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={k} style={{ fontSize: 21, fontWeight: 700, margin: '18px 0 6px', color: 'var(--text)', lineHeight: 1.3 }}>{parseInline(line.slice(2), k)}</h1>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={k} style={{ fontSize: 17, fontWeight: 600, margin: '14px 0 5px', color: 'var(--text)', lineHeight: 1.3 }}>{parseInline(line.slice(3), k)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={k} style={{ fontSize: 14, fontWeight: 600, margin: '12px 0 4px', color: 'var(--text)', lineHeight: 1.3 }}>{parseInline(line.slice(4), k)}</h3>)
    } else if (/^- \[[ x]\] /.test(line)) {
      const checked = line[3] === 'x'
      elements.push(
        <div key={k} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '4px 0' }}>
          <span style={{ width: 14, height: 14, flexShrink: 0, marginTop: 4, border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border2)'}`, borderRadius: 3, background: checked ? 'var(--accent2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'var(--accent)' }}>
            {checked ? '✓' : ''}
          </span>
          <span style={{ fontSize: 13, color: checked ? 'var(--text3)' : 'var(--text2)', textDecoration: checked ? 'line-through' : 'none', lineHeight: 1.7 }}>
            {parseInline(line.slice(6), k)}
          </span>
        </div>
      )
    } else if (line.startsWith('- ')) {
      elements.push(
        <div key={k} style={{ display: 'flex', gap: 8, margin: '3px 0' }}>
          <span style={{ color: 'var(--text3)', flexShrink: 0, lineHeight: 1.7 }}>•</span>
          <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{parseInline(line.slice(2), k)}</span>
        </div>
      )
    } else if (line === '---') {
      elements.push(<hr key={k} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '14px 0' }} />)
    } else if (!line.trim()) {
      elements.push(<div key={k} style={{ height: 6 }} />)
    } else {
      elements.push(<p key={k} style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8, margin: '1px 0' }}>{parseInline(line, k)}</p>)
    }
    i++
  }

  return <div>{elements}</div>
}