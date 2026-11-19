'use strict';
/* Qur'an PC: update checks for the desktop app (runs in the main process).
   - Installed Windows app (NSIS) and Linux AppImage: can download and install the update by themselves.
   - Windows portable, Linux tar.gz, or a run from source: only tell the person a newer version exists and
     open the download page, because those copies cannot replace themselves. */

const REPO = 'Sodangi003/Qur-an-PC';
const RELEASES = 'https://github.com/' + REPO + '/releases/latest';

function newer(a, b) {                       // is version a newer than version b?
  const p = (v) => String(v).replace(/^v/, '').split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  const x = p(a), y = p(b);
  for (let i = 0; i < 3; i++) {
    if ((x[i] || 0) > (y[i] || 0)) return true;
    if ((x[i] || 0) < (y[i] || 0)) return false;
  }
  return false;
}

function register({ ipcMain, app, shell, fetchJson, getWindow, autoUpdater, env = process.env, platform = process.platform }) {
  const canAuto = !!autoUpdater && app.isPackaged &&
    (platform === 'win32' ? !env.PORTABLE_EXECUTABLE_DIR : platform === 'linux' ? !!env.APPIMAGE : false);

  const send = (s) => {
    const w = getWindow && getWindow();
    if (w && !w.isDestroyed()) w.webContents.send('qpc:update', s);
  };
  const fail = (e) => send({ state: 'error', message: 'Could not update: ' + String((e && e.message) || e).slice(0, 160), url: RELEASES });

  if (canAuto) {
    autoUpdater.autoDownload = false;            // the person decides when to download
    autoUpdater.autoInstallOnAppQuit = false;    // and when to restart
    autoUpdater.on('update-available', (i) => send({ state: 'available', version: i.version }));
    autoUpdater.on('update-not-available', () => send({ state: 'none', version: app.getVersion() }));
    autoUpdater.on('download-progress', (p) => send({ state: 'downloading', percent: Math.round(p.percent || 0) }));
    autoUpdater.on('update-downloaded', (i) => send({ state: 'ready', version: i.version }));
    autoUpdater.on('error', fail);
  }

  ipcMain.handle('qpc:update:info', () => ({ version: app.getVersion(), auto: canAuto, platform }));

  ipcMain.handle('qpc:update:check', async () => {
    send({ state: 'checking' });
    try {
      if (canAuto) { await autoUpdater.checkForUpdates(); return; }
      const rel = await fetchJson('https://api.github.com/repos/' + REPO + '/releases/latest');
      const v = String(rel.tag_name || '').replace(/^v/, '');
      if (v && newer(v, app.getVersion())) send({ state: 'manual', version: v, url: RELEASES });
      else send({ state: 'none', version: app.getVersion() });
    } catch (e) {
      send({ state: 'error', message: 'Could not check for updates. Check your internet connection and try again.', url: RELEASES });
    }
  });

  ipcMain.handle('qpc:update:download', async () => { if (canAuto) { try { await autoUpdater.downloadUpdate(); } catch (e) { fail(e); } } });
  ipcMain.handle('qpc:update:install', () => { if (canAuto) autoUpdater.quitAndInstall(); });
  ipcMain.handle('qpc:update:open', () => shell.openExternal(RELEASES));
}

module.exports = { register, newer, RELEASES };
