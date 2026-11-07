(function () {
  'use strict';

  const Q = window.QURAN;
  const JUZ_START = [
    [1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],
    [9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],
    [29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]
  ];

  const $ = (id) => document.getElementById(id);
  const list = $('list'), reader = $('reader'), titleEl = $('title');

  // ---------- storage (safe) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
  };

  const state = {
    surah: store.get('surah', 1),
    tab: 'surah',
    size: store.get('size', 34),
    theme: store.get('theme', null),
    font: store.get('font', 'amiri'),
    marks: store.get('marks', []) // ["s:a", ...]
  };

  const toAr = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  const key = (s, a) => s + ':' + a;
  const isMarked = (s, a) => state.marks.includes(key(s, a));

  // ---------- theme / size ----------
  const FONTS = {
    amiri: '"Amiri Quran", "Scheherazade New", "Traditional Arabic", serif',
    scheherazade: '"Scheherazade New", "Traditional Arabic", serif',
    naskh: '"Noto Naskh Arabic", "Traditional Arabic", serif'
  };
  function applyFont() {
    if (!FONTS[state.font]) state.font = 'amiri';
    document.documentElement.style.setProperty('--quran-font', FONTS[state.font]);
    $('fontSel').value = state.font;
    store.set('font', state.font);
  }
  $('fontSel').onchange = (e) => { state.font = e.target.value; applyFont(); };

  function applyTheme() {
    const t = state.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', t);
  }
  function applySize() {
    document.documentElement.style.setProperty('--ayah-size', state.size + 'px');
    store.set('size', state.size);
  }
  $('theme').onclick = () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const order = ['light', 'dark', 'sepia'];
    state.theme = order[(order.indexOf(cur) + 1) % order.length];
    store.set('theme', state.theme);
    applyTheme();
  };
  function openAbout() { $('about').hidden = false; $('aboutClose').focus(); }
  function closeAbout() { $('about').hidden = true; reader.focus(); }
  $('aboutBtn').onclick = openAbout;
  $('aboutClose').onclick = closeAbout;
  $('about').addEventListener('mousedown', (e) => { if (e.target === $('about')) closeAbout(); });

  $('bigger').onclick = () => { state.size = Math.min(80, state.size + 2); applySize(); };
  $('smaller').onclick = () => { state.size = Math.max(18, state.size - 2); applySize(); };

  // ---------- sidebar lists ----------
  function item(num, en, sub, ar, active, onClick) {
    const b = document.createElement('button');
    b.className = 'item' + (active ? ' active' : '');
    b.innerHTML = '<span class="num"></span><span class="names"><b></b><small></small></span><span class="ar"></span>';
    b.querySelector('.num').textContent = num;
    b.querySelector('b').textContent = en;
    b.querySelector('small').textContent = sub;
    b.querySelector('.ar').textContent = ar;
    b.onclick = onClick;
    return b;
  }

  function renderList() {
    const f = $('filter').value.trim().toLowerCase();
    list.textContent = '';
    if (state.tab === 'surah') {
      let n = 0;
      Q.forEach((s) => {
        if (f && !(s.en.toLowerCase().includes(f) || s.ar.includes(f) || String(s.n) === f)) return;
        n++;
        list.appendChild(item(s.n, s.en, (s.t === 'm' ? 'Meccan' : 'Medinan') + ' · ' + s.v.length + ' ayahs', s.ar,
          s.n === state.surah, () => openSurah(s.n, 1)));
      });
      if (!n) list.innerHTML = '<div class="empty">No match</div>';
    } else if (state.tab === 'juz') {
      JUZ_START.forEach(([s, a], i) => {
        const sr = Q[s - 1];
        list.appendChild(item(i + 1, 'Juz ' + (i + 1), sr.en + ' ' + s + ':' + a, sr.ar, false, () => openSurah(s, a)));
      });
    } else {
      if (!state.marks.length) {
        list.innerHTML = '<div class="empty">No bookmarks yet.<br>Double-click any ayah to bookmark it.</div>';
        return;
      }
      state.marks.forEach((k) => {
        const [s, a] = k.split(':').map(Number);
        const sr = Q[s - 1];
        list.appendChild(item(s + ':' + a, sr.en, sr.v[a - 1].slice(0, 40) + '…', '', false, () => openSurah(s, a)));
      });
    }
  }

  document.querySelectorAll('.tab').forEach((t) => {
    t.onclick = () => {
      document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
      state.tab = t.dataset.tab;
      $('filter').style.display = state.tab === 'surah' ? '' : 'none';
      renderList();
    };
  });
  $('filter').oninput = renderList;

  // ---------- reader ----------
  function openSurah(n, ayah) {
    if (n < 1 || n > 114) return;
    state.surah = n;
    store.set('surah', n);
    const s = Q[n - 1];

    const page = document.createElement('div');
    page.className = 'page';

    const head = document.createElement('div');
    head.className = 's-head';
    head.innerHTML = '<div class="ar"></div><div class="meta"></div>';
    head.querySelector('.ar').textContent = 'سورة ' + s.ar;
    head.querySelector('.meta').textContent =
      s.en + ' · ' + (s.t === 'm' ? 'Meccan' : 'Medinan') + ' · ' + s.v.length + ' ayahs · Surah ' + n;
    page.appendChild(head);

    if (n !== 1 && n !== 9) {
      const b = document.createElement('div');
      b.className = 'bismillah';
      b.textContent = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';
      page.appendChild(b);
    }

    const text = document.createElement('div');
    text.className = 'text';
    s.v.forEach((v, i) => {
      const a = i + 1;
      const span = document.createElement('span');
      span.className = 'ayah' + (isMarked(n, a) ? ' marked' : '');
      span.id = 'a' + a;
      span.dataset.a = a;
      span.appendChild(document.createTextNode(v + ' '));
      const end = document.createElement('span');
      end.className = 'end';
      end.textContent = toAr(a);
      span.appendChild(end);
      text.appendChild(span);
      text.appendChild(document.createTextNode(' '));
    });
    page.appendChild(text);

    const nav = document.createElement('div');
    nav.className = 'nav-bottom';
    const p = document.createElement('button'); p.textContent = '‹ Previous surah'; p.onclick = () => openSurah(n - 1, 1);
    const x = document.createElement('button'); x.textContent = 'Next surah ›'; x.onclick = () => openSurah(n + 1, 1);
    if (n > 1) nav.appendChild(p); else nav.appendChild(document.createElement('span'));
    if (n < 114) nav.appendChild(x);
    page.appendChild(nav);

    reader.textContent = '';
    reader.appendChild(page);
    titleEl.textContent = n + '. ' + s.en + '  —  ' + s.ar;
    $('prev').disabled = n === 1;
    $('next').disabled = n === 114;

    document.title = s.en + " — Qur'an PC";

    if (state.tab === 'surah') renderList();

    if (ayah && ayah > 1) {
      const el = $('a' + ayah);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'auto' });
        el.classList.add('flash');
        setTimeout(() => el.classList.remove('flash'), 2200);
      }
    } else {
      reader.scrollTop = 0;
    }
    const act = list.querySelector('.item.active');
    if (act) act.scrollIntoView({ block: 'nearest' });
  }

  reader.addEventListener('dblclick', (e) => {
    const el = e.target.closest('.ayah');
    if (!el) return;
    const k = key(state.surah, Number(el.dataset.a));
    const i = state.marks.indexOf(k);
    if (i >= 0) state.marks.splice(i, 1); else state.marks.push(k);
    store.set('marks', state.marks);
    el.classList.toggle('marked', i < 0);
    window.getSelection().removeAllRanges();
    if (state.tab === 'marks') renderList();
  });

  $('prev').onclick = () => openSurah(state.surah - 1, 1);
  $('next').onclick = () => openSurah(state.surah + 1, 1);

  // ---------- search ----------
  let NORM = null; // [{s, a, n, map}]
  const DIAC = /[ـً-ٰٟۖ-ۭ࣓-ࣿ]/;

  function normalize(str) {
    let out = '';
    const map = [];
    for (let i = 0; i < str.length; i++) {
      let c = str[i];
      if (DIAC.test(c)) continue;
      if ('ٱأإآ'.includes(c)) c = 'ا';
      else if (c === 'ى' || c === 'ی') c = 'ي';
      else if (c === 'ک') c = 'ك';
      out += c;
      map.push(i);
    }
    return { n: out, map };
  }

  function buildIndex() {
    if (NORM) return;
    NORM = [];
    Q.forEach((s) => s.v.forEach((v, i) => {
      const r = normalize(v);
      NORM.push({ s: s.n, a: i + 1, n: r.n, map: r.map });
    }));
  }

  function highlight(orig, e, qlen) {
    const start = e.map[qlen.idx];
    const endIdx = e.map[qlen.idx + qlen.len - 1];
    let end = endIdx + 1;
    while (end < orig.length && DIAC.test(orig[end])) end++;
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createTextNode(orig.slice(0, start)));
    const m = document.createElement('mark');
    m.textContent = orig.slice(start, end);
    frag.appendChild(m);
    frag.appendChild(document.createTextNode(orig.slice(end)));
    return frag;
  }

  let searchTimer = null;
  function runSearch() {
    const raw = $('q').value.trim();
    const box = $('sp-results');
    box.textContent = '';
    if (raw.length < 2) { $('sp-count').textContent = raw ? 'Type at least 2 letters.' : ''; return; }
    buildIndex();
    const q = normalize(raw).n;
    if (!q) { $('sp-count').textContent = ''; return; }
    const MAX = 200;
    let total = 0;
    const frag = document.createDocumentFragment();
    for (const e of NORM) {
      const idx = e.n.indexOf(q);
      if (idx < 0) continue;
      total++;
      if (total > MAX) continue;
      const b = document.createElement('button');
      b.className = 'res';
      const ref = document.createElement('span');
      ref.className = 'ref';
      ref.textContent = Q[e.s - 1].en + ' ' + e.s + ':' + e.a;
      const t = document.createElement('span');
      t.className = 't';
      t.appendChild(highlight(Q[e.s - 1].v[e.a - 1], e, { idx, len: q.length }));
      b.appendChild(ref); b.appendChild(t);
      b.onclick = () => { closeSearch(); openSurah(e.s, e.a); };
      frag.appendChild(b);
    }
    box.appendChild(frag);
    $('sp-count').textContent = total
      ? total + ' ayah' + (total > 1 ? 's' : '') + ' found' + (total > MAX ? ' (showing first ' + MAX + ')' : '')
      : 'No results.';
  }

  function openSearch() { $('searchPanel').hidden = false; $('q').focus(); $('q').select(); }
  function closeSearch() { $('searchPanel').hidden = true; reader.focus(); }
  $('searchBtn').onclick = openSearch;
  $('closeSearch').onclick = closeSearch;
  $('searchPanel').addEventListener('mousedown', (e) => { if (e.target === $('searchPanel')) closeSearch(); });
  $('q').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(runSearch, 180); });

  // ---------- keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('about').hidden) { closeAbout(); return; }
    if (e.key === 'Escape' && !$('searchPanel').hidden) { closeSearch(); return; }
    if (e.ctrlKey && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); openSearch(); return; }
    if (e.ctrlKey && (e.key === '=' || e.key === '+')) { e.preventDefault(); $('bigger').click(); return; }
    if (e.ctrlKey && e.key === '-') { e.preventDefault(); $('smaller').click(); return; }
    if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); $('prev').click(); return; }
    if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); $('next').click(); return; }
  });

  // ---------- init ----------
  applyTheme();
  applyFont();
  applySize();
  renderList();
  openSurah(state.surah, 1);
})();
