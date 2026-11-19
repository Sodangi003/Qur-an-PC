# Qur'an PC

Offline Arabic Quran reader for Windows and Linux, also available as a website. Built with Electron.

## Download

Smallest option: open the web version and click **Install** (about 2 MB, works offline). The Windows and Linux files below are about 120 MB because they include a browser engine.

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
chmod +x Qur-an-PC-*.AppImage
./Qur-an-PC-*.AppImage
```

If it fails with a sandbox error on Ubuntu 24.04 or newer, run it with `--no-sandbox`.

## Features

**Reads like a printed Mushaf**
- The 604 pages of the Madinah Mushaf layout, one page at a time (no scrolling). Each page shows the same ayahs as the printed page, with the surah banner and basmala where a surah begins
- Two-page spread on wide screens, one page on small ones. Turn pages with the buttons, the arrow keys or a swipe
- Page header with juz and hizb, page number in a medallion, hizb and quarter signs (۞) and prostration signs (۩)
- Go to a page (`250`) or an ayah (`2:255`) from the box in the toolbar

**In the front of the book**
- Cover, **Fihris al-Mushaf** (all 114 surahs with ayah count, place of revelation and starting page), **Azkar** and **Duas**

**In the back of the book**
- Production notes with the key numbers, the Makki and Madani surahs, the places of prostration, and an index of the 30 juz, 60 hizb and 7 manzil

**Reading tools**
- Search the Quran in Arabic (diacritics and alef variants ignored), with highlighted matches
- Navigate by surah, by juz, by book section, or by bookmarks. Double-click (or double-tap) an ayah to bookmark it. The app remembers where you stopped
- Three Quran fonts (Amiri Quran, Scheherazade New, Noto Naskh Arabic), zoom, and four themes: Mushaf (default), light, dark and sepia
- Works fully offline. Runs on Windows and Linux, and in any browser

## Shortcuts

| Key | Action |
| --- | --- |
| Left arrow / Page Down | Next page (the Mushaf reads right to left) |
| Right arrow / Page Up | Previous page |
| Alt + Left / Right | Previous / next surah |
| Ctrl+F | Search |
| Ctrl + / Ctrl - | Zoom in / out |
| F11 | Fullscreen |
| Esc | Close search or About |

## About the pages

The page boundaries (which ayah starts each of the 604 pages) are taken from the open `quran-meta` data, and have been checked against the standard starting page of all 114 surahs. The lines inside a page are re-flowed to fit your screen and fitted to about 15 lines, so line breaks will differ from a printed Mushaf.

The Azkar and Duas pages are supplementary material and are not part of the Quran text.

## Credits and licences

- Quran text: `quran-json` package (CC BY-SA 4.0), see `app/data/DATA-LICENSE-CC-BY-SA-4.0.txt`
- Page, hizb, manzil and sajdah positions: derived from the `quran-meta` package (MIT)
- Fonts: Amiri Quran, Scheherazade New and Noto Naskh Arabic (SIL OFL 1.1), licence files are in `app/fonts/`
- App code: MIT, see `LICENSE`

Please have the text reviewed against a trusted printed mushaf or an authorised source (for example the King Fahd Complex) before wide public distribution.

## Releasing an update

1. Change `"version"` in `package.json` (for example `1.1.2`) and the version shown in `app/index.html` (`#ab-ver`).
2. Push to `main`. The website and web reader update by themselves (the reader shows an update dot, and "Update now" reloads the latest files).
3. Create and push a tag: `git tag v1.1.2 && git push origin v1.1.2`. GitHub Actions builds the Windows and Linux files and attaches them, with `latest.yml` and `latest-linux.yml`, to the release. Publish the release (not as a draft or pre-release).
4. Installed copies (the Windows installer and the Linux AppImage) check GitHub, show a dot on **Update**, and download and install the new version when the person agrees. Portable and `.tar.gz` copies are pointed to the download page.

The first version that contains the **Update** button has to be installed by hand; updates are automatic after that.
