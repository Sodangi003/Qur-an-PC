/* Qur'an PC: the list of riwayat shown on the start screen.
   A riwaya marked ready:true has its own text and page data (the files in `files`).
   The others are listed so readers can see what is planned; they stay "coming soon"
   until their text and 604-page layout have been added and checked. */
window.QRIWAYAT = [
  { id: 'hafs',   ar: 'حفص عن عاصم',     en: 'Hafs from ʿĀṣim',            qari: 'عاصم بن أبي النجود · الكوفي', ready: true,  prefix: '',       files: ['data/quran.js', 'data/meta.js'] },
  { id: 'warsh',  ar: 'ورش عن نافع',     en: 'Warsh from Nāfiʿ',           qari: 'نافع المدني',                 ready: true,  prefix: 'warsh:', files: ['data/warsh.js'],
    font: { family: 'KFGQPC Warsh Uthmanic Script', file: 'fonts/UthmanicWarsh-v-3.0.ttf', label: 'Warsh (KFGQPC)' },
    fatihaBasmala: 'header', hizb: false, count: '6,214 ayahs (Madani last count)', verify: 'Hizb and quarter signs are not shown for Warsh yet: they will be added once checked against the printed Warsh mushaf.' },
  { id: 'qalun',  ar: 'قالون عن نافع',   en: 'Qālūn from Nāfiʿ',           qari: 'نافع المدني',                 ready: true,  prefix: 'qalun:', files: ['data/qalun.js'],
    font: { family: 'KFGQPC Qaloun Uthmanic Script', file: 'fonts/UthmanicQaloun-v-3.0.ttf', label: 'Qalun (KFGQPC)' },
    fatihaBasmala: 'header', hizb: true, count: '6,214 ayahs (Madani last count)' },
  { id: 'duri',   ar: 'الدوري عن أبي عمرو', en: 'al-Dūrī from Abū ʿAmr',   qari: 'أبو عمرو البصري',             ready: true,  prefix: 'duri:', files: ['data/duri.js'],
    font: { family: 'KFGQPC Douri Uthmanic Script', file: 'fonts/UthmanicDouri-V20.ttf', label: 'al-Duri (KFGQPC)' },
    fatihaBasmala: 'header', hizb: false, count: '6,217 ayahs', verify: 'Hizb and quarter signs are not shown for al-Duri yet: they will be added once checked against the printed mushaf.' },
  { id: 'shubah', ar: 'شعبة عن عاصم',    en: 'Shuʿba from ʿĀṣim',          qari: 'عاصم بن أبي النجود · الكوفي', ready: true,  prefix: 'shubah:', files: ['data/shubah.js'],
    font: { family: 'KFGQPC Shuba Uthmanic Script', file: 'fonts/UthmanicShubah-v-3.0.ttf', label: 'Shuʿba (KFGQPC)' },
    hizb: true, count: '6,236 ayahs (Kufan count)' },
  { id: 'susi',   ar: 'السوسي عن أبي عمرو', en: 'al-Sūsī from Abū ʿAmr',   qari: 'أبو عمرو البصري',             ready: true,  prefix: 'susi:', files: ['data/susi.js'],
    font: { family: 'KFGQPC Sousi Uthmanic Script', file: 'fonts/UthmanicSousi-v-3.0.ttf', label: 'al-Sūsī (KFGQPC)' },
    fatihaBasmala: 'header', hizb: false, count: '6,218 ayahs', verify: 'Hizb and quarter signs are not shown for al-Susi yet: they will be added once checked against the printed mushaf.' },
  { id: 'bazzi',  ar: 'البزي عن ابن كثير', en: 'al-Bazzī from Ibn Kathīr', qari: 'ابن كثير المكي',              ready: true,  prefix: 'bazzi:', files: ['data/bazzi.js'],
    font: { family: 'KFGQPC Bazzi Uthmanic Script', file: 'fonts/UthmanicBazzi-v-3.0.ttf', label: 'al-Bazzī (KFGQPC)' },
    hizb: false, count: '6,220 ayahs', verify: 'Juz and hizb divisions are not shown for al-Bazzi: the source has no juz data for this riwaya yet.' }
];
