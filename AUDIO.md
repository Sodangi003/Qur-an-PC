# Recitation audio

The player (the **♪** button at the top-left of the toolbar) is built in, but **no riwaya has a source yet**, so the button stays hidden.

## Where things stand

- The King Fahd Complex (Madinah) replied in writing (19 Nov 2026): the electronic publications **published on its official website** may be used, provided that the **usage policy** is followed, the **version is not modified**, the Complex's **intellectual property rights** are kept, and everything used is **attributed to the King Fahd Complex for the Printing of the Holy Qur'an in Madinah**.
- Its "Voice recitations" page still says **Soon**, so there are no official audio files to use yet. The reply does not give permission to hold copies of files that are not published, so check again once that page goes live.
- Do not use recordings from sites that give no licence (mp3quran.net, Assabile and similar) without written permission from them.

## To switch audio on for a riwaya

1. Make sure the recordings are published by the owner (for the Complex: on its official site) and read the usage policy on that page. If you want to copy them to your own storage, ask the Complex whether that is allowed.
2. Use one file per surah (`001.mp3` … `114.mp3`) in a folder that sends the header `Access-Control-Allow-Origin: *` (Cloudflare R2 with a public bucket and a CORS rule works), or use the owner's own URLs if they allow it and send that header.
3. Fill in the riwaya in `app/data/audio.js`: `reciter`, `reciterEn`, `credit` (use the Complex's name exactly: "King Fahd Complex for the Printing of the Holy Qur'an in Madinah") and `base`.
4. Bump the `?v=` numbers, build and release.

One reciter per riwaya. Surahs a person saves are kept on their own device (browser Cache Storage) and play without internet.
