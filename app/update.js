/* Qur'an PC: "Update" button and dialog.
   - Desktop app: asks the app itself (see updater.js). It can download and install by itself
     when it is the installed Windows app or the Linux AppImage; other copies are sent to the download page.
   - Web version: compares version.json on the server with the version in this page, then clears the saved
     app files and reloads. Saved recitations are not touched. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const dlg = $('updateDlg');
  if (!dlg) return;

  const RELEASES = 'https://github.com/Sodangi003/Qur-an-PC/releases/latest';
  const native = window.qpcUpdate || null;
  const btns = [$('updateBtn'), $('rwUpdate')].filter(Boolean);
  const cur = () => (($('ab-ver') && $('ab-ver').textContent) || '').trim();
  const isWeb = /^https?:$/.test(location.protocol);

  function newer(a, b) {
    const p = (v) => String(v).replace(/^v/, '').split(/[.-]/).map((n) => parseInt(n, 10) || 0);
    const x = p(a), y = p(b);
    for (let i = 0; i < 3; i++) { if ((x[i] || 0) > (y[i] || 0)) return true; if ((x[i] || 0) < (y[i] || 0)) return false; }
    return false;
  }

  let state = { state: 'idle' };
  let lastFocus = null;

  function paint() {
    const s = state, act = $('upAct'), alt = $('upAlt'), bar = $('upBar');
    bar.hidden = s.state !== 'downloading';
    act.hidden = true; alt.hidden = true; act.onclick = null; alt.onclick = null;
    $('upVer').textContent = cur();
    let msg = '';
    const go = (label, fn, el) => { (el || act).hidden = false; (el || act).textContent = label; (el || act).onclick = fn; };
    switch (s.state) {
      case 'checking': msg = 'Checking for updates…'; break;
      case 'none':
        msg = 'You have the latest version (' + (s.version || cur()) + ').';
        if (isWeb) go('Reload the latest files', () => webUpdate(), alt);
        break;
      case 'available':
        msg = 'Version ' + s.version + ' is available.';
        go('Download update', () => native.download());
        break;
      case 'downloading':
        msg = 'Downloading… ' + (s.percent || 0) + '%'; bar.value = s.percent || 0; break;
      case 'ready':
        msg = 'Version ' + s.version + ' is ready. Restart Qur\'an PC to finish. Your place and bookmarks are kept.';
        go('Restart and update', () => native.install());
        break;
      case 'manual':
        msg = 'Version ' + s.version + ' is available. This copy cannot update itself, so download the new version and install it over this one.';
        go('Open download page', () => (native ? native.open() : window.open(RELEASES, '_blank', 'noopener')));
        break;
      case 'web':
        msg = 'Version ' + s.version + ' is available.';
        go('Update now', () => webUpdate());
        break;
      case 'error':
        msg = s.message || 'Could not check for updates.';
        go('Try again', () => check(false));
        go('Open download page', () => (native ? native.open() : window.open(RELEASES, '_blank', 'noopener')), alt);
        break;
      default: msg = '';
    }
    $('upMsg').textContent = msg;
    const has = ['available', 'ready', 'manual', 'web'].includes(s.state);
    btns.forEach((b) => b.classList.toggle('has-update', has));
    if ($('updateBtn')) $('updateBtn').title = has ? 'A new version is available' : 'Check for updates';
  }
  const set = (s) => { state = s; paint(); };

  async function webCheck() {
    if (!isWeb) { set({ state: 'error', message: 'Updates are checked in the installed app or on the website. Open the download page to get the latest version.' }); return; }
    set({ state: 'checking' });
    try {
      const r = await fetch('version.json?_=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const v = (await r.json()).version;
      set(newer(v, cur()) ? { state: 'web', version: v } : { state: 'none', version: cur() });
    } catch (e) {
      set({ state: 'error', message: 'Could not check for updates. Check your internet connection and try again.' });
    }
  }

  async function webUpdate() {
    $('upMsg').textContent = 'Updating…';
    try {
      if (window.caches) for (const k of await caches.keys()) if (k.indexOf('quran-pc-app-') === 0) await caches.delete(k);   // keep saved recitations
      if (navigator.serviceWorker) for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    } catch (e) { /* reload anyway */ }
    location.reload();
  }

  function check(silent) {
    if (native) { native.check(); return; }
    if (silent && !isWeb) return;
    webCheck();
  }

  if (native) native.onStatus((s) => set(s));

  function open() {
    lastFocus = document.activeElement;
    dlg.hidden = false;
    paint();
    if (!['available', 'ready', 'manual', 'web', 'downloading'].includes(state.state)) check(false);
    $('upClose').focus();
  }
  function close() { dlg.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  btns.forEach((b) => { b.onclick = open; });
  $('upClose').onclick = close;
  dlg.addEventListener('mousedown', (e) => { if (e.target === dlg) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dlg.hidden) { e.stopPropagation(); close(); } }, true);

  // A quiet check shortly after the app opens, so the button can show a dot when something new is out.
  setTimeout(() => { if (navigator.onLine !== false) check(true); }, 4000);
})();
