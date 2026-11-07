# Qur'an PC

Offline Arabic Quran reader for Windows and Linux, also available as a website. Built with Electron.

## Download

Website: https://sodangi003.github.io/Qur-an-PC/ (download page and web version)

Get the latest Windows installer (`.exe`) or Linux `.AppImage` from the **Releases** page of this repository.

## Run it

1. Install Node.js (LTS) from https://nodejs.org
2. In this folder, open a terminal and run:

```
npm install
npm start
```

## Make a Windows installer / portable .exe

```
npm run dist
```

The installer and portable build appear in the `dist/` folder. Build this on a Windows PC.

## Make a Linux build

```
npm run dist:linux
```

This creates an `.AppImage` and a `.tar.gz` in `dist/`. Build this on Linux. To run the AppImage:

```
chmod +x Quran-Reader-*.AppImage
./Quran-Reader-*.AppImage
```

If it fails with a sandbox error on Ubuntu 24.04 or newer, run it with `--no-sandbox`.

## Features

- Full Arabic text: 114 surahs, 6,236 ayahs, Uthmani script, Amiri Quran font bundled (works fully offline)
- Navigate by surah, by juz (30), or by bookmarks
- Search the Quran in Arabic (ignores diacritics and alef variants) with highlighted matches
- Double-click any ayah to bookmark it; bookmarks and your last surah are remembered
- Three Quran fonts to choose from: Amiri Quran, Scheherazade New and Noto Naskh Arabic
- Text size, light / dark / sepia themes, F11 fullscreen, print support
- About window with credits and licences

## Shortcuts

| Key | Action |
| --- | --- |
| Ctrl+F | Search |
| Ctrl + / Ctrl - | Larger / smaller text |
| Alt + Left / Right | Previous / next surah |
| F11 | Fullscreen |
| Esc | Close search |

## Credits and licences

- Quran text: `quran-json` package (CC BY-SA 4.0), see `app/data/DATA-LICENSE-CC-BY-SA-4.0.txt`
- Fonts: Amiri Quran, Scheherazade New and Noto Naskh Arabic (SIL OFL 1.1), licence files are in `app/fonts/`
- App code: MIT, see `LICENSE`

Please have the text reviewed against a trusted printed mushaf or an authorised source (for example the King Fahd Complex) before wide public distribution.
