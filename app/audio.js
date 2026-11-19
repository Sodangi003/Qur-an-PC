/* Qur'an PC: recitation player (one reciter per riwaya) with "save for offline".
   It switches itself on only for a riwaya that has a source in data/audio.js. */
(function () {
  'use strict';

  const RW = window.QRIWAYA || { id: 'hafs' };
  const CFG = window.QAUDIO && window.QAUDIO[RW.id];
  const Q = window.QURAN;
  const $ = (id) => document.getElementById(id);
  const btn = $('audioBtn');
  if (!btn || !CFG || !CFG.base) return;                       // no source for this riwaya: no audio, nothing shown

  const CACHE = 'quran-pc-audio-v1';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
  };
  const KEY = (k) => 'audio:' + RW.id + ':' + k;
  const pad = (n) => String(n).padStart(3, '0');
  const urlOf = (s) => CFG.base.replace(/\/+$/, '') + '/' + (CFG.pattern || '{nnn}.mp3').replace('{nnn}', pad(s)).replace('{n}', String(s));
  const hasCaches = typeof caches !== 'undefined';
  const fmt = (t) => { if (!isFinite(t)) return '0:00'; t = Math.floor(t); const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); };

  // ---------- markup ----------
  const bar = document.createElement('div');
  bar.id = 'audioBar';
  bar.hidden = true;
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Recitation');
  bar.innerHTML =
    '<div class="au-row">' +
      '<button id="auPrev" title="Previous surah" aria-label="Previous surah">⏮</button>' +
      '<button id="auPlay" class="au-play" title="Play / pause (Space)" aria-label="Play">▶</button>' +
      '<button id="auNext" title="Next surah" aria-label="Next surah">⏭</button>' +
      '<select id="auSurah" aria-label="Surah"></select>' +
      '<span id="auTime" class="au-time">0:00</span>' +
      '<input id="auSeek" type="range" min="0" max="1000" value="0" aria-label="Position">' +
      '<span id="auDur" class="au-time">0:00</span>' +
      '<button id="auSave" title="Save this surah on this device to listen offline">Save offline</button>' +
      '<button id="auClose" title="Close the player" aria-label="Close the player">✕</button>' +
    '</div>' +
    '<div class="au-row au-sub">' +
      '<span id="auWho"></span>' +
      '<span id="auMsg" role="status"></span>' +
      '<label class="au-vol">🔊 <input id="auVol" type="range" min="0" max="100" value="100" aria-label="Volume"></label>' +
    '</div>';
  $('reader').after(bar);

  const audio = new Audio();
  audio.preload = 'none';
  const el = (id) => $(id);
  const sel = el('auSurah');
  Q.forEach((s) => { const o = document.createElement('option'); o.value = s.n; o.textContent = s.n + '. ' + s.en + ' · ' + s.ar; sel.appendChild(o); });
  el('auWho').textContent = (CFG.reciter || CFG.reciterEn || '') + (CFG.credit ? ' · ' + CFG.credit : '');
  btn.hidden = false;
  btn.title = 'Recitation';

  let surah = store.get(KEY('surah'), 1);
  let objectUrl = null;
  let saved = new Set();
  let wantPlay = false;
  let seeking = false;

  const msg = (t) => { el('auMsg').textContent = t || ''; };
  const resizeReader = () => window.dispatchEvent(new Event('resize'));

  // ---------- offline copies ----------
  async function refreshSaved() {
    saved = new Set();
    if (hasCaches) {
      try {
        const c = await caches.open(CACHE);
        for (const r of await c.keys()) {
          for (let s = 1; s <= 114; s++) if (r.url === urlOf(s) || r.url === new URL(urlOf(s), location.href).href) saved.add(s);
        }
      } catch { /* ignore */ }
    }
    paintSave();
  }
  function paintSave() {
    const b = el('auSave');
    if (!hasCaches) { b.hidden = true; return; }
    b.disabled = false;
    b.textContent = saved.has(surah) ? 'Saved ✓ · Remove' : 'Save offline';
    b.classList.toggle('on', saved.has(surah));
    // mark saved surahs in the list
    [...sel.options].forEach((o) => { const n = +o.value; o.textContent = (saved.has(n) ? '✓ ' : '') + n + '. ' + Q[n - 1].en + ' · ' + Q[n - 1].ar; });
  }

  async function saveOrRemove() {
    const s = surah, url = urlOf(s), b = el('auSave');
    const c = await caches.open(CACHE);
    if (saved.has(s)) { await c.delete(url); saved.delete(s); paintSave(); msg('Removed from this device.'); return; }
    b.disabled = true;
    try {
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      msg('Downloading… 0%');
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const total = +res.headers.get('content-length') || 0;
      const reader = res.body && res.body.getReader ? res.body.getReader() : null;
      let blob;
      if (reader) {
        const parts = []; let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          parts.push(value); got += value.length;
          if (total) msg('Downloading… ' + Math.round(got / total * 100) + '%  (' + (got / 1048576).toFixed(1) + ' MB)');
        }
        blob = new Blob(parts, { type: res.headers.get('content-type') || 'audio/mpeg' });
      } else blob = await res.blob();
      await c.put(url, new Response(blob, { headers: { 'content-type': blob.type || 'audio/mpeg' } }));
      saved.add(s);
      msg('Saved. This surah now plays without internet.');
    } catch (e) {
      msg('Could not save: the connection failed or the server does not allow saving.');
    }
    paintSave();
  }

  // ---------- playback ----------
  async function sourceFor(s) {
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    if (hasCaches && saved.has(s)) {
      try {
        const c = await caches.open(CACHE);
        const r = await c.match(urlOf(s));
        if (r) { objectUrl = URL.createObjectURL(await r.blob()); return objectUrl; }
      } catch { /* fall back to the network */ }
    }
    return urlOf(s);
  }

  async function select(s, play, followReader) {
    s = Math.min(114, Math.max(1, s | 0));
    surah = s;
    sel.value = String(s);
    store.set(KEY('surah'), s);
    audio.pause();
    audio.src = await sourceFor(s);
    el('auSeek').value = 0; el('auTime').textContent = '0:00'; el('auDur').textContent = '0:00';
    paintSave();
    msg(saved.has(s) ? 'Playing the saved copy.' : '');
    if (followReader && window.QREADER) window.QREADER.open(s, 1);
    if (play) { wantPlay = true; try { await audio.play(); } catch { msg('Could not play: check your connection, or save the surah first.'); } }
    mediaSession();
  }

  function mediaSession() {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: Q[surah - 1].ar + ' · ' + Q[surah - 1].en, artist: CFG.reciter || CFG.reciterEn || '', album: "Qur'an PC · " + (RW.en || '') });
      navigator.mediaSession.setActionHandler('play', () => audio.play());
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => select(surah - 1, true, true));
      navigator.mediaSession.setActionHandler('nexttrack', () => select(surah + 1, true, true));
    } catch { /* ignore */ }
  }

  audio.addEventListener('play', () => { el('auPlay').textContent = '⏸'; el('auPlay').setAttribute('aria-label', 'Pause'); });
  audio.addEventListener('pause', () => { el('auPlay').textContent = '▶'; el('auPlay').setAttribute('aria-label', 'Play'); });
  audio.addEventListener('loadedmetadata', () => { el('auDur').textContent = fmt(audio.duration); });
  audio.addEventListener('timeupdate', () => {
    el('auTime').textContent = fmt(audio.currentTime);
    if (!seeking && audio.duration) el('auSeek').value = Math.round(audio.currentTime / audio.duration * 1000);
  });
  audio.addEventListener('ended', () => { if (surah < 114) select(surah + 1, true, true); });
  audio.addEventListener('error', () => { if (audio.src) msg('This recording could not be loaded. Check your connection.'); });

  el('auPlay').onclick = async () => {
    if (!audio.src) await select(surah, true, false);
    else if (audio.paused) { try { await audio.play(); } catch { msg('Could not play.'); } } else audio.pause();
  };
  el('auPrev').onclick = () => select(surah - 1, !audio.paused, true);
  el('auNext').onclick = () => select(surah + 1, !audio.paused, true);
  sel.onchange = () => select(+sel.value, !audio.paused, true);
  el('auSave').onclick = saveOrRemove;
  el('auSeek').oninput = () => { seeking = true; if (audio.duration) el('auTime').textContent = fmt(el('auSeek').value / 1000 * audio.duration); };
  el('auSeek').onchange = () => { if (audio.duration) audio.currentTime = el('auSeek').value / 1000 * audio.duration; seeking = false; };
  el('auVol').oninput = () => { audio.volume = el('auVol').value / 100; store.set(KEY('vol'), el('auVol').value); };
  const vol = store.get(KEY('vol'), 100); el('auVol').value = vol; audio.volume = vol / 100;

  function open(on) {
    bar.hidden = !on;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    document.body.classList.toggle('audio-open', on);
    if (on) {
      // start on the surah being read, unless something is already playing
      if (audio.paused && !audio.src && window.QREADER && window.QREADER.surah()) { surah = window.QREADER.surah(); sel.value = String(surah); paintSave(); }
    }
    resizeReader();
  }
  btn.onclick = () => open(bar.hidden);
  el('auClose').onclick = () => { audio.pause(); open(false); btn.focus(); };

  // while nothing is playing, the player follows the surah on the reader's page
  document.addEventListener('qpc:page', () => {
    if (bar.hidden || !audio.paused || audio.currentTime > 0) return;
    const s = window.QREADER && window.QREADER.surah();
    if (s && s !== surah) { surah = s; sel.value = String(s); audio.removeAttribute('src'); paintSave(); }
  });

  document.addEventListener('keydown', (e) => {
    if (bar.hidden || e.target.closest('input[type=text],input[type=search],textarea,select') ) return;
    if (e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.altKey && !(e.target.tagName === 'BUTTON')) { e.preventDefault(); el('auPlay').click(); }
  });

  // credit in the About dialog
  const ab = $('abRiwaya');
  if (ab && CFG.credit) {
    const h = document.createElement('p');
    h.textContent = 'Recitation: ' + (CFG.reciterEn || CFG.reciter || '') + (CFG.reciter && CFG.reciterEn ? ' (' + CFG.reciter + ')' : '') + '. Source: ' + CFG.credit + '. The recordings belong to their owners and are used under their usage policy.';
    ab.appendChild(h);
  }

  sel.value = String(surah);
  refreshSaved();
})();
