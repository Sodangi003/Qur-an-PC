(function () {
  'use strict';
  var REPO = 'Sodangi003/Qur-an-PC';
  var $ = function (id) { return document.getElementById(id); };

  // Which computer is the visitor on?
  var ua = (navigator.userAgent || '').toLowerCase();
  var os = /windows/.test(ua) ? 'win'
    : (/android|iphone|ipad/.test(ua) ? 'mobile'
    : (/linux|x11|ubuntu|fedora|debian/.test(ua) ? 'linux' : 'other'));

  var hint = $('osHint');
  if (os === 'win') { $('btnWin').classList.add('rec'); showHint('We detected Windows, so this one is for you.'); }
  else if (os === 'linux') { $('btnLinux').classList.add('rec'); showHint('We detected Linux, so this one is for you.'); }
  else if (os === 'mobile') { showHint('On a phone or tablet? Tap "Read in your browser". It works great on mobile.'); }
  else if (os === 'other') { showHint('On a Mac? There is no Mac download yet, but the browser version works.'); }
  function showHint(t) { hint.textContent = t; hint.hidden = false; }

  // Link each button straight to the file in the latest GitHub release.
  function pick(assets, re) {
    for (var i = 0; i < assets.length; i++) if (re.test(assets[i].name)) return assets[i];
    return null;
  }
  function link(id, asset, label) {
    var el = $(id);
    if (!el || !asset) return;
    el.href = asset.browser_download_url;
    if (label) el.title = asset.name + ' (' + (asset.size / 1048576).toFixed(0) + ' MB)';
  }

  fetch('https://api.github.com/repos/' + REPO + '/releases/latest', { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (rel) {
      var a = rel.assets || [];
      var setup = pick(a, /setup.*\.exe$/i) || pick(a, /\.exe$/i);
      var portable = pick(a, /portable.*\.exe$/i);
      var appimage = pick(a, /\.appimage$/i);
      var tar = pick(a, /\.tar\.gz$/i);
      link('btnWin', setup, true); link('dlWinSetup', setup, true);
      link('dlWinPortable', portable, true);
      link('btnLinux', appimage, true); link('dlLinux', appimage, true);
      link('dlTar', tar, true);
      var v = rel.tag_name || '';
      if (v) {
        $('ver').textContent = 'Version ' + v.replace(/^v/, '');
        $('ver2').textContent = 'Latest version: ' + v.replace(/^v/, '') + '.';
      }
    })
    .catch(function () { /* no release yet or offline: buttons keep pointing at the releases page */ });
})();
