#!/usr/bin/env node
// Builds the static site: content/ + public/ → dist/.  Usage: node build.js
'use strict';
const fs = require('fs');
const path = require('path');
const { frontMatter, parsePoem, normalize } = require('./src/lib');
const P = require('./src/pages');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const json = (f) => JSON.parse(read(f));

const site = json('content/site.json');
const books = json('content/books.json');
const timeline = json('content/timeline.json');
const media = json('content/media.json');
const aboutDoc = frontMatter(read('content/about.md'));

// Song lyrics: content/lyrics/<name>.md and an optional English translation <name>.en.md
const lyrics = {};
for (const f of fs.readdirSync(path.join(ROOT, 'content/lyrics')).filter((f) => f.endsWith('.md'))) {
  const [name, lang] = f.replace(/\.md$/, '').split('.');
  (lyrics[name] ||= {})[lang === 'en' ? 'en' : 'original'] = read('content/lyrics/' + f);
}

// Poems: one Markdown file each in content/poems. The file name is the URL slug.
const LANG_ORDER = { english: 0, urdu: 1, hindi: 2 };
const errors = [];
const poems = fs
  .readdirSync(path.join(ROOT, 'content/poems'))
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const slug = f.replace(/\.md$/, '');
    const { data, body } = frontMatter(read('content/poems/' + f));
    if (!data.title) errors.push(`${f}: missing "title"`);
    if (!P.LANG[data.language]) errors.push(`${f}: "language" must be english, hindi or urdu`);
    const { stanzas, roman } = parsePoem(body);
    const book = data.book ? books.published.find((b) => b.slug === data.book) || books.forthcoming.find((b) => b.slug === data.book) : null;
    if (data.book && !book) errors.push(`${f}: book "${data.book}" not found in books.json`);
    const forthcoming = !!(book && books.forthcoming.includes(book));
    const all = stanzas.flatMap((s) => s.lines);
    return {
      ...data,
      slug,
      themes: data.themes || [],
      emotions: data.emotions || [],
      stanzas,
      roman,
      firstLine: (all.find((l) => l.trim()) || '').replace(/^["“]/, ''),
      bookTitle: book ? book.title : null,
      bookForthcoming: forthcoming,
      bookYear: book ? book.year : null,
      searchText: normalize([data.title, data.titleRoman, data.form, ...(data.themes || []), ...(data.emotions || []), book && book.title, ...all].join(' ')),
    };
  })
  .sort((a, b) =>
    LANG_ORDER[a.language] - LANG_ORDER[b.language] ||
    (a.bookForthcoming ? 1 : 0) - (b.bookForthcoming ? 1 : 0) ||
    (a.bookOrder || 0) - (b.bookOrder || 0) ||
    (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
    a.slug.localeCompare(b.slug));

for (const b of books.published) {
  for (const s of b.poems) if (!poems.find((p) => p.slug === s)) errors.push(`books.json: "${b.slug}" lists unknown poem "${s}"`);
}
if (errors.length) {
  console.error('Content problems:\n  ' + errors.join('\n  '));
  process.exit(1);
}

const ctx = { site, books, timeline, media, aboutDoc, poems, lyrics };
const pages = [
  P.home(ctx),
  P.about(ctx),
  P.english(ctx),
  P.urduHindi(ctx),
  P.booksIndex(ctx),
  P.collection(ctx),
  P.reels(ctx),
  P.journey(ctx),
  P.contact(ctx),
  P.notFound(ctx),
  ...poems.map((p) => P.poemPage(ctx, p)),
  ...books.forthcoming.filter((b) => b.featured).map((b) => P.forthcomingPage(ctx, b)),
];

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'public'), OUT, { recursive: true });
for (const pg of pages) {
  const file = path.join(OUT, pg.path);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, pg.html);
}

const base = site.url.replace(/\/$/, '');
const urls = pages.filter((p) => p.path !== '404.html').map((p) => base + '/' + p.path.replace(/index\.html$/, ''));
fs.writeFileSync(
  path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`
);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);

console.log(`Built ${pages.length} pages (${poems.length} poems, ${books.published.length + books.forthcoming.length} books) → dist/`);
