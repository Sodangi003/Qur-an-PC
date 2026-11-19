/* Qur'an PC: the "choose a riwaya" start screen.
   It shows the list, then loads the chosen riwaya's own data files and starts the reader.
   Each riwaya keeps its own place, bookmarks and notes (see window.QRIWAYA.prefix). */
(function () {
  'use strict';

  const LIST = window.QRIWAYAT || [];
  const KEY_LAST = 'riwaya';          // the riwaya chosen last time
  const KEY_AUTO = 'riwayaAuto';      // true: open it directly next time
  const V = '20';                      // bump with the other ?v= numbers
  const $ = (id) => document.getElementById(id);

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
  };

  // Use the saved theme from the very first moment so the start screen matches the reader.
  const THEMES = ['mushaf', 'light', 'dark', 'sepia'];
  const savedTheme = store.get('theme', null);
  document.documentElement.setAttribute('data-theme', THEMES.includes(savedTheme) ? savedTheme : 'mushaf');

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src + '?v=' + V;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Could not load ' + src));
      document.body.appendChild(s);
    });
  }

  async function open(r) {
    const screen = $('riwayaScreen');
    const msg = $('rwMsg');
    msg.textContent = 'جارٍ التحميل… · Loading…';
    try {
      for (const f of r.files) await loadScript(f);          // in order: text, then page data
      window.QRIWAYA = r;
      await loadScript('book.js');
      await loadScript('app.js');
      // Recitation is optional: the reader works even if these two files are missing.
      try { await loadScript('data/audio.js'); await loadScript('audio.js'); } catch (e) { /* no audio */ }
    } catch (e) {
      msg.textContent = 'Could not load this riwaya. Check your connection and try again.';
      return;
    }
    store.set(KEY_LAST, r.id);
    store.set(KEY_AUTO, $('rwAuto').checked);
    screen.hidden = true;
    document.body.classList.remove('choosing');
    const btn = $('riwayaBtn');
    if (btn) { btn.title = 'Riwaya: ' + r.en + ' — click to choose another'; }
  }

  function card(r, last) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rw-card' + (r.ready ? '' : ' soon') + (last === r.id ? ' last' : '');
    b.dataset.id = r.id;
    b.disabled = !r.ready;
    b.innerHTML =
      '<span class="rw-ar" dir="rtl"></span>' +
      '<span class="rw-en"></span>' +
      '<span class="rw-q" dir="rtl"></span>' +
      '<span class="rw-tag"></span>';
    b.querySelector('.rw-ar').textContent = r.ar;
    b.querySelector('.rw-en').textContent = r.en;
    b.querySelector('.rw-q').textContent = 'قراءة ' + r.qari;
    b.querySelector('.rw-tag').textContent = r.ready
      ? (last === r.id ? 'آخر قراءة · Last read' : 'افتح · Open')
      : 'قريبًا · Coming soon';
    if (r.ready) b.onclick = () => open(r);
    return b;
  }

  function show() {
    const last = store.get(KEY_LAST, null);
    const grid = $('rwGrid');
    LIST.forEach((r) => grid.appendChild(card(r, last)));
    $('rwAuto').checked = store.get(KEY_AUTO, false) === true;
    $('riwayaScreen').hidden = false;
    document.body.classList.add('choosing');
    const first = grid.querySelector('.rw-card:not(.soon)');
    if (first) first.focus();
  }

  // The reader's "Riwaya" button comes back here.
  window.QCHOOSE = function () {
    try { history.replaceState(null, '', location.pathname + location.search + '#choose'); } catch { /* ignore */ }
    location.reload();
  };

  const wantsChooser = location.hash === '#choose';
  if (wantsChooser) { try { history.replaceState(null, '', location.pathname + location.search); } catch { /* ignore */ } }

  const last = LIST.find((r) => r.id === store.get(KEY_LAST, null) && r.ready);
  if (!wantsChooser && last && store.get(KEY_AUTO, false) === true) {
    $('rwAuto').checked = true;
    $('riwayaScreen').hidden = false;
    document.body.classList.add('choosing');
    open(last);
  } else {
    show();
  }
})();
