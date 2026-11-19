/* Qur'an PC: recitation sources, one reciter per riwaya.

   Audio stays switched off for a riwaya until it has a `base` below, and a base must only be filled in
   once the owner of the recordings has given permission (see AUDIO.md). A riwaya without a base shows no audio button.

   For each riwaya:
     reciter   Arabic name shown in the player          reciterEn  the same in Latin letters
     credit    where the recordings come from (shown in About and in the player)
     base      folder that holds one file per surah, e.g. 'https://example.org/warsh/reciter'
     pattern   file name; {nnn} = surah number as 001 .. 114 (default '{nnn}.mp3')
   The server must send the header  Access-Control-Allow-Origin: *  so the app can save surahs for offline use. */
window.QAUDIO = {
  hafs:   { reciter: '', reciterEn: '', credit: '', base: '', pattern: '{nnn}.mp3' },
  warsh:  { reciter: '', reciterEn: '', credit: '', base: '', pattern: '{nnn}.mp3' },
  qalun:  { reciter: '', reciterEn: '', credit: '', base: '', pattern: '{nnn}.mp3' },
  duri:   { reciter: '', reciterEn: '', credit: '', base: '', pattern: '{nnn}.mp3' },
  shubah: { reciter: '', reciterEn: '', credit: '', base: '', pattern: '{nnn}.mp3' },
  susi:   { reciter: '', reciterEn: '', credit: '', base: '', pattern: '{nnn}.mp3' },
  bazzi:  { reciter: '', reciterEn: '', credit: '', base: '', pattern: '{nnn}.mp3' }
};
