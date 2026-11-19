const { app, BrowserWindow, Menu, shell, ipcMain, net } = require('electron');
const path = require('path');
const { register: registerUpdates } = require('./updater');

// electron-updater is only needed for self-updating copies; the app still runs without it.
let autoUpdater = null;
try { autoUpdater = require('electron-updater').autoUpdater; } catch (e) { /* no self-update */ }

let mainWindow = null;
const fetchJson = async (url) => {
  const res = await net.fetch(url, { headers: { 'User-Agent': "Qur'an PC", Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
};

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 760,
    minHeight: 520,
    title: "Qur'an PC",
    icon: path.join(__dirname, 'app', 'icon.png'),
    backgroundColor: '#ffffff',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow = win;

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'app', 'index.html'));

  // Never navigate away from the app; open any external link in the browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e) => e.preventDefault());

  // F11 fullscreen, F12 not exposed in production
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      e.preventDefault();
    }
  });
}

app.whenReady().then(() => {
  registerUpdates({ ipcMain, app, shell, fetchJson, getWindow: () => mainWindow, autoUpdater });
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
