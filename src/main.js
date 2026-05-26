const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')
const crypto = require('crypto')

const genId = () => crypto.randomUUID()

const isDev = !app.isPackaged

// 데이터 디렉토리: 프로젝트 내 /data
const DATA_DIR = isDev
  ? path.join(__dirname, '../data')
  : path.join(app.getAppPath(), 'data')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const toDateStr = (d = new Date()) => d.toISOString().split('T')[0]
const mdPath = (date) => path.join(DATA_DIR, `${date}.md`)

// ── 마크다운 파싱/생성 헬퍼 ─────────────────────────────

function parseMemos(raw) {
  if (!raw || !raw.trim()) return []
  // 구형 단일 텍스트 형식 → memos[0] 으로 변환
  if (!raw.includes('### ')) {
    const text = raw.trim()
    return text ? [{ id: genId(), title: '', content: text, createdAt: new Date().toISOString() }] : []
  }
  return raw.split('\n\n---\n\n')
    .map(block => block.trim()).filter(Boolean)
    .map(block => {
      const nl = block.indexOf('\n')
      const firstLine = nl === -1 ? block : block.slice(0, nl)
      const rest = nl === -1 ? '' : block.slice(nl + 1).trim()
      const m = firstLine.match(/^### (.+?) <!-- id:([^\s]+) createdAt:([^\s]+) -->$/)
      if (!m) return null
      return { id: m[2], title: m[1], content: rest, createdAt: m[3] }
    })
    .filter(Boolean)
}

function buildMemos(memos) {
  if (!memos || memos.length === 0) return ''
  return memos
    .map(m => `### ${m.title || '제목 없음'} <!-- id:${m.id} createdAt:${m.createdAt} -->\n${m.content || ''}`)
    .join('\n\n---\n\n')
}

function parseMd(content) {
  const get = (section) => {
    const m = content.match(new RegExp(`## ${section}\\n([\\s\\S]*?)(?=\\n## |$)`))
    return m ? m[1].trim() : ''
  }

  const parseChecklist = (raw) =>
    raw.split('\n')
      .filter(l => l.startsWith('- ['))
      .map(l => ({
        text: l.replace(/^- \[[ x]\] /, ''),
        done: l.startsWith('- [x]')
      }))

  return {
    yesterday: get('어제 한 일'),
    today: get('오늘 할 일'),
    blocker: get('장애물'),
    tasks: parseChecklist(get('체크리스트')),
    memos: parseMemos(get('메모')),
    raw: content
  }
}

function buildMd(date, data) {
  const taskLines = (data.tasks || [])
    .map(t => `- [${t.done ? 'x' : ' '}] ${t.text}`)
    .join('\n')

  return `# DSU — ${date}

## 어제 한 일
${data.yesterday || ''}

## 오늘 할 일
${data.today || ''}

## 장애물
${data.blocker || '없음'}

## 체크리스트
${taskLines || ''}

## 메모
${buildMemos(data.memos || [])}
`
}

// ── IPC 핸들러 ───────────────────────────────────────────

ipcMain.handle('dsu:load', (_, date) => {
  const fp = mdPath(date)
  if (!fs.existsSync(fp)) return null
  return parseMd(fs.readFileSync(fp, 'utf-8'))
})

ipcMain.handle('dsu:save', (_, date, data) => {
  const fp = mdPath(date)
  // 메모는 MemoPanel이 독립 관리하므로 dsu:save 시 기존 메모 보존
  let memos = data.memos
  if (!memos) {
    memos = fs.existsSync(fp) ? (parseMd(fs.readFileSync(fp, 'utf-8')).memos || []) : []
  }
  fs.writeFileSync(fp, buildMd(date, { ...data, memos }), 'utf-8')
  return true
})

ipcMain.handle('dsu:list', () => {
  return fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.md'))
    .sort().reverse()
    .map(f => {
      const date = f.replace('.md', '')
      const parsed = parseMd(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'))
      return { date, ...parsed }
    })
})

// 미완료 태스크를 다음날로 이월
ipcMain.handle('dsu:carryover', (_, fromDate, toDate) => {
  const fromFp = mdPath(fromDate)
  if (!fs.existsSync(fromFp)) return []

  const from = parseMd(fs.readFileSync(fromFp, 'utf-8'))
  const unfinished = from.tasks.filter(t => !t.done)
  if (unfinished.length === 0) return []

  const toFp = mdPath(toDate)
  const to = fs.existsSync(toFp)
    ? parseMd(fs.readFileSync(toFp, 'utf-8'))
    : { yesterday: '', today: '', blocker: '', tasks: [], memos: [] }

  // 중복 제거 후 이월
  const existingTexts = new Set(to.tasks.map(t => t.text))
  const merged = [
    ...to.tasks,
    ...unfinished.filter(t => !existingTexts.has(t.text)).map(t => ({ ...t, done: false }))
  ]
  to.tasks = merged
  fs.writeFileSync(toFp, buildMd(toDate, to), 'utf-8')
  return unfinished
})

ipcMain.handle('memo:add', (_, date, { title, content }) => {
  const fp = mdPath(date)
  const existing = fs.existsSync(fp)
    ? parseMd(fs.readFileSync(fp, 'utf-8'))
    : { yesterday: '', today: '', blocker: '', tasks: [], memos: [] }
  const newMemo = { id: genId(), title: title || '', content: content || '', createdAt: new Date().toISOString() }
  existing.memos = [...(existing.memos || []), newMemo]
  fs.writeFileSync(fp, buildMd(date, existing), 'utf-8')
  return newMemo
})

ipcMain.handle('memo:update', (_, date, id, { title, content }) => {
  const fp = mdPath(date)
  if (!fs.existsSync(fp)) return false
  const data = parseMd(fs.readFileSync(fp, 'utf-8'))
  data.memos = (data.memos || []).map(m => m.id === id ? { ...m, title, content } : m)
  fs.writeFileSync(fp, buildMd(date, data), 'utf-8')
  return true
})

ipcMain.handle('memo:delete', (_, date, id) => {
  const fp = mdPath(date)
  if (!fs.existsSync(fp)) return false
  const data = parseMd(fs.readFileSync(fp, 'utf-8'))
  data.memos = (data.memos || []).filter(m => m.id !== id)
  fs.writeFileSync(fp, buildMd(date, data), 'utf-8')
  return true
})

// 로컬 LLM 호출 (LM Studio: OpenAI 호환 API)
ipcMain.handle('llm:chat', async (_, messages) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'local-model',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      stream: false
    })

    const req = http.request({
      hostname: '127.0.0.1',
      port: 1234,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve(parsed.choices?.[0]?.message?.content || '')
        } catch (e) {
          reject(new Error('LLM 응답 파싱 실패: ' + data))
        }
      })
    })

    req.on('error', (e) => reject(new Error('LLM 연결 실패 (LM Studio가 실행 중인지 확인): ' + e.message)))
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('LLM 타임아웃')) })
    req.write(body)
    req.end()
  })
})

// ── 윈도우 ───────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 720,
    minHeight: 560,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
