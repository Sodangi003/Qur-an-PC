/* Front and back matter of the Mushaf: Fihris, Azkar, Duas, notes, tables and indexes.
   Qur'anic passages are always taken from the Quran data itself, never retyped. */
(function () {
  'use strict';

  const Q = window.QURAN, M = window.QMETA;
  const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  const toAr = (n) => String(n).replace(/\d/g, (d) => AR_DIGITS[d]);
  const MADANI = new Set(M.madani);
  const RW = window.QRIWAYA || { id: 'hafs', en: "Hafs from ʿĀṣim" };
  const HAFS = RW.id === 'hafs';
  const HIZB = M.hizbQ.length === 240;
  const HASJUZ = !M.juz || M.juz.length === 30;
  const nMad = M.madani.length, nMak = 114 - nMad;
  const PBUH = 'صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ';

  function h(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function add(parent) {
    for (let i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]);
    return parent;
  }

  // ---------- shared helpers (ctx comes from app.js) ----------
  function title(ar, en) {
    const t = h('div', 'lf-title');
    add(t, h('div', 'ar', ar), h('div', 'en', en));
    return t;
  }
  function note(text) { return h('p', 'lf-note', text); }

  function ayahText(s, a) {
    return Q[s - 1].v[a - 1].replace(/۞/g, '').trim();
  }
  function quranBlock(ref) {
    // ref = [surah, fromAyah, toAyah?], written in Hafs numbering; other riwayat number some ayahs differently.
    if (M.ref && M.ref[ref.join(',')]) ref = M.ref[ref.join(',')];
    const [s, from, to] = ref;
    const last = to || from;
    const box = h('div', 'az-quran');
    const p = h('p', 'az-ar');
    for (let a = from; a <= last; a++) {
      p.appendChild(document.createTextNode(ayahText(s, a) + ' '));
      p.appendChild(h('span', 'end', toAr(a)));
      p.appendChild(document.createTextNode(' '));
    }
    box.appendChild(p);
    const lab = last === from ? s + ':' + from : s + ':' + from + '–' + last;
    box.appendChild(h('div', 'az-ref', 'Surah ' + Q[s - 1].en + ' (' + lab + ')'));
    return box;
  }

  function countLabel(n) {
    if (n === 1) return ['مرة واحدة', 'Once'];
    if (n === 2) return ['مرتان', 'Twice'];
    if (n <= 10) return [toAr(n) + ' مرات', n + ' times'];
    return [toAr(n) + ' مرة', n + ' times'];
  }

  function azkarItem(it, ctx) {
    const card = h('article', 'az-item');
    if (it.label) card.appendChild(h('div', 'az-label', it.label));
    if (it.q) it.q.forEach((r) => card.appendChild(quranBlock(r)));
    if (it.ar) card.appendChild(h('p', 'az-ar', it.ar));
    if (it.en) card.appendChild(h('p', 'az-en', it.en));
    const meta = h('div', 'az-meta');
    const c = it.cAr ? [it.cAr, it.cEn] : countLabel(it.n || 1);
    meta.appendChild(h('span', 'az-count', c[0] + ' · ' + c[1]));
    if (it.src) meta.appendChild(h('span', 'az-src', it.src));
    card.appendChild(meta);
    return card;
  }

  function section(ar, en, items, ctx) {
    const sec = h('section', 'az-sec');
    const hd = h('h3');
    add(hd, h('span', 'ar', ar), h('span', 'en', en));
    sec.appendChild(hd);
    items.forEach((it) => sec.appendChild(azkarItem(it, ctx)));
    return sec;
  }

  // ---------- AZKAR ----------
  const AZKAR = [
    {
      ar: 'أذكار الصباح والمساء', en: 'Morning and evening',
      items: [
        { q: [[2, 255]], n: 1, src: 'Quran 2:255 · Hisn al-Muslim' },
        { q: [[112, 1, 4], [113, 1, 5], [114, 1, 6]], cAr: 'ثلاث مرات لكل سورة', cEn: '3 times each', src: 'Abu Dawud, At-Tirmidhi' },
        { label: 'صباحًا · In the morning',
          ar: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
          en: 'O Allah, by You we enter the morning and by You we enter the evening; by You we live and by You we die, and to You is the resurrection.',
          n: 1, src: 'At-Tirmidhi' },
        { label: 'مساءً · In the evening',
          ar: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ',
          en: 'O Allah, by You we enter the evening and by You we enter the morning; by You we live and by You we die, and to You is the final return.',
          n: 1, src: 'At-Tirmidhi' },
        { label: 'سيد الاستغفار · The master of seeking forgiveness',
          ar: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
          en: 'O Allah, You are my Lord; none has the right to be worshipped but You. You created me and I am Your servant, and I keep Your covenant and promise as best I can. I seek refuge in You from the evil I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for none forgives sins but You.',
          n: 1, src: 'Sahih al-Bukhari' },
        { ar: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
          en: 'In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.',
          n: 3, src: 'Abu Dawud, At-Tirmidhi' },
        { ar: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ' + PBUH + ' نَبِيًّا',
          en: 'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace be upon him) as my Prophet.',
          n: 3, src: 'Abu Dawud, At-Tirmidhi' },
        { ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
          en: 'Glory is to Allah and praise is to Him.',
          n: 100, src: 'Sahih Muslim' },
        { ar: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
          en: 'None has the right to be worshipped but Allah alone, with no partner. His is the dominion and His is the praise, and He has power over all things.',
          n: 10, src: 'Sahih al-Bukhari, Sahih Muslim' },
        { ar: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
          en: 'I seek forgiveness from Allah and I turn to Him in repentance.',
          n: 100, cAr: 'مائة مرة في اليوم', cEn: '100 times a day', src: 'Sahih Muslim' }
      ]
    },
    {
      ar: 'أذكار بعد الصلاة', en: 'After the prayer',
      items: [
        { ar: 'أَسْتَغْفِرُ اللَّهَ', en: 'I seek forgiveness from Allah.', n: 3, src: 'Sahih Muslim' },
        { ar: 'اللَّهُمَّ أَنْتَ السَّلَامُ، وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
          en: 'O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of majesty and honour.',
          n: 1, src: 'Sahih Muslim' },
        { q: [[2, 255]], n: 1, cAr: 'بعد كل صلاة', cEn: 'After every prayer', src: 'Hisn al-Muslim' },
        { ar: 'سُبْحَانَ اللَّهِ', en: 'Glory is to Allah.', n: 33, src: 'Sahih Muslim' },
        { ar: 'الْحَمْدُ لِلَّهِ', en: 'All praise is for Allah.', n: 33, src: 'Sahih Muslim' },
        { ar: 'اللَّهُ أَكْبَرُ', en: 'Allah is the Greatest.', n: 33, src: 'Sahih Muslim' },
        { label: 'لإتمام المائة · To complete one hundred',
          ar: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
          en: 'None has the right to be worshipped but Allah alone, with no partner. His is the dominion and His is the praise, and He has power over all things.',
          n: 1, src: 'Sahih Muslim' }
      ]
    },
    {
      ar: 'أذكار النوم والاستيقاظ', en: 'Sleep and waking',
      items: [
        { q: [[2, 255]], n: 1, src: 'Sahih al-Bukhari' },
        { q: [[2, 285, 286]], n: 1, src: 'Sahih al-Bukhari, Sahih Muslim' },
        { q: [[112, 1, 4], [113, 1, 5], [114, 1, 6]], cAr: 'ثلاث مرات، تنفث في كفيك وتمسح بهما جسدك', cEn: '3 times: blow gently into your cupped hands, recite, then wipe over your body', src: 'Sahih al-Bukhari' },
        { ar: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
          en: 'In Your name, O Allah, I die and I live.',
          n: 1, src: 'Sahih al-Bukhari' },
        { ar: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ',
          en: 'O Allah, protect me from Your punishment on the day You resurrect Your servants.',
          n: 3, src: 'Abu Dawud, At-Tirmidhi' },
        { label: 'عند الاستيقاظ · On waking',
          ar: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
          en: 'All praise is for Allah who gave us life after having caused us to die, and to Him is the resurrection.',
          n: 1, src: 'Sahih al-Bukhari' }
      ]
    },
    {
      ar: 'أذكار متفرقة', en: 'Daily life',
      items: [
        { label: 'بعد الوضوء · After wudu',
          ar: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
          en: 'I bear witness that none has the right to be worshipped but Allah alone, with no partner, and I bear witness that Muhammad is His servant and Messenger.',
          n: 1, src: 'Sahih Muslim' },
        { label: 'عند الخروج من البيت · Leaving home',
          ar: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
          en: 'In the name of Allah. I place my trust in Allah; there is no power and no strength except with Allah.',
          n: 1, src: 'Abu Dawud, At-Tirmidhi' },
        { label: 'عند دخول المسجد · Entering the masjid',
          ar: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
          en: 'O Allah, open for me the doors of Your mercy.',
          n: 1, src: 'Sahih Muslim' },
        { label: 'عند الخروج من المسجد · Leaving the masjid',
          ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
          en: 'O Allah, I ask You for Your bounty.',
          n: 1, src: 'Sahih Muslim' },
        { label: 'بعد الطعام · After eating',
          ar: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
          en: 'All praise is for Allah who fed me this and provided it for me, with no power or strength from myself.',
          n: 1, src: 'Abu Dawud, At-Tirmidhi' },
        { label: 'عند ركوب الدابة أو السيارة · When travelling',
          ar: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ',
          en: 'Glory to Him who has subjected this to us, and we could not have done it ourselves, and to our Lord we shall return.',
          n: 1, src: 'Quran 43:13–14 · Sahih Muslim' }
      ]
    }
  ];

  // ---------- DUAS ----------
  const QURAN_DUAS = [
    ['A good life in this world and the next', [2, 201]],
    ['Do not hold us to account for our mistakes', [2, 286]],
    ['Keep our hearts firm after guidance', [3, 8]],
    ['Forgiveness and firm footing', [3, 147]],
    ['For forgiveness and mercy (Adam and Hawwa)', [7, 23]],
    ['Establishing prayer (Ibrahim)', [14, 40, 41]],
    ['Mercy for parents', [17, 24]],
    ['Guidance in our affairs (the People of the Cave)', [18, 10]],
    ['Ease in speech and affairs (Musa)', [20, 25, 28]],
    ['Increase me in knowledge', [20, 114]],
    ['In hardship (Yunus)', [21, 87]],
    ['Forgiveness and mercy', [23, 118]],
    ['For family and righteous leadership', [25, 74]],
    ['In need of Allah\'s good (Musa)', [28, 24]],
    ['For the believers who came before us', [59, 10]],
    ['For parents and the believers (Nuh)', [71, 28]]
  ];

  const SUNNAH_DUAS = [
    { ar: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ',
      en: 'O Allah, I seek refuge in You from worry and grief, from weakness and laziness, from miserliness and cowardice, and from being overcome by debt and overpowered by men.',
      label: 'عند الهم والحزن · In worry and grief', src: 'Sahih al-Bukhari' },
    { ar: 'لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ',
      en: 'None has the right to be worshipped but Allah, the Mighty, the Forbearing. None has the right to be worshipped but Allah, Lord of the Mighty Throne. None has the right to be worshipped but Allah, Lord of the heavens, Lord of the earth and Lord of the Noble Throne.',
      label: 'عند الكرب · In times of distress', src: 'Sahih al-Bukhari, Sahih Muslim' },
    { ar: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
      en: 'My Lord, forgive me and accept my repentance; You are the Ever-Accepting of repentance, the Most Merciful.',
      label: 'الاستغفار · Seeking forgiveness', src: 'Abu Dawud, At-Tirmidhi' },
    { ar: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
      en: 'O Allah, You are Pardoning and You love to pardon, so pardon me.',
      label: 'ليلة القدر · For Laylat al-Qadr', src: 'At-Tirmidhi, Ibn Majah' },
    { ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى',
      en: 'O Allah, I ask You for guidance, piety, chastity and self-sufficiency.',
      label: 'الهداية والتقى · Guidance and piety', src: 'Sahih Muslim' },
    { ar: 'اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الْحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ، وَاجْعَلِ الْمَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ',
      en: 'O Allah, set right my religion, which is the safeguard of my affairs; set right my worldly life, in which is my livelihood; set right my hereafter, to which is my return. Make life an increase for me in every good, and make death a rest for me from every evil.',
      label: 'إصلاح الدين والدنيا والآخرة · Setting right religion, life and the hereafter', src: 'Sahih Muslim' },
    { ar: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ',
      en: 'O Turner of hearts, make my heart firm upon Your religion.',
      label: 'الثبات · Steadfastness', src: 'At-Tirmidhi' },
    { ar: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
      en: 'O Ever-Living, O Self-Sustaining, in Your mercy I seek relief.',
      label: 'الاستغاثة · Seeking relief', src: 'At-Tirmidhi' }
  ];

  const SUPPLEMENT_NOTE = 'The adhkar and duas on these pages are supplementary material, not part of the Qur\'an text. They follow the Qur\'an and authentic reports collected in Hisn al-Muslim. Please check them against a trusted printed copy or ask a teacher.';

  // ---------- pages ----------
  // Every section is cut into units (a title, a table row, a card) that are packed onto fixed pages.
  // A page never scrolls: app.js scales its content to fit the frame.
  const LW = 440;   // logical width of a page's content, in px
  const LH = 640;   // logical height of a page's content, in px
  let probe = null, CTX = null;

  const U = (make, extra) => Object.assign({ make }, extra || {});
  const group = (cls, head) => ({ cls, head });
  const headRow = (cells) => () => {
    const t = h('thead');
    const tr = h('tr');
    cells.forEach((x) => tr.appendChild(h('th', null, x)));
    t.appendChild(tr);
    return t;
  };
  const rowUnit = (g, make) => U(make, { group: g });
  function clickable(tr, fn) {
    tr.classList.add('clickable');
    tr.tabIndex = 0;
    tr.onclick = fn;
    tr.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };
  }
  function heading(ar, en) {
    const hd = h('h3', 'sec-h');
    add(hd, h('span', 'ar', ar), h('span', 'en', en));
    return hd;
  }

  // Build the DOM for a list of units. Consecutive row units of one group share a table.
  function buildUnits(units, parent) {
    let tbl = null, grp = null;
    units.forEach((u) => {
      const el = u.make();
      if (u.group) {
        if (grp !== u.group) {
          grp = u.group;
          tbl = h('table', grp.cls);
          if (grp.head) tbl.appendChild(grp.head());
          parent.appendChild(tbl);
        }
        tbl.appendChild(el);
      } else {
        grp = null; tbl = null;
        parent.appendChild(el);
      }
    });
    return parent;
  }

  function measure(units) {
    probe.textContent = '';
    buildUnits(units, probe);
    return probe.offsetHeight;
  }

  // Greedy packing: fill a page until the next unit would not fit, then start a new page.
  function pack(units) {
    const pages = [];
    let cur = [];
    units.forEach((u) => {
      const test = cur.concat(u);
      if (cur.length && measure(test) > LH) {
        const carry = [];
        while (cur.length > 1 && cur[cur.length - 1].keep) carry.unshift(cur.pop()); // keep headings with what follows
        pages.push(cur);
        cur = carry.concat(u);
      } else {
        cur = test;
      }
    });
    if (cur.length) pages.push(cur);
    return pages;
  }

  // ---------- sections ----------
  function fihrisUnits() {
    const g = group('tbl fh', headRow(['No.', 'السورة', 'Surah', 'Ayahs', 'Place', 'Page']));
    const u = [
      U(() => title('فهرس المصحف', 'Fihris al-Mushaf · Index of the surahs'), { keep: true }),
      U(() => note('Tap a surah to open its page. Place of revelation follows the printed mushaf of this riwaya: ' + nMak + ' Makki and ' + nMad + ' Madani surahs.'), { keep: true })
    ];
    Q.forEach((s) => u.push(rowUnit(g, () => {
      const tb = h('tbody');
      const tr = h('tr');
      const pg = CTX.surahPage(s.n);
      add(tr, h('td', 'c', String(s.n)), h('td', 'ar', s.ar), h('td', null, s.en), h('td', 'c', String(s.v.length)),
        h('td', 'c nw', MADANI.has(s.n) ? 'مدنية · Madani' : 'مكية · Makki'), h('td', 'c', String(pg)));
      clickable(tr, () => CTX.openPage(pg));
      tb.appendChild(tr);
      return tb;
    })));
    return u;
  }

  function azkarUnits() {
    const u = [
      U(() => title('أذكار', 'Azkar · Daily remembrances'), { keep: true }),
      U(() => note(SUPPLEMENT_NOTE), { keep: true })
    ];
    AZKAR.forEach((s) => {
      u.push(U(() => heading(s.ar, s.en), { keep: true }));
      s.items.forEach((it) => u.push(U(() => azkarItem(it))));
    });
    return u;
  }

  function duasUnits() {
    const u = [
      U(() => title('أدعية', 'Duas · Supplications'), { keep: true }),
      U(() => note(SUPPLEMENT_NOTE), { keep: true }),
      U(() => heading('أدعية من القرآن الكريم', "Duas from the Qur'an"), { keep: true })
    ];
    QURAN_DUAS.forEach((d) => {
      const it = { label: d[0], q: [d[1]], n: 1, cAr: 'من القرآن الكريم', cEn: "From the Qur'an", src: null };
      u.push(U(() => azkarItem(it)));
    });
    u.push(U(() => heading('أدعية من السنة النبوية', 'Duas from the Sunnah'), { keep: true }));
    SUNNAH_DUAS.forEach((d) => {
      const it = Object.assign({ n: 1, cAr: 'عند الحاجة', cEn: 'Whenever needed' }, d);
      u.push(U(() => azkarItem(it)));
    });
    return u;
  }

  function notesUnits() {
    const ayahs = Q.reduce((n, s) => n + s.v.length, 0);
    const makki = Q.filter((s) => !MADANI.has(s.n)).length;
    const kn = [
      ['Surahs · السور', Q.length], ['Ayahs · الآيات', ayahs.toLocaleString('en')],
      ['Pages · الصفحات', M.pages.length], ...(HASJUZ ? [['Juz · الأجزاء', 30]] : []),
      ...(HIZB ? [['Hizb · الأحزاب', M.hizbQ.length / 4], ['Quarters of a hizb · الأرباع', M.hizbQ.length]] : []),
      ['Manzil · المنازل', M.manzil.length],
      ...(M.rukuCount ? [['Ruku · الركوعات', M.rukuCount]] : []),
      ['Sajdah places · مواضع السجود', M.sajda.length],
      ['Makki surahs · السور المكية', makki], ['Madani surahs · السور المدنية', Q.length - makki]
    ];
    const g = group('tbl kv', null);
    const u = [
      U(() => title('ملاحظات حول هذه الطبعة', 'Production notes · Key numbers'), { keep: true }),
      U(() => h('h3', 'lf-h', 'Key numbers · أرقام'), { keep: true })
    ];
    kn.forEach((r) => u.push(rowUnit(g, () => {
      const tb = h('tbody');
      tb.appendChild(add(h('tr'), h('th', null, r[0]), h('td', 'c', String(r[1]))));
      return tb;
    })));
    const notes = HAFS ? [
      ['The text', "Uthmani script, riwayah Hafs 'an 'Asim, with the Kufan verse count of 6,236 ayahs. It comes from the open quran-json project and is licensed CC BY-SA 4.0, so any copy you share must keep the same licence and credit."],
      ['The pages', 'The 604 pages use the page boundaries of the Madinah Mushaf layout, as recorded in the open quran-meta data. Lines are re-flowed to fit your screen and each page is fitted to about 15 lines, so line breaks will differ from the printed copy.'],
      ['Juz, hizb and manzil', 'The 30 juz, 60 hizb (240 quarters) and 7 manzil follow the traditional divisions, and the quarter positions agree with the signs carried in the Qur\'an text itself. The sign ۞ shows where a hizb or a quarter begins, and ۩ marks a place of prostration.'],
      ['Places of revelation', 'The Makki and Madani classification follows the Madinah Mushaf: 86 Makki and 28 Madani surahs.'],
      ['Adhkar and duas', "The Azkar and Duas pages are not Qur'an text. They were added for convenience, from the Qur'an and from Hisn al-Muslim."],
      ['Please verify', 'This is a reading aid and not an official print. Before using it for teaching, memorisation or printing, check the text against a trusted printed Mushaf or an authorised digital source, such as the King Fahd Glorious Quran Printing Complex.']
    ] : [
      ['The text', 'Riwaya ' + RW.en + ', ' + RW.count + '. The text and its font come from the King Fahd Complex for the Printing of the Holy Qur\'an in Madinah, through the open quran-text dataset (CC BY 4.0), and are used unmodified under the Complex\'s usage policy. Verse numbers follow the count of this riwaya, so some ayahs are joined or split compared with the Hafs mushaf.'],
      ['The pages', 'The 604 pages follow the page boundaries of the printed mushaf of this riwaya. A few pages of the print begin in the middle of an ayah; here that ayah stays whole on the earlier page. Lines are re-flowed to fit your screen, so line breaks differ from the printed copy.'],
      ['Juz, hizb and manzil', (HASJUZ ? 'The 30 juz follow the printed mushaf. ' : '') + (HIZB ? 'The 240 hizb quarters come from the open quran-meta data and agree with most of the ۞ signs printed in the text; check the exact place against your printed mushaf. ' : (RW.verify || '') + ' ') + '۩ marks the ' + M.sajda.length + ' places of prostration printed in this mushaf.'],
      ['Places of revelation', 'The Makki and Madani classification follows this edition: ' + nMak + ' Makki and ' + nMad + ' Madani surahs.'],
      ['Adhkar and duas', "The Azkar and Duas pages are not Qur'an text. They were added for convenience, from the Qur'an and from Hisn al-Muslim."],
      ['Please verify', 'This is a reading aid and not an official print. Before using it for teaching, memorisation or printing, check the text against a trusted printed Mushaf or an authorised digital source, such as the King Fahd Glorious Quran Printing Complex.']
    ];
    notes.forEach((n) => {
      u.push(U(() => h('h3', 'lf-h', n[0]), { keep: true }));
      u.push(U(() => h('p', 'lf-p', n[1])));
    });
    return u;
  }

  function placesUnits() {
    const makki = Q.filter((s) => !MADANI.has(s.n));
    const madani = Q.filter((s) => MADANI.has(s.n));
    const u = [
      U(() => title('المكي والمدني', 'Makki and Madani surahs'), { keep: true }),
      U(() => note('Tap a surah to open its page.'), { keep: true })
    ];
    function add2(ar, en, list) {
      u.push(U(() => heading(ar, en + ' · ' + list.length), { keep: true }));
      for (let i = 0; i < list.length; i += 21) {
        const part = list.slice(i, i + 21);
        u.push(U(() => {
          const grid = h('div', 'pl-grid');
          part.forEach((s) => {
            const b = h('button', 'chip');
            add(b, h('span', 'n', String(s.n)), h('span', 'ar', s.ar), h('span', 'pg', 'p. ' + CTX.surahPage(s.n)));
            b.onclick = () => CTX.openPage(CTX.surahPage(s.n));
            grid.appendChild(b);
          });
          return grid;
        }));
      }
    }
    add2('السور المكية', 'Makki surahs', makki);
    add2('السور المدنية', 'Madani surahs', madani);
    return u;
  }

  function sajdahUnits() {
    const g = group('tbl sjt', headRow(['#', 'Surah', 'Ayah', 'Page', 'الآية']));
    const u = [
      U(() => title('آيات السجدة', 'Places of prostration (sajdat al-tilawah)'), { keep: true }),
      U(() => note('This mushaf marks ' + M.sajda.length + ' places with ۩. Scholars differ on the exact number and positions (commonly 12 to 15), so follow the teaching of your own school. Tap a row to open its page.'), { keep: true })
    ];
    M.sajda.forEach(([s, a], i) => u.push(rowUnit(g, () => {
      const tb = h('tbody');
      const tr = h('tr');
      const name = add(h('td', 'sn'), h('span', 'ar', Q[s - 1].ar), h('span', 'en', Q[s - 1].en));
      add(tr, h('td', 'c', String(i + 1)), name, h('td', 'c nw', s + ':' + a),
        h('td', 'c', String(CTX.pageOf(s, a))), h('td', 'ar', ayahText(s, a).replace(/۩/g, '').trim()));
      clickable(tr, () => CTX.openAyah(s, a));
      tb.appendChild(tr);
      return tb;
    })));
    return u;
  }

  function juzUnits() {
    const rub = (i) => M.hizbQ[i];
    const g = group('tbl jz', HIZB ? headRow(['Juz · الجزء', 'Starts at', 'Page', 'Hizb', 'Page']) : headRow(['Juz · الجزء', 'Starts at', 'Page']));
    const u = [
      U(() => title(HIZB ? 'فهرس الأجزاء والأحزاب' : HASJUZ ? 'فهرس الأجزاء' : 'فهرس المنازل', HIZB ? 'Index of juz, hizb and manzil' : HASJUZ ? 'Index of juz and manzil' : 'Index of manzil'), { keep: true }),
      U(() => note('Tap a row to open its page.'), { keep: true })
    ];
    for (let j = 1; j <= (HASJUZ ? 30 : 0); j++) {
      u.push(rowUnit(g, () => {
        const tb = h('tbody');
        const [s, a] = M.juz ? M.juz[j - 1] : rub((j - 1) * 8);
        if (!HIZB) {
          const tr = h('tr');
          clickable(tr, () => CTX.openAyah(s, a));
          add(tr, h('td', 'c', toAr(j) + ' · ' + j), h('td', null, Q[s - 1].en + ' ' + s + ':' + a), h('td', 'c', String(CTX.pageOf(s, a))));
          tb.appendChild(tr);
          return tb;
        }
        for (let k = 0; k < 2; k++) {
          const hz = (j - 1) * 2 + k + 1;
          const [hs, ha] = rub((hz - 1) * 4);
          const tr = h('tr');
          clickable(tr, () => CTX.openAyah(hs, ha));
          if (k === 0) {
            const c1 = h('td', 'c', toAr(j) + ' · ' + j); c1.rowSpan = 2;
            const c2 = h('td', null, Q[s - 1].en + ' ' + s + ':' + a); c2.rowSpan = 2;
            const c3 = h('td', 'c', String(CTX.pageOf(s, a))); c3.rowSpan = 2;
            add(tr, c1, c2, c3);
          }
          add(tr, h('td', 'c', hz + ' · ' + Q[hs - 1].en + ' ' + hs + ':' + ha), h('td', 'c', String(CTX.pageOf(hs, ha))));
          tb.appendChild(tr);
        }
        return tb;
      }));
    }
    const mg = group('tbl jz', headRow(['Manzil · المنزلة', 'Starts at', 'Page']));
    u.push(U(() => heading('المنازل السبعة', 'The seven manzil'), { keep: true }));
    M.manzil.forEach(([s, a], i) => u.push(rowUnit(mg, () => {
      const tb = h('tbody');
      const tr = h('tr');
      clickable(tr, () => CTX.openAyah(s, a));
      add(tr, h('td', 'c', toAr(i + 1) + ' · ' + (i + 1)), h('td', null, Q[s - 1].en + ' ' + s + ':' + a), h('td', 'c', String(CTX.pageOf(s, a))));
      tb.appendChild(tr);
      return tb;
    })));
    return u;
  }

  // ---------- the book ----------
  const BOOK = { front: [], back: [], leaves: {}, LW, LH, prepare };
  window.QBOOK = BOOK;

  function addSection(prefix, where, ar, en, units) {
    const pages = pack(units);
    pages.forEach((pg, i) => {
      const id = prefix + '-' + (i + 1);
      BOOK.leaves[id] = {
        ar, en, sec: prefix, n: i + 1, of: pages.length,
        render() { return buildUnits(pg, h('div', 'lf')); }
      };
      BOOK[where].push(id);
    });
  }

  // Called once by app.js after the fonts are loaded, so the page measurements are true.
  function prepare(ctx) {
    CTX = ctx;
    BOOK.front.length = 0;
    BOOK.back.length = 0;
    Object.keys(BOOK.leaves).forEach((k) => delete BOOK.leaves[k]);
    probe = h('div', 'lf-fit lf-probe');
    probe.style.width = LW + 'px';
    document.body.appendChild(probe);

    BOOK.leaves['f-cover'] = {
      ar: 'القرآن الكريم', en: 'Cover', sec: 'f-cover', n: 1, of: 1, center: true,
      render() {
        const box = h('div', 'cover');
        const img = h('img');
        img.src = 'cover.webp';
        img.alt = '';
        add(box, img, h('div', 'ar', 'القرآن الكريم'), h('div', 'en', "Qur'an PC · " + (HAFS ? "Riwayat Hafs 'an 'Asim" : 'Riwaya ' + RW.en)));
        return box;
      }
    };
    BOOK.front.push('f-cover');
    addSection('f-fihris', 'front', 'فهرس المصحف', 'Fihris al-Mushaf', fihrisUnits());
    addSection('f-azkar', 'front', 'أذكار', 'Azkar', azkarUnits());
    addSection('f-duas', 'front', 'أدعية', 'Duas', duasUnits());
    addSection('b-notes', 'back', 'ملاحظات حول هذه الطبعة', 'Production notes', notesUnits());
    addSection('b-places', 'back', 'المكي والمدني', 'Makki and Madani surahs', placesUnits());
    addSection('b-sajdah', 'back', 'مواضع السجود', 'Sajdah verses', sajdahUnits());
    addSection('b-juz', 'back', HIZB ? 'فهرس الأجزاء والأحزاب' : HASJUZ ? 'فهرس الأجزاء' : 'فهرس المنازل', HIZB ? 'Index of juz and hizb' : HASJUZ ? 'Index of juz' : 'Index of manzil', juzUnits());
    probe.remove();
    probe = null;
  }
})();
