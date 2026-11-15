/* Install support for the web version. Does nothing inside the desktop app (file://). */
(function () {
  'use strict';
  if (!/^https?:$/.test(location.protocol)) return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline support is optional */ });
    });
  }

  var btn = document.getElementById('installBtn');
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    if (btn) btn.hidden = false;
  });
  if (btn) {
    btn.addEventListener('click', function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; btn.hidden = true; });
    });
  }
  window.addEventListener('appinstalled', function () { if (btn) btn.hidden = true; });
})();
