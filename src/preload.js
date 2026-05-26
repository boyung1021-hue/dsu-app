const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  dsu: {
    load: (date) => ipcRenderer.invoke('dsu:load', date),
    save: (date, data) => ipcRenderer.invoke('dsu:save', date, data),
    list: () => ipcRenderer.invoke('dsu:list'),
    carryover: (from, to) => ipcRenderer.invoke('dsu:carryover', from, to)
  },
  llm: {
    chat: (messages) => ipcRenderer.invoke('llm:chat', messages)
  },
  memo: {
    add: (date, memo) => ipcRenderer.invoke('memo:add', date, memo),
    update: (date, id, memo) => ipcRenderer.invoke('memo:update', date, id, memo),
    delete: (date, id) => ipcRenderer.invoke('memo:delete', date, id)
  }
})
