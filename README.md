# Alfaaz Sujal Ke , website

The literary home of **Sujal Negi** (pen name *alfaazsujalke*). A static website with no
dependencies to install: your words live in plain files, and one small Node script turns them
into the site.

```
content/            ← everything you edit
  site.json         name, links, contact email, home-page lines, review marks on/off
  about.md          the About page text
  poems/*.md        one file per poem (the file name becomes the URL)
  books.json        anthologies (published) + your own books (forthcoming)
  timeline.json     the Journey page
  media.json        Instagram reels, songs (mp3) and films (YouTube)
public/             css, js, images, audio , copied as-is
src/                page templates (the design)
build.js            content + public → dist/
serve.js            local preview server
dist/               the finished website , upload this folder
```

## Preview it

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
node build.js      # rebuild dist/ after any change
node serve.js      # open http://localhost:4321
```

## Publish it

Upload the **`dist/`** folder to any static host , Netlify (drag & drop the folder),
Vercel, GitHub Pages, Cloudflare Pages, or your own hosting. Before publishing, set
`"url"` in `content/site.json` to your real domain (it is used for share previews and the
sitemap), then run `node build.js` again.

For Netlify/Vercel with automatic builds: build command `node build.js`, publish directory `dist`.

## Add a poem

Create `content/poems/my-poem-name.md`:

```
---
title: पंखों की चाहत
titleRoman: Pankhon ki Chahat
language: hindi              # english | hindi | urdu
form: Kavita                 # Ghazal, Nazm, Poem, Kavita…
themes: [dreams, nature]
emotions: [hope]
book: himkavya               # optional , a slug from books.json
featured: true               # optional , sorts it first
---
नन्ही सी चिड़िया, डाली पर बैठी,
आसमान को देख, आहें भरती।

(a blank line starts a new stanza)
```

- A line like `[1]` at the start of a stanza shows a stanza number.
- To add a **Roman Urdu / Hinglish** version, put a line `===roman===` after the poem and
  write the transliteration below it , a "Roman" button appears on the poem page.
- Optional fields: `date` (YYYY-MM-DD; dated poems appear on the Journey page), `epigraph`,
  `note` (a footnote), `award`, `reel` (a reel link shown on the poem page).
- `review:` (optional) shows a dashed "for review" note on the page while
  `showReviewMarks` is `true` in `site.json`.

## Add a book / cover / buy link

Edit `content/books.json`. List the poems you contributed in `"poems"` (poem file names
without `.md`). Optional: `"cover"` (an image in `public/images/covers/`) and `"buyUrl"`;
nothing is shown for them until you add them.

## Add a reel (Instagram or Facebook)

In `content/media.json`, add an entry to `reels`. The reel must be public.

```json
{ "url": "https://www.instagram.com/reel/XXXXXXXX/", "title": "Hijr-e-Noor", "poem": "hijr-e-noor" }
```

`poem` is optional and links the reel to its poem page. Facebook links work the same way.
To show a reel on a poem's own page too, add `reel: <link>` to that poem's file.

## Song lyrics

Put lyrics in `content/lyrics/<name>.md` (sections like `[Chorus]`) and an optional English
translation in `<name>.en.md`, then set `"lyrics": "<name>"` on the song in `media.json`.

## Background music

The soft library music is composed live in the browser by `public/js/music.js` (no audio file).
Visitors switch it on with the Music button and it keeps playing while they move between pages
(pages change without a full reload), until they tap the button again. It pauses while one of the
songs plays and comes back after; it goes very quiet while a reel or film plays. To remove it, delete the music button lines in `src/layout.js`.

## Forthcoming books

`From Love's Diary` (all 15 poems) opens like a real book (`public/js/flipbook.js`).
Their pages are built from `content/books.json`; From Love's Diary also pulls in its 15 poem files.
The other books (The Last Letter to Hope, Before They Become Memories) show on the writing desk as "Coming soon".

## Contact form

Letters go straight to your inbox through Web3Forms (free):
1. Go to https://web3forms.com, enter the email where you want letters, and copy the Access Key they email you.
2. Paste it in `content/site.json` as `"web3formsKey": "your-key-here"` and run `node build.js`.

Your address is never shown on the site. Without a key the form falls back to `contactEmail`
(opens the visitor's email app), and without that, to Instagram.

## Before going live

Read `REVIEW.md`, fix what needs fixing, then set `"showReviewMarks": false` in
`content/site.json` and rebuild.
