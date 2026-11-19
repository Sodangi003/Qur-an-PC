'use strict';
// Gives the page a small, fixed set of update functions. The page gets no other access to the system.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('qpcUpdate', {
  info: () => ipcRenderer.invoke('qpc:update:info'),
  check: () => ipcRenderer.invoke('qpc:update:check'),
  download: () => ipcRenderer.invoke('qpc:update:download'),
  install: () => ipcRenderer.invoke('qpc:update:install'),
  open: () => ipcRenderer.invoke('qpc:update:open'),
  onStatus: (cb) => {
    const f = (_e, s) => cb(s);
    ipcRenderer.on('qpc:update', f);
    return () => ipcRenderer.removeListener('qpc:update', f);
  }
});
