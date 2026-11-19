(function () {
  'use strict';

  const Q = window.QURAN, M = window.QMETA, BOOK = window.QBOOK;
  const $ = (id) => document.getElementById(id);
  const list = $('list'), reader = $('reader'), titleEl = $('title');

  const JUZ_START = M.juz || [
    [1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],
    [9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],
    [29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]
  ];

  // ---------- storage (safe) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
  };

  // Each riwaya keeps its own place and bookmarks. Hafs keeps the original key names,
  // so people who already use the app do not lose their place.
  const RW = window.QRIWAYA || { id: 'hafs', prefix: '' };
  const pk = (k) => RW.prefix + k;
  $('riwayaBtn').onclick = () => window.QCHOOSE && window.QCHOOSE();

  // ---------- book geometry ----------
  const TOTAL = M.pages.length;           // 604
  const LINES = 15;                       // lines on a Mushaf page
  const BANNER_SLOTS = 1.5;               // a surah banner takes about a line and a half
  const MADANI = new Set(M.madani);
  const OFF = [0];
  Q.forEach((s) => OFF.push(OFF[OFF.length - 1] + s.v.length));
  const absId = (s, a) => OFF[s - 1] + a;
  const idToSA = (id) => { let s = 1; while (OFF[s] < id) s++; return [s, id - OFF[s - 1]]; };
  const PSTART = M.pages.map(([s, a]) => absId(s, a));
  const RUB_IDS = M.hizbQ.map(([s, a]) => absId(s, a));
  const RUBS = new Map(RUB_IDS.map((id, i) => [id, i + 1]));
  const JUZ_IDS = JUZ_START.map(([s, a]) => absId(s, a));

  function pageOfId(id) {
    let lo = 0, hi = TOTAL - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (PSTART[mid] <= id) lo = mid; else hi = mid - 1; }
    return lo + 1;
  }
  const pageOf = (s, a) => pageOfId(absId(s, a));
  const surahPage = (n) => pageOf(n, 1);
  const countLE = (arr, id) => { let n = 0; while (n < arr.length && arr[n] <= id) n++; return n; };

  // The whole book in reading order: front matter, the 604 Qur'an pages, back matter.
  // The front and back pages are measured and built in start(), once the fonts are ready.
  let LEAF_ORDER = [];
  let LEAF_IDX = new Map();
  function buildOrder() {
    LEAF_ORDER = BOOK.front.concat(Array.from({ length: TOTAL }, (_, i) => i + 1), BOOK.back);
    LEAF_IDX = new Map(LEAF_ORDER.map((l, i) => [l, i]));
  }

  const toAr = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  const key = (s, a) => s + ':' + a;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function h(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Resume where the reader stopped. A first-time reader opens at the cover.
  function initialLeaf() {
    const l = store.get(pk('leaf'), null);
    if (l !== null && LEAF_IDX.has(l)) return l;
    const s = store.get(pk('surah'), null);        // saved by the older, scrolling version
    if (typeof s === 'number' && s >= 1 && s <= 114) return surahPage(s);
    return 'f-cover';
  }

  const state = {
    leaf: null,
    tab: 'surah',
    zoom: clamp(store.get('zoom', 1), 0.7, 1.8),
    theme: store.get('theme', null),
    font: RW.font ? 'own' : store.get('font', 'amiri'),
    spread: store.get('spread', true),
    marks: store.get(pk('marks'), []) // ["s:a", ...]
  };
  const isMarked = (s, a) => state.marks.includes(key(s, a));

  // ---------- theme / font / zoom ----------
  const THEMES = ['mushaf', 'light', 'dark', 'sepia'];
  // A riwaya with its own printed font (Warsh, Qalun, ...) is shown in that font, loaded from the app folder.
  if (RW.font) {
    const st = document.createElement('style');
    st.textContent = '@font-face{font-family:"' + RW.font.family + '";src:url("' + RW.font.file + '") format("truetype");font-display:block}';
    document.head.appendChild(st);
    $('fontSel').hidden = true;
  }
  const FONTS = RW.font ? {
    own: [RW.font.family, '"' + RW.font.family + '", "Amiri Quran", "Traditional Arabic", serif']
  } : {
    amiri: ['Amiri Quran', '"Amiri Quran", "Scheherazade New", "Traditional Arabic", serif'],
    scheherazade: ['Scheherazade New', '"Scheherazade New", "Traditional Arabic", serif'],
    naskh: ['Noto Naskh Arabic', '"Noto Naskh Arabic", "Traditional Arabic", serif']
  };
  let fontsReady = Promise.resolve();

  function applyTheme() {
    const t = THEMES.includes(state.theme) ? state.theme : 'mushaf';
    document.documentElement.setAttribute('data-theme', t);
  }
  function applyFont() {
    if (!FONTS[state.font]) state.font = RW.font ? 'own' : 'amiri';
    document.documentElement.style.setProperty('--quran-font', FONTS[state.font][1]);
    $('fontSel').value = state.font;
    if (!RW.font) store.set('font', state.font);
    fontsReady = Promise.all([
      document.fonts.load('32px "' + FONTS[state.font][0] + '"', M.bism || 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ'),
      document.fonts.load('32px "Amiri Quran"', '۞۩')
    ]).catch(() => {});
  }
  $('fontSel').onchange = (e) => { state.font = e.target.value; applyFont(); render(false); };
  $('theme').onclick = () => {
    state.theme = THEMES[(THEMES.indexOf(document.documentElement.dataset.theme) + 1) % THEMES.length];
    store.set('theme', state.theme);
    applyTheme();
    render(false);
  };
  function setZoom(z) {
    state.zoom = clamp(Math.round(z * 10) / 10, 0.7, 1.8);
    store.set('zoom', state.zoom);
    render(false);
  }
  $('bigger').onclick = () => setZoom(state.zoom + 0.1);
  $('smaller').onclick = () => setZoom(state.zoom - 0.1);
  $('spreadBtn').onclick = () => {
    state.spread = !state.spread;
    store.set('spread', state.spread);
    render(false);
  };

  function openAbout() { $('about').hidden = false; $('aboutClose').focus(); }
  function closeAbout() { $('about').hidden = true; reader.focus(); }
  $('aboutBtn').onclick = openAbout;
  $('aboutClose').onclick = closeAbout;
  $('about').addEventListener('mousedown', (e) => { if (e.target === $('about')) closeAbout(); });

  // ---------- mobile slide-out menu ----------
  const mobileMq = window.matchMedia('(max-width: 760px)');
  function setNav(open) {
    document.body.classList.toggle('nav-open', open);
    $('scrim').hidden = !open;
    $('menuBtn').setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  $('menuBtn').onclick = () => setNav(!document.body.classList.contains('nav-open'));
  $('scrim').onclick = () => setNav(false);
  list.addEventListener('click', (e) => { if (mobileMq.matches && e.target.closest('.item')) setNav(false); });
  mobileMq.addEventListener('change', () => setNav(false));

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
  function currentSurah() {
    return typeof state.leaf === 'number' ? idToSA(PSTART[state.leaf - 1])[0] : 0;
  }
  function heading(text) { return h('div', 'list-h', text); }

  function renderList() {
    const f = $('filter').value.trim().toLowerCase();
    list.textContent = '';
    if (state.tab === 'surah') {
      let n = 0;
      const cur = currentSurah();
      Q.forEach((s) => {
        if (f && !(s.en.toLowerCase().includes(f) || s.ar.includes(f) || String(s.n) === f)) return;
        n++;
        list.appendChild(item(s.n, s.en,
          (MADANI.has(s.n) ? 'Medinan' : 'Meccan') + ' · ' + s.v.length + ' ayahs · p.\u00a0' + surahPage(s.n), s.ar,
          s.n === cur, () => openAyah(s.n, 1)));
      });
      if (!n) list.innerHTML = '<div class="empty">No match</div>';
    } else if (state.tab === 'juz') {
      JUZ_START.forEach(([s, a], i) => {
        const sr = Q[s - 1];
        list.appendChild(item(i + 1, 'Juz ' + (i + 1), sr.en + ' ' + s + ':' + a + ' · p. ' + pageOf(s, a), sr.ar, false, () => openAyah(s, a)));
      });
    } else if (state.tab === 'book') {
      // One entry per section (a section such as the Fihris can run over several pages).
      const here = BOOK.leaves[state.leaf];
      const addSections = (ids) => {
        const seen = new Map();
        ids.forEach((id) => {
          const k = BOOK.leaves[id].sec;
          if (!seen.has(k)) seen.set(k, []);
          seen.get(k).push(id);
        });
        seen.forEach((g) => {
          const l = BOOK.leaves[g[0]];
          list.appendChild(item('', l.en, g.length > 1 ? g.length + ' pages' : '1 page', l.ar,
            !!here && here.sec === l.sec, () => go(g[0])));
        });
      };
      list.appendChild(heading('Front of the book'));
      addSections(BOOK.front);
      list.appendChild(heading('The Qur\'an'));
      list.appendChild(item(1, 'Start of the Qur\'an', 'Pages 1–' + TOTAL, 'الفاتحة', typeof state.leaf === 'number', () => go(1)));
      list.appendChild(heading('Back of the book'));
      addSections(BOOK.back);
    } else {
      if (!state.marks.length) {
        list.innerHTML = '<div class="empty">No bookmarks yet.<br>Double-click or double-tap any ayah to bookmark it.</div>';
        return;
      }
      state.marks.forEach((k) => {
        const [s, a] = k.split(':').map(Number);
        const sr = Q[s - 1];
        list.appendChild(item(s + ':' + a, sr.en, sr.v[a - 1].replace(/۞/g, '').trim().slice(0, 40) + '…', '', false, () => openAyah(s, a)));
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
  if (!JUZ_IDS.length) { const jt = document.querySelector('.tab[data-tab="juz"]'); if (jt) jt.hidden = true; }

  // ---------- page building ----------
  const BISMILLAH = M.bism || 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';
  const RUB_LABEL = ['', 'ربع الحزب', 'نصف الحزب', 'ثلاثة أرباع الحزب'];

  function appendAyah(seg, s, a) {
    const span = h('span', 'ayah' + (isMarked(s, a) ? ' marked' : ''));
    span.dataset.s = s;
    span.dataset.a = a;
    const id = absId(s, a);
    const q = RUBS.get(id);
    if (q && q > 1) {
      const hz = h('span', 'hz' + ((q - 1) % 4 === 0 ? '' : ' q'), '۞');
      const hizb = Math.floor((q - 1) / 4) + 1;
      hz.title = (q - 1) % 4 === 0 ? 'الحزب ' + toAr(hizb) + ' · Hizb ' + hizb : RUB_LABEL[(q - 1) % 4] + ' · Hizb ' + hizb;
      span.appendChild(hz);
    }
    const text = Q[s - 1].v[a - 1].replace(/۞/g, '').trim();
    const words = text.split(' ');
    let last = words.pop();
    const sajdah = last.includes('۩');
    if (sajdah) last = last.replace(/۩/g, '');
    if (words.length) span.appendChild(document.createTextNode(words.join(' ') + ' '));
    const nb = h('span', 'nb');
    nb.appendChild(document.createTextNode(last));
    if (sajdah) nb.appendChild(h('span', 'sj', '۩'));
    nb.appendChild(document.createTextNode(' '));
    nb.appendChild(h('span', 'end', toAr(a)));
    span.appendChild(nb);
    seg.appendChild(span);
    seg.appendChild(document.createTextNode(' '));
  }

  function buildQuranPage(p) {
    const startId = PSTART[p - 1];
    const endId = p < TOTAL ? PSTART[p] - 1 : OFF[114];
    const el = h('section', 'mpage ' + (p % 2 ? 'odd' : 'even'));
    el.dataset.page = p;

    const [s0] = idToSA(startId);
    const juz = countLE(JUZ_IDS, startId);
    const hizb = Math.max(1, Math.floor((countLE(RUB_IDS, startId) - 1) / 4) + 1);
    const head = h('div', 'mp-head');
    head.appendChild(h('span', 'mp-juz', JUZ_IDS.length ? 'الجزء ' + toAr(juz) + (RUB_IDS.length ? ' · الحزب ' + toAr(hizb) : '') : ''));
    head.appendChild(h('span', 'mp-sn', 'سورة ' + Q[s0 - 1].ar));
    el.appendChild(head);

    const body = h('div', 'mp-body');
    let [s, a] = idToSA(startId);
    let seg = null;
    for (let id = startId; id <= endId; id++) {
      if (a === 1) {
        if (seg) { seg.classList.add('surah-end'); seg = null; }
        const bn = h('div', 'mp-banner');
        bn.appendChild(h('span', 'mp-bn', 'سُورَةُ ' + Q[s - 1].ar));
        body.appendChild(bn);
        // Al-Fatihah has no separate bismillah line when it is counted as ayah 1 (Hafs).
        if ((s !== 1 || RW.fatihaBasmala === 'header') && s !== 9) body.appendChild(h('div', 'mp-bism', BISMILLAH));
      }
      if (!seg) { seg = h('div', 'mp-text'); body.appendChild(seg); }
      appendAyah(seg, s, a);
      if (a === Q[s - 1].v.length) { s++; a = 1; } else { a++; }
    }
    el.appendChild(body);

    const foot = h('div', 'mp-foot');
    foot.appendChild(h('span', 'mp-num', toAr(p)));
    el.appendChild(foot);
    return el;
  }

  function buildLeaf(id) {
    const def = BOOK.leaves[id];
    const el = h('section', 'mpage leaf');
    el.dataset.leaf = id;
    const head = h('div', 'mp-head');
    head.appendChild(h('span', 'mp-juz', "Qur'an PC"));
    head.appendChild(h('span', 'mp-sn', def.ar));
    el.appendChild(head);
    const body = h('div', 'mp-body leaf-body');
    let node = def.render(ctx);
    if (!node.classList.contains('lf')) { const w = h('div', 'lf'); w.appendChild(node); node = w; }
    const wrap = h('div', 'lf-wrap');
    wrap.appendChild(node);
    body.appendChild(wrap);
    el.appendChild(body);
    const foot = h('div', 'mp-foot');
    foot.appendChild(h('span', 'mp-orn', '۞'));
    el.appendChild(foot);
    return el;
  }

  // Front and back pages are laid out at a fixed logical size (see book.js),
  // then scaled to fill the page frame, so they never need a scrollbar.
  function scaleLeaf(el, d) {
    const wrap = el.querySelector('.lf-wrap'), lf = el.querySelector('.lf');
    const k = Math.min(d.Wc / BOOK.LW, d.Hc / BOOK.LH);
    wrap.style.width = BOOK.LW * k + 'px';
    wrap.style.height = BOOK.LH * k + 'px';
    lf.style.transform = 'scale(' + k + ')';
  }

  // ---------- fitting a page to 15 lines ----------
  function pageDims(pw, ph) {
    const mush = document.documentElement.dataset.theme === 'mushaf';
    const b = mush ? clamp(pw * 0.052, 12, 28) : clamp(pw * 0.03, 8, 14);
    const pad = clamp(pw * 0.03, 6, 14);
    const hh = clamp(ph * 0.04, 18, 30);
    const fh = clamp(ph * 0.052, 24, 38);
    const gv = Math.max(4, ph * 0.008);
    return {
      b, pad, hh, fh, gv,
      Wc: pw - 2 * (b + pad),
      Hc: ph - 2 * (b + pad) - hh - fh - 2 * gv
    };
  }

  function sizeVars(el, pw, ph, d) {
    el.style.setProperty('--pw', pw + 'px');
    el.style.setProperty('--ph', ph + 'px');
    el.style.setProperty('--b', d.b + 'px');
    el.style.setProperty('--pad', d.pad + 'px');
    el.style.setProperty('--hh', d.hh + 'px');
    el.style.setProperty('--fh', d.fh + 'px');
    el.style.setProperty('--gv', d.gv + 'px');
  }

  function fitPage(el, d) {
    const texts = Array.from(el.querySelectorAll('.mp-text'));
    const extra = el.querySelectorAll('.mp-banner').length * BANNER_SLOTS + el.querySelectorAll('.mp-bism').length;
    const avail = LINES - extra;
    const base = d.Hc / LINES;

    const lines = (s) => {
      let n = 0;
      texts.forEach((t) => { t.style.fontSize = s + 'px'; t.style.lineHeight = '100px'; });
      texts.forEach((t) => { n += Math.round(t.offsetHeight / 100); });
      return n;
    };

    let lo = base / 3.0, hi = base / 1.7, best, used;
    if (lines(hi) <= avail) { best = hi; used = lines(hi); }
    else if (lines(lo) > avail) { best = lo; used = lines(lo); }
    else {
      for (let i = 0; i < 16; i++) {
        const mid = (lo + hi) / 2;
        if (lines(mid) <= avail) lo = mid; else hi = mid;
      }
      best = lo; used = lines(lo);
    }
    const slots = extra + used;
    const lh = slots > LINES ? d.Hc / slots : Math.min(d.Hc / slots, base * 1.4);
    texts.forEach((t) => { t.style.fontSize = best + 'px'; t.style.lineHeight = lh + 'px'; });
    el.style.setProperty('--fs', best + 'px');
    el.style.setProperty('--lh', lh + 'px');

    // A short final line should not be stretched across the whole page.
    const last = texts[texts.length - 1];
    if (last && !last.classList.contains('surah-end')) {
      const mk = h('span', 'mk');
      last.style.textAlignLast = 'start';
      last.appendChild(mk);
      const lr = last.getBoundingClientRect(), mr = mk.getBoundingClientRect();
      const fill = lr.width ? (lr.right - mr.left) / lr.width : 1;
      mk.remove();
      last.style.textAlignLast = '';
      if (fill < 0.5) last.classList.add('loose-last');
    }
  }

  // ---------- rendering ----------
  let visible = [];
  let renderToken = 0;

  function sizeFor(n, availW, availH, gap) {
    const R_PREF = 1.42, R_MAX = 1.9;
    const maxW = (availW - (n - 1) * gap) / n;
    if (maxW >= availH / R_PREF) return { pw: availH / R_PREF, ph: availH };
    return { pw: maxW, ph: Math.min(availH, maxW * R_MAX) };
  }

  function pairFor(p) {
    if (p === 1) return [1];
    const left = p % 2 === 0 ? p : p - 1;
    return left + 1 <= TOTAL ? [left, left + 1] : [left];
  }

  async function render(animDir) {
    const token = ++renderToken;
    await fontsReady;
    if (token !== renderToken) return;

    const leaf = state.leaf;
    const cs = getComputedStyle(reader);
    const availW = reader.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = reader.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (availW < 100 || availH < 100) return;
    const gap = 14;

    let leaves = [leaf];
    if (typeof leaf === 'number' && state.spread && state.zoom <= 1) {
      const pair = pairFor(leaf);
      if (pair.length === 2 && sizeFor(2, availW, availH, gap).pw >= 400) leaves = pair;
    }
    visible = leaves;

    const n = leaves.length;
    const sz = sizeFor(n, availW, availH, gap);
    const pw = Math.floor(sz.pw * state.zoom), ph = Math.floor(sz.ph * state.zoom);
    const d = pageDims(pw, ph);

    const spread = h('div', 'spread' + (animDir ? ' turn-' + animDir : ''));
    spread.style.setProperty('--gap', gap + 'px');
    const els = leaves.map((l) => (typeof l === 'number' ? buildQuranPage(l) : buildLeaf(l)));
    els.forEach((el) => { sizeVars(el, pw, ph, d); spread.appendChild(el); });
    reader.textContent = '';
    reader.appendChild(spread);
    reader.scrollTop = 0;
    reader.scrollLeft = 0;
    els.forEach((el) => { if (el.dataset.page) fitPage(el, d); else scaleLeaf(el, d); });

    updateChrome();
    if (pendingFlash) { flashAyah(pendingFlash); pendingFlash = null; }
  }

  function updateChrome() {
    document.dispatchEvent(new CustomEvent('qpc:page'));
    const leaf = state.leaf;
    let t;
    if (typeof leaf === 'number') {
      const [s] = idToSA(PSTART[visible[0] - 1]);
      const juz = countLE(JUZ_IDS, PSTART[visible[0] - 1]);
      const pages = visible.length === 2 ? 'Pages ' + visible[0] + '–' + visible[1] : 'Page ' + visible[0];
      t = Q[s - 1].en + (JUZ_IDS.length ? ' · Juz ' + juz : '') + ' · ' + pages + ' of ' + TOTAL;
      titleEl.textContent = t;
      document.title = Q[s - 1].en + " — Qur'an PC";
    } else {
      const def = BOOK.leaves[leaf];
      t = def.en + (def.of > 1 ? ' · page ' + def.n + ' of ' + def.of : '');
      titleEl.textContent = t;
      document.title = t + " — Qur'an PC";
    }
    const i0 = LEAF_IDX.get(visible[0]), i1 = LEAF_IDX.get(visible[visible.length - 1]);
    $('prev').disabled = i0 === 0;
    $('next').disabled = i1 === LEAF_ORDER.length - 1;
    const wide = visible.length === 2;
    $('spreadBtn').textContent = wide ? '1 page' : '2 pages';
    $('spreadBtn').title = wide ? 'Show one page at a time' : 'Show two pages side by side (wide screens)';
    if (state.tab === 'surah' || state.tab === 'book') renderList();
    const act = list.querySelector('.item.active');
    if (act) act.scrollIntoView({ block: 'nearest' });
  }

  let pendingFlash = null;
  function flashAyah([s, a]) {
    const el = reader.querySelector('.ayah[data-s="' + s + '"][data-a="' + a + '"]');
    if (!el) return;
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 2400);
  }

  function go(leaf, flash) {
    if (!LEAF_IDX.has(leaf)) return;
    const prevIdx = LEAF_IDX.get(state.leaf);
    const dir = LEAF_IDX.get(leaf) > prevIdx ? 'next' : (LEAF_IDX.get(leaf) < prevIdx ? 'prev' : '');
    state.leaf = leaf;
    store.set(pk('leaf'), leaf);
    pendingFlash = flash || null;
    render(dir);
  }
  function openPage(p) { go(p); }
  function openAyah(s, a) { go(pageOf(s, a), a > 1 || s ? [s, a] : null); }
  // Used by the recitation player (audio.js).
  window.QREADER = {
    open: openAyah,
    surah() { return typeof state.leaf === 'number' && visible.length ? idToSA(PSTART[visible[0] - 1])[0] : null; }
  };

  function step(dir) {
    const base = dir > 0 ? visible[visible.length - 1] : visible[0];
    const i = LEAF_IDX.get(base) + dir;
    if (i < 0 || i >= LEAF_ORDER.length) return;
    go(LEAF_ORDER[i]);
  }
  function stepSurah(dir) {
    const cur = currentSurah() || 1;
    const n = cur + dir;
    if (n >= 1 && n <= 114) openAyah(n, 1);
  }
  $('prev').onclick = () => step(-1);
  $('next').onclick = () => step(1);

  const ctx = { surahPage, pageOf, openPage, openAyah };

  // ---------- bookmarks ----------
  reader.addEventListener('dblclick', (e) => {
    const el = e.target.closest('.ayah');
    if (!el) return;
    const s = Number(el.dataset.s), a = Number(el.dataset.a);
    const k = key(s, a);
    const i = state.marks.indexOf(k);
    if (i >= 0) state.marks.splice(i, 1); else state.marks.push(k);
    store.set(pk('marks'), state.marks);
    el.classList.toggle('marked', i < 0);
    window.getSelection().removeAllRanges();
    if (state.tab === 'marks') renderList();
  });

  // ---------- go to page / ayah ----------
  $('goto').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const v = e.target.value.trim().replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    let m, ok = false;
    if ((m = v.match(/^(\d{1,3})\s*[:.\/-]\s*(\d{1,3})$/))) {
      const s = +m[1], a = +m[2];
      if (s >= 1 && s <= 114 && a >= 1 && a <= Q[s - 1].v.length) { openAyah(s, a); ok = true; }
    } else if (/^\d{1,3}$/.test(v)) {
      const p = +v;
      if (p >= 1 && p <= TOTAL) { openPage(p); ok = true; }
    }
    if (ok) { e.target.value = ''; e.target.blur(); }
    else { e.target.classList.add('bad'); setTimeout(() => e.target.classList.remove('bad'), 700); }
  });

  // ---------- swipe to turn pages ----------
  let tx = 0, ty = 0, tOn = false;
  reader.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || state.zoom > 1) { tOn = false; return; }
    tOn = true; tx = e.touches[0].clientX; ty = e.touches[0].clientY;
  }, { passive: true });
  reader.addEventListener('touchend', (e) => {
    if (!tOn) return;
    tOn = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - tx, dy = t.clientY - ty;
    // Right to left, like the arrow keys: the next page is to the left, so swiping right brings it in.
    if (Math.abs(dx) > 60 && Math.abs(dy) < 45) step(dx > 0 ? 1 : -1);
  }, { passive: true });

  // ---------- search ----------
  let NORM = null; // [{s, a, n, map}]
  const DIAC = /[\u0640\u064B-\u0670\u06D6-\u06ED\u0887\u0888\u08C9\u08CC\u08D3-\u08FF\u200D\u200F]/;

  function normalize(str) {
    let out = '';
    const map = [];
    for (let i = 0; i < str.length; i++) {
      let c = str[i];
      if (DIAC.test(c)) continue;
      if ('ٱأإآ'.includes(c) || (c >= '\u0870' && c <= '\u0879')) c = 'ا';   // 0870-0879: the alef shapes of Warsh and Qalun
      else if (c === '\u06D1' || c === '\u06D2') c = 'ي';
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
      ref.textContent = Q[e.s - 1].en + ' ' + e.s + ':' + e.a + ' · page ' + pageOf(e.s, e.a);
      const t = document.createElement('span');
      t.className = 't';
      t.appendChild(highlight(Q[e.s - 1].v[e.a - 1], e, { idx, len: q.length }));
      b.appendChild(ref); b.appendChild(t);
      b.onclick = () => { closeSearch(); openAyah(e.s, e.a); };
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
    if (e.key === 'Escape') {
      if (!$('about').hidden) { closeAbout(); return; }
      if (!$('searchPanel').hidden) { closeSearch(); return; }
      setNav(false);
      return;
    }
    if (e.ctrlKey && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); openSearch(); return; }
    if (e.ctrlKey && (e.key === '=' || e.key === '+')) { e.preventDefault(); $('bigger').click(); return; }
    if (e.ctrlKey && e.key === '-') { e.preventDefault(); $('smaller').click(); return; }
    if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); stepSurah(-1); return; }
    if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); stepSurah(1); return; }
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (!$('searchPanel').hidden || !$('about').hidden) return;
    // The Mushaf reads right to left: the next page is to the left.
    if (e.key === 'ArrowLeft' || e.key === 'PageDown') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowRight' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
  });

  // Credits for the riwaya that is open (Hafs is credited in the list above).
  if (RW.id !== 'hafs' && $('abRiwaya')) {
    const box = $('abRiwaya');
    const h3 = h('h3', null, 'This riwaya · ' + RW.en);
    const p = h('p', null, 'Text, pages and font: King Fahd Complex for the Printing of the Holy Qur\'an in Madinah (مجمع الملك فهد لطباعة المصحف الشريف بالمدينة المنورة), through the open quran-text dataset (CC BY 4.0). The text and fonts are used unmodified, under the Complex\'s usage policy, and the intellectual property rights stay with the Complex. Please check the text against a trusted printed mushaf. ' + (RW.verify || ''));
    box.appendChild(h3); box.appendChild(p);
  }

  // ---------- start ----------
  let resizeTimer = null;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => render(false), 140); });

  async function start() {
    applyTheme();
    applyFont();
    await fontsReady;
    // The front and back pages are measured, so the fonts they use must be loaded first.
    try { await document.fonts.load('20px "Noto Naskh Arabic"', 'اللَّهُمَّ'); } catch (e) { /* use the fallback font */ }
    BOOK.prepare(ctx);
    buildOrder();
    state.leaf = initialLeaf();
    renderList();
    render(false);
  }
  start();
})();
