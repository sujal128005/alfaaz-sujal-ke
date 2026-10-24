// Page renderers. Each returns { path, html }.
'use strict';
const { esc, sections, inline, devaNum, roman, cap } = require('./lib');
const { page, crumbs } = require('./layout');

const LANG = {
  english: { label: 'English', native: 'English', attr: 'en', mood: 'paper' },
  hindi: { label: 'Hindi', native: 'हिन्दी', attr: 'hi', mood: 'indigo' },
  urdu: { label: 'Urdu', native: 'उर्दू', attr: 'ur-Deva', mood: 'indigo' },
};
const depthPrefix = (path) => '../'.repeat(path.split('/').length - 1);
const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
const hasDeva = (s) => /[\u0900-\u097F]/.test(s || '');

const reviewNote = (site, text) =>
  site.showReviewMarks && text ? `<aside class="review-note" role="note"><strong>For Sujal’s review</strong>${esc(text)}</aside>` : '';

const picture = (R) => `<picture>
  <source type="image/webp" srcset="${R}images/sujal-portrait-480.webp 480w, ${R}images/sujal-portrait-900.webp 900w" sizes="(max-width: 760px) 80vw, 420px">
  <img src="${R}images/sujal-portrait-900.jpg" srcset="${R}images/sujal-portrait-480.jpg 480w, ${R}images/sujal-portrait-900.jpg 900w" sizes="(max-width: 760px) 80vw, 420px" width="900" height="858" alt="Sujal Negi smiling, mountains of Himachal behind him" loading="lazy" decoding="async">
</picture>`;

/* ───────── Reels: turn a public Instagram / Facebook link into an embeddable player ───────── */
function reelInfo(r) {
  if (r.file) return { kind: 'video', label: 'Video', src: r.file, open: null };
  const url = String(r.url || '').trim();
  const ig = url.match(/instagram\.com\/(reel|reels|p|tv)\/([\w-]+)/i);
  if (ig) {
    const type = ig[1].toLowerCase() === 'p' ? 'p' : 'reel';
    return { kind: 'instagram', label: 'Instagram', src: `https://www.instagram.com/${type}/${ig[2]}/embed/`, open: `https://www.instagram.com/${type}/${ig[2]}/` };
  }
  if (/facebook\.com|fb\.watch/i.test(url)) {
    return { kind: 'facebook', label: 'Facebook', src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=400`, open: url };
  }
  return null;
}

function reelCard(R, r) {
  const info = reelInfo(r);
  if (!info) return '';
  const title = r.title || '';
  const poemLink = r.poem ? `<a class="reel-poem" href="${R}poems/${r.poem}/">Read the poem →</a>` : '';
  const credit = r.credit ? (r.creditUrl ? `<a class="reel-credit" href="${esc(r.creditUrl)}" target="_blank" rel="noopener">${esc(r.credit)} ↗</a>` : `<span class="reel-credit">${esc(r.credit)}</span>`) : '';
  const label = r.label ? `<span class="reel-label">${esc(r.label)}</span>` : '';
  if (info.kind === 'video') {
    return `<figure class="reel reel-video reveal"><video controls preload="none" playsinline src="${R}${esc(info.src)}"></video>
      <figcaption><span class="reel-tag">${info.label}</span><span class="reel-title" ${hasDeva(title) ? 'lang="hi"' : ''}>${esc(title)}</span>${poemLink}</figcaption></figure>`;
  }
  // Facebook's player refuses most shared links, so Facebook reels open on Facebook until a video file is added.
  if (info.kind === 'facebook') {
    return `<figure class="reel reel-facebook reveal">
    <a class="reel-play" href="${esc(info.open)}" target="_blank" rel="noopener" aria-label="Watch ${esc(title || 'reel')} on Facebook">
      <span class="reel-face" aria-hidden="true"><span class="reel-icon"></span></span>
      ${label}
      <span class="reel-face-title" ${hasDeva(title) ? 'lang="hi"' : ''}>${esc(title)}</span>
      <span class="reel-hint">Watch on Facebook ↗</span>
    </a>
    <figcaption><span class="reel-tag">${info.label}</span>${poemLink}${credit}</figcaption>
  </figure>`;
  }
  return `<figure class="reel reel-${info.kind}${r.featured ? ' reel-featured' : ''} reveal">
    <button type="button" class="reel-play" data-embed="${esc(info.src)}" aria-label="Play ${esc(title || 'reel')} here">
      <span class="reel-face" aria-hidden="true"><span class="reel-icon"></span></span>
      ${label}
      <span class="reel-face-title" ${hasDeva(title) ? 'lang="hi"' : ''}>${esc(title)}</span>
      <span class="reel-hint">Tap to play here</span>
    </button>
    <figcaption><span class="reel-tag">${info.label}</span>${poemLink}${credit}<a href="${esc(info.open)}" target="_blank" rel="noopener">Open on ${info.label} ↗</a></figcaption>
  </figure>`;
}

/* ───────── Shared bits ───────── */
function poetryTabs(R, poems, active) {
  const n = (f) => poems.filter(f).length;
  const tabs = [
    ['english', 'english/', 'English', n((p) => p.language === 'english')],
    ['urdu-hindi', 'urdu-hindi/', 'Urdu & Hindi', n((p) => p.language !== 'english')],
    ['collection', 'collection/', 'All poems', poems.length],
  ];
  return `<nav class="ptabs" aria-label="Poetry sections">${tabs
    .map(([k, href, label, c]) => `<a href="${R}${href}"${k === active ? ' aria-current="page"' : ''}>${esc(label)}<sup>${c}</sup></a>`)
    .join('')}</nav>`;
}

function entryList(R, poems) {
  return `<ol class="entries">${poems
    .map(
      (p, i) => `<li class="entry reveal">
  <a href="${R}poems/${p.slug}/">
    <span class="entry-num" aria-hidden="true">${p.language === 'english' ? pad(i + 1) : devaNum(pad(i + 1))}</span>
    <span class="entry-main">
      <span class="entry-title" lang="${LANG[p.language].attr}">${esc(p.title)}</span>
      ${p.titleRoman ? `<span class="entry-roman">${esc(p.titleRoman)}</span>` : ''}
      <span class="entry-first" lang="${LANG[p.language].attr}">${esc(p.firstLine)}</span>
    </span>
    <span class="entry-meta">${esc(p.form || '')}${p.bookTitle ? ` · <em>${esc(p.bookTitle)}</em>` : ''}${p.reel ? ' · Reel' : ''}</span>
  </a>
</li>`
    )
    .join('\n')}</ol>`;
}

/* ───────── Home ───────── */
function home(ctx) {
  const { site, poems } = ctx;
  const lines = site.heroLines
    .map((l) => ({ ...l, title: (poems.find((p) => p.slug === l.poem) || {}).title }))
    .filter((l) => l.title);
  const first = lines[0];
  const count = (f) => poems.filter(f).length;
  const doors = [
    ['english/', 'English', `${count((p) => p.language === 'english')} poems`],
    ['urdu-hindi/', 'Urdu & Hindi', `${count((p) => p.language !== 'english')} ग़ज़ल · नज़्म · कविता`],
    ['collection/', 'All Poems', 'search by word or feeling'],
    ['books/', 'Books', 'From Love’s Diary & anthologies'],
    ['reels/', 'Songs & Reels', 'song, film and voice'],
    ['journey/', 'Journey', 'year by year'],
    ['about/', 'About', 'the person behind the words'],
    ['contact/', 'Contact', 'write to me'],
  ];
  const body = `<section class="home">
  <canvas class="ink-field" aria-hidden="true"></canvas>
  <div class="home-center">
    <p class="home-urdu" lang="ur" dir="rtl" aria-hidden="true">${esc(site.penNameUrdu)}</p>
    <h1 class="home-title"><span class="ht ht-1">Alfaaz</span> <span class="ht ht-2">Sujal Ke</span></h1>
    <p class="home-sub">poetry by ${esc(site.name)} · English · <span lang="ur" dir="rtl" class="nastaliq-inline">اردو</span> · हिन्दी</p>
    <figure class="home-line" data-lines="${esc(JSON.stringify(lines.map((l) => ({ t: l.text, p: l.poem, n: l.title, l: l.lang }))))}">
      <blockquote lang="${first.lang}">${esc(first.text).replace(/\n/g, '<br>')}</blockquote>
      <figcaption><a href="poems/${first.poem}/">from <span class="hl-title">${esc(first.title)}</span> →</a></figcaption>
    </figure>
  </div>
  <nav class="home-doors" aria-label="Sections">
    ${doors
      .map(
        ([href, label, hint], i) => `<a class="door" href="${href}" style="--i:${i}">
      <span class="door-num">${devaNum(i + 1)}</span>
      <span class="door-label">${esc(label)}</span>
      <span class="door-hint">${esc(hint)}</span></a>`
      )
      .join('')}
  </nav>
</section>`;
  return {
    path: 'index.html',
    html: page({
      ...ctx, R: '', path: '', mood: 'night', active: 'home', body, scripts: ['home.js'], noFooter: true, bodyClass: 'is-home',
      jsonld: { '@context': 'https://schema.org', '@type': 'Person', name: site.name, alternateName: [site.penName, site.handle], url: site.url, jobTitle: 'Poet and writer', sameAs: [site.links.instagram, site.links.portfolio] },
    }),
  };
}

/* ───────── About ───────── */
function about(ctx) {
  const { site, aboutDoc, poems } = ctx;
  const R = '../';
  const ghazal = poems.find((p) => p.slug === 'khamoshi-ke-dariya-mein');
  const facts = [
    ['Pen name', site.handle],
    ['Writes in', 'Hindi, Urdu and English'],
    ['Roots', 'District Kinnaur, Himachal Pradesh'],
    ['Studying', 'B.Tech, IIIT Kurnool (expected 2027)'],
    ['Off the page', 'Reading, chess, the ukulele'],
  ];
  const body = `<section class="about-hero">
  <div class="about-portrait reveal">${picture(R)}</div>
  <div class="about-intro">
    <p class="kicker">About</p>
    <h1 class="display ink-in">The person<br><em>behind the words</em></h1>
    <div class="lang-switch" role="group" aria-label="Read in">
      <button type="button" data-show="intro-en" aria-pressed="true">English</button>
      <button type="button" data-show="intro-hi" aria-pressed="false" lang="hi">हिन्दी</button>
    </div>
    <p class="lede" id="intro-en">${esc(aboutDoc.data.intro)}</p>
    <p class="lede" id="intro-hi" lang="hi" hidden>${esc(aboutDoc.data.introHindi)}</p>
  </div>
</section>
<section class="facts reveal"><dl>${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>
<section class="letter">
  ${sections(aboutDoc.body)
    .map(
      (s, i) => `<section class="letter-sec reveal">
    <span class="letter-num" aria-hidden="true">${roman(i + 1)}</span>
    <div>${s.title ? `<h2>${esc(s.title)}</h2>` : ''}<div class="prose">${s.html}</div></div>
  </section>`
    )
    .join('\n')}
</section>
${
  ghazal
    ? `<section class="self-ghazal reveal">
  <p class="kicker">“My latest ghazal expresses who I am”</p>
  <blockquote lang="ur-Deva">${ghazal.stanzas.map((s) => s.lines.map(esc).join('<br>')).join('<br><br>')}</blockquote>
  <a class="text-link" href="${R}poems/${ghazal.slug}/">Open this ghazal →</a>
</section>`
    : ''
}
<section class="next-links reveal">
  <a href="${R}journey/"><span>Next</span>The journey, year by year →</a>
  <a href="${R}books/"><span>Also</span>Books & anthologies →</a>
  <a href="${esc(site.links.portfolio)}" target="_blank" rel="noopener"><span>Elsewhere</span>Portfolio ↗</a>
</section>`;
  return { path: 'about/index.html', html: page({ ...ctx, R, path: 'about/', title: 'About', mood: 'paper', active: 'about', body, scripts: ['about.js'] }) };
}

/* ───────── English ───────── */
function english(ctx) {
  const { poems } = ctx;
  const R = '../';
  const list = poems.filter((p) => p.language === 'english' && !p.bookForthcoming);
  const book = ctx.books.forthcoming.find((b) => b.featured);
  const bookPoems = book ? poems.filter((p) => p.book === book.slug) : [];
  const body = `<section class="lang-hero">
  ${poetryTabs(R, poems, 'english')}
  <h1 class="display ink-in"><em>English</em> poems</h1>
  <p class="lede">He began in Hindi; English came later, as an experiment that stayed. Open any poem to read it on its own page.</p>
</section>
<section class="lang-list">${entryList(R, list)}</section>
${bookPoems.length ? `<section class="lang-block" id="book">
  <header class="block-head"><h2 class="h2">From the book <a href="${R}books/${book.slug}/"><em>${esc(book.title)}</em></a> <span class="h2-sub">${bookPoems.length} poems</span></h2></header>
  ${entryList(R, bookPoems)}
</section>` : ''}`;
  return { path: 'english/index.html', html: page({ ...ctx, R, path: 'english/', title: 'English Poetry', mood: 'paper', active: 'english', body }) };
}

/* ───────── Urdu & Hindi ───────── */
function urduHindi(ctx) {
  const { poems } = ctx;
  const R = '../';
  const urdu = poems.filter((p) => p.language === 'urdu');
  const hindi = poems.filter((p) => p.language === 'hindi');
  const devotional = hindi.filter((p) => p.form === 'Bhajan');
  const kavita = hindi.filter((p) => p.form !== 'Bhajan');
  const block = (title, sub, list, id) =>
    list.length
      ? `<section class="lang-block" id="${id}"><header class="block-head"><h2 class="h2" lang="hi">${title} <span class="h2-sub">${sub} · ${list.length}</span></h2></header>${entryList(R, list)}</section>`
      : '';
  const body = `<section class="lang-hero lang-hero-ur">
  <p class="ghost-word" aria-hidden="true"><span lang="ur" dir="rtl">اردو</span><span lang="hi">हिन्दी</span></p>
  ${poetryTabs(R, poems, 'urdu-hindi')}
  <h1 class="display ink-in" lang="ur-Deva">टूटे हुए अल्फ़ाज़ों से<br><em>कहता हूँ अपनी बात</em></h1>
  <p class="hero-cite"><a href="${R}poems/khamoshi-ke-dariya-mein/">from ख़ामोशी के दरिया में</a></p>
  <p class="lede">Ghazals and nazms in Urdu, and kavita, geet and bhajans in Hindi, all in the Devanagari script they were written in.</p>
  <nav class="jump" aria-label="On this page"><a href="#urdu" lang="hi">ग़ज़ल · नज़्म</a><a href="#hindi" lang="hi">कविता · गीत</a>${devotional.length ? '<a href="#bhajan" lang="hi">भजन</a>' : ''}</nav>
</section>
${block('ग़ज़ल · नज़्म', 'Urdu', urdu, 'urdu')}
${block('कविता · गीत', 'Hindi', kavita, 'hindi')}
${block('भजन', 'Devotional', devotional, 'bhajan')}`;
  return { path: 'urdu-hindi/index.html', html: page({ ...ctx, R, path: 'urdu-hindi/', title: 'Urdu & Hindi Poetry', mood: 'indigo', active: 'urdu-hindi', body }) };
}

/* ───────── Single poem ───────── */
function poemPage(ctx, p) {
  const { site, poems } = ctx;
  const path = `poems/${p.slug}/`;
  const R = depthPrefix(path + 'index.html');
  const L = LANG[p.language];
  const section = p.language === 'english' ? ['English', 'english/'] : ['Urdu & Hindi', 'urdu-hindi/'];
  const group = poems.filter((x) => (p.language === 'english' ? x.language === 'english' : x.language !== 'english'));
  const i = group.indexOf(p);
  const prev = group[(i - 1 + group.length) % group.length];
  const next = group[(i + 1) % group.length];
  const stanzaHTML = (stanzas) =>
    stanzas
      .map(
        (s) =>
          `<p class="stanza">${s.mark ? `<span class="stanza-mark" aria-hidden="true">${p.language === 'english' ? s.mark : devaNum(s.mark)}</span>` : ''}${s.lines
            .map((l) => `<span class="line${l.length > 70 ? ' line-long' : ''}">${esc(l) || '&nbsp;'}</span>`)
            .join('<br>')}</p>`
      )
      .join('\n');
  const tags = [...p.themes, ...p.emotions];
  const meta = [p.date ? fmtDate(p.date) : null, p.source].filter(Boolean).join(' · ');
  const body = `<article class="poem poem-${p.language}">
  ${crumbs(R, [['Home', ''], [section[0], section[1]], [p.titleRoman || p.title]])}
  <header class="poem-head">
    <p class="kicker">${esc(p.form || 'Poem')} · ${L.label}${p.language !== 'english' ? ` <span lang="hi">(${L.native})</span>` : ''}</p>
    <h1 class="poem-title ink-in" lang="${L.attr}">${esc(p.title)}</h1>
    ${p.titleRoman ? `<p class="poem-roman">${esc(p.titleRoman)}</p>` : ''}
    ${p.award ? `<p class="award">✦ ${esc(p.award)}</p>` : ''}
    ${p.epigraph ? `<p class="poem-epigraph" lang="${L.attr}">“${esc(p.epigraph.replace(/^["“]|["”]$/g, ''))}”</p>` : ''}
  </header>
  <div class="poem-tools" role="toolbar" aria-label="Reading tools">
    <button type="button" data-size="-1" aria-label="Smaller text">A−</button>
    <button type="button" data-size="1" aria-label="Larger text">A+</button>
    <button type="button" data-focus aria-pressed="false">Focus</button>
    ${p.roman ? `<button type="button" data-roman aria-pressed="false">Roman</button>` : ''}
    <button type="button" data-share data-title="${esc(p.title)}">Share</button>
  </div>
  <div class="poem-body" lang="${L.attr}">
    <div class="poem-orig">${stanzaHTML(p.stanzas)}</div>
    ${p.roman ? `<div class="poem-roman-text" lang="en" hidden>${stanzaHTML(p.roman)}</div>` : ''}
  </div>
  <footer class="poem-foot">
    <p class="signature">${esc(site.name)} <span>(${esc(site.handle)})</span></p>
    ${p.note ? `<p class="poem-note">${inline(p.note)}</p>` : ''}
    ${p.book ? (p.bookForthcoming
      ? `<p class="pub-note">Poem ${p.bookOrder} of 15 in the book <a href="${R}books/${p.book}/"><em>${esc(p.bookTitle)}</em></a></p>`
      : `<p class="pub-note">Published in the anthology <em>${esc(p.bookTitle)}</em>${p.bookYear ? ` (${p.bookYear})` : ''}</p>`) : ''}
    ${meta && !p.bookForthcoming ? `<p class="pub-note">${esc(meta)}</p>` : ''}
    ${p.reel ? `<div class="poem-reel"><p class="kicker">Watch it recited</p>${reelCard(R, { url: p.reel, title: p.reelTitle || p.title })}</div>` : ''}
    ${tags.length ? `<p class="tags">${tags.map((t) => `<a href="${R}collection/?q=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</p>` : ''}
    ${reviewNote(site, p.review)}
    <nav class="poem-nav" aria-label="More poems">
      <a href="${R}poems/${prev.slug}/" rel="prev"><span>← Previous</span><em lang="${LANG[prev.language].attr}">${esc(prev.title)}</em></a>
      <a href="${R}${section[1]}" class="poem-nav-mid">All ${esc(section[0])} poems</a>
      <a href="${R}poems/${next.slug}/" rel="next"><span>Next →</span><em lang="${LANG[next.language].attr}">${esc(next.title)}</em></a>
    </nav>
  </footer>
</article>`;
  return {
    path: path + 'index.html',
    html: page({
      ...ctx, R, path,
      title: p.titleRoman && hasDeva(p.title) ? `${p.title} (${p.titleRoman})` : p.title,
      description: `“${p.firstLine.replace(/[,;:।]+$/, '')}…” A ${(p.form || 'poem').toLowerCase()} by ${site.name} (${site.penName}).`,
      type: 'article', mood: L.mood, active: p.language === 'english' ? 'english' : 'urdu-hindi', body, bodyClass: 'is-poem', scripts: ['poem.js', 'reels.js'],
      jsonld: { '@context': 'https://schema.org', '@type': 'CreativeWork', genre: 'Poetry', name: p.title, alternateName: p.titleRoman || undefined, inLanguage: L.attr, dateCreated: p.date || undefined, author: { '@type': 'Person', name: site.name, alternateName: site.penName } },
    }),
  };
}

/* ───────── Books: a library catalogue of index cards ───────── */
const COVERS = ['#6e2b28', '#2f4a3e', '#3b3a62', '#7a4f24', '#5b2f4f', '#244a5c', '#5e4630', '#3d5a3a', '#4a2a2a', '#4f4675'];

// Anthologies are shown as book covers to look at, not pages to open.
function anthologyCover(R, b, i) {
  return `<li class="acover reveal" style="--c:${COVERS[i % COVERS.length]};--i:${i}">
  ${b.cover
    ? `<img src="${R}${esc(b.cover)}" alt="Cover of ${esc(b.title)}" loading="lazy">`
    : `<div class="ac-face">
    <span class="ac-kind">Anthology</span>
    <span class="ac-title">${esc(b.title)}</span>
    ${b.subtitle ? `<span class="ac-sub">${esc(b.subtitle)}</span>` : ''}
    ${b.titleNative ? `<span class="ac-native" lang="hi">${esc(b.titleNative)}</span>` : ''}
    <span class="ac-orn" aria-hidden="true">✦</span>
    <span class="ac-with">with poems by<br><b>Sujal Negi</b></span>
    <span class="ac-pub">${[b.publisher, b.year ? `${b.month ? b.month + ' ' : ''}${b.year}` : ''].filter(Boolean).map(esc).join(' · ')}</span>
  </div>`}
</li>`;
}

function booksIndex(ctx) {
  const { books, poems } = ctx;
  const R = '../';
  const pubs = [...books.published].sort((a, b) => (a.year || 9999) - (b.year || 9999));
  const feat = books.forthcoming.find((b) => b.featured);
  const others = books.forthcoming.filter((b) => b !== feat);
  const featPoems = feat ? poems.filter((p) => p.book === feat.slug) : [];
  const body = `<section class="books-hero">
  <p class="kicker">Books &amp; Anthologies</p>
  <h1 class="display ink-in">Books</h1>
  <p class="lede">His own book <em>From Love’s Diary</em>, two more on the writing desk, and the anthologies that carry his poems in Hindi and English.</p>
  <nav class="jump" aria-label="On this page"><a href="#own">From Love’s Diary</a><a href="#desk">Writing desk · ${others.length}</a><a href="#anthologies">Anthologies · ${pubs.length}</a></nav>
</section>
${feat ? `<section class="feature-book reveal" id="own">
  <a class="fbk-cover" href="${feat.slug}/" aria-label="Open ${esc(feat.title)}">
    <span class="bc-genre">${esc(feat.genre)}</span><span class="fbk-title">${esc(feat.title)}</span><span class="bc-orn" aria-hidden="true">✦</span><span class="bc-author">${esc(ctx.site.name)}</span>
  </a>
  <div class="fbk-info">
    <p class="kicker">His own book · ${esc(feat.status)}</p>
    <h2 class="fbk-h">${esc(feat.title)}</h2>
    ${feat.dedication ? `<p class="fbk-ded">${esc(feat.dedication)}</p>` : ''}
    <p class="lede">${inline(feat.blurb[0])}</p>
    <p class="fbk-actions"><a class="btn" href="${feat.slug}/">Open the book</a><a class="pill" href="${R}english/#book">Read the ${featPoems.length} poems</a></p>
  </div>
</section>` : ''}
${others.length ? `<section class="desk" id="desk">
  <p class="kicker">On the writing desk</p>
  <h2 class="h2">To be published <em>soon</em></h2>
  <div class="desk-row">
    ${others.map((b, i) => `<div class="manuscript reveal" style="--r:${i % 2 ? 1.6 : -1.4}deg">
      <span class="ms-status">${esc(b.status)}</span>
      <span class="ms-title">${esc(b.title)}</span>
      ${b.subtitle ? `<span class="ms-sub">${esc(b.subtitle)}</span>` : ''}
      <span class="ms-more">Coming soon</span>
    </div>`).join('')}
  </div>
</section>` : ''}
<section class="catalogue" id="anthologies" aria-label="Anthologies">
  <ul class="acovers">${pubs.map((b, i) => anthologyCover(R, b, i)).join('\n')}</ul>
</section>`;
  return { path: 'books/index.html', html: page({ ...ctx, R, path: 'books/', title: 'Books & Anthologies', mood: 'walnut', active: 'books', body }) };
}

// A forthcoming book is read like a real book: a cover that opens, and pages that turn.
function bookPages(site, b, poems) {
  const pages = [];
  const pg = (kind, html) => pages.push({ kind, html });
  pg('cover', `<p class="bc-genre">${esc(b.genre)}</p><h2 class="bc-title">${esc(b.title)}</h2>${b.subtitle ? `<p class="bc-sub">${esc(b.subtitle)}</p>` : ''}<span class="bc-orn" aria-hidden="true">✦</span><p class="bc-author">${esc(site.name)}</p><p class="bc-handle">${esc(site.handle)}</p>`);
  if (b.dedication) pg('center', `<p class="bp-small">Dedicated</p><p class="bp-dedication">${esc(b.dedication)}</p>`);
  if (b.epigraph) pg('center', `<p class="bp-epigraph">“${esc(b.epigraph)}”</p>`);
  const blurb = b.blurb.map((x) => `<p>${inline(x)}</p>`);
  if (blurb.length > 2) {
    pg('text', `<h3 class="bp-h">About this book</h3>${blurb.slice(0, 2).join('')}`);
    pg('text', blurb.slice(2).join(''));
  } else pg('text', `<h3 class="bp-h">About the poems</h3>${blurb.join('')}`);
  const PER = 11;
  b.parts.forEach((part, pi) => {
    for (let k = 0; k < part.chapters.length; k += PER) {
      const head = k === 0
        ? `${b.parts.length > 1 ? `<p class="bp-small">Part ${roman(pi + 1).toUpperCase()}</p>` : ''}<h3 class="bp-h">${esc(part.title)}</h3>${part.suggested && site.showReviewMarks ? '<p class="bp-flag">Suggested titles, awaiting the author’s approval</p>' : ''}`
        : `<p class="bp-small">${esc(part.title)}, continued</p>`;
      pg('contents', `${head}<ol class="bp-toc" start="${k + 1}">${part.chapters.slice(k, k + PER).map((c, ci) => {
        const slug = b.poems && b.poems[k + ci];
        return `<li><span>${roman(k + ci + 1)}.</span>${slug ? `<a href="../../poems/${slug}/">${esc(c)}</a>` : esc(c)}</li>`;
      }).join('')}</ol>`);
    }
  });
  const LINES = 8;
  (b.poems || []).map((slug) => poems.find((p) => p.slug === slug)).filter(Boolean).forEach((p, n) => {
    const lines = p.stanzas.flatMap((st) => st.lines);
    for (let k = 0; k < lines.length; k += LINES) {
      const head = k === 0
        ? `<p class="bp-small">${roman(n + 1).toUpperCase()}</p><h3 class="bp-poem-title"><a href="../../poems/${p.slug}/">${esc(p.title)}</a></h3>`
        : `<p class="bp-small">${esc(p.title)}, continued</p>`;
      pg('poem', `${head}<p class="bp-lines">${lines.slice(k, k + LINES).map(esc).join('<br>')}</p>`);
    }
  });
  (b.excerpts || []).forEach((e) => {
    const n = b.parts[0].chapters.indexOf(e.from) + 1;
    pg('excerpt', `<p class="bp-small">${n ? roman(n).toUpperCase() : ''}</p><h3 class="bp-poem-title">${esc(e.from)}</h3><p class="bp-lines">${e.lines.map(esc).join('<br>')}</p><p class="bp-more">· · ·<br>the poem continues in the book</p>`);
  });
  pg('center', b.poems
    ? `<p class="bp-end">Thank you for reading.</p><p class="bp-small">${esc(b.status)}</p>`
    : `<p class="bp-end">The rest of these pages are waiting for the printed book.</p><p class="bp-small">${esc(b.status)}</p>`);
  if (pages.length % 2 === 0) pg('blank', ''); // with the back cover, the total must be even
  pg('back', `<p class="bc-handle" lang="ur" dir="rtl">${esc(site.penNameUrdu)}</p><p class="bc-sub">${esc(b.title)}</p><p class="bc-author">${esc(site.name)}</p>`);
  return pages;
}

function forthcomingPage(ctx, b) {
  const { site } = ctx;
  const path = `books/${b.slug}/`;
  const R = '../../';
  const pages = bookPages(site, b, ctx.poems);
  const list = (b.poems || []).map((slug) => ctx.poems.find((p) => p.slug === slug)).filter(Boolean);
  const body = `<article class="ms-page">
  ${crumbs(R, [['Home', ''], ['Books', 'books/'], [b.title]])}
  <header class="ms-head">
    <p class="kicker">${esc(b.genre)} · ${esc(b.status)}</p>
    <h1 class="display ink-in">${esc(b.title)}</h1>
  </header>
  <div class="reader">
    <div class="bpages" data-flipbook aria-label="${esc(b.title)}, a preview you can page through">
      ${pages.map((p, i) => `<section class="bpage bpage-${p.kind}"><div class="bp-inner">${p.html}</div>${p.kind === 'cover' || p.kind === 'back' || p.kind === 'blank' ? '' : `<span class="bp-no">${i}</span>`}</section>`).join('\n      ')}
    </div>
    <div class="reader-bar" hidden>
      <button type="button" class="rb-prev" aria-label="Previous page">←</button>
      <span class="rb-status" aria-live="polite">Tap the cover to open</span>
      <button type="button" class="rb-next" aria-label="Next page">→</button>
    </div>
    <p class="reader-hint muted small" hidden>Click a page, use the ← → keys, or swipe to turn the pages.</p>
  </div>
  ${list.length
    ? `<section class="book-poem-list"><h2 class="h2">All ${list.length} poems</h2><ol>${list.map((p) => `<li><a href="${R}poems/${p.slug}/">${esc(p.title)}</a></li>`).join('')}</ol></section>`
    : `<p class="ms-withheld">This is a preview. The full book is not published online. <a href="${R}contact/">Publishers and readers can write here →</a></p>`}
  ${reviewNote(site, b.review)}
</article>`;
  return { path: path + 'index.html', html: page({ ...ctx, R, path, title: b.title, description: `${b.title}, a forthcoming poetry book by ${site.name}. ${b.blurb[0]}`, mood: 'walnut', active: 'books', body, bodyClass: 'is-reader', scripts: ['flipbook.js'] }) };
}

/* ───────── Collection (all poems) ───────── */
function collection(ctx) {
  const { poems } = ctx;
  const R = '../';
  const count = (key) => {
    const m = new Map();
    poems.forEach((p) => (p[key] || []).forEach((t) => m.set(t, (m.get(t) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  };
  const chip = (group, value, label, n) =>
    `<button type="button" class="chip" data-group="${group}" data-value="${esc(value)}" aria-pressed="false">${esc(label)}${n ? `<sup>${n}</sup>` : ''}</button>`;
  const top = (list, n) => list.slice(0, n);
  const index = poems.map((p) => ({ s: p.slug, l: p.language, th: p.themes, em: p.emotions, pub: p.book && !p.bookForthcoming ? 1 : 0, r: p.reel ? 1 : 0, x: p.searchText }));
  const themes = count('themes');
  const emotions = count('emotions');
  const body = `<section class="coll-hero">
  ${poetryTabs(R, poems, 'collection')}
  <h1 class="display ink-in">All poems</h1>
  <div class="search">
    <label for="q" class="sr-only">Search poems</label>
    <input id="q" type="search" placeholder="Search a word, a line, a feeling…  (इश्क़, maa, hope)" autocomplete="off" spellcheck="false">
    <output class="search-count" for="q" aria-live="polite">${poems.length} poems</output>
  </div>
  <div class="filters" role="group" aria-label="Filters">
    <div class="filter-row"><span class="filter-label">Language</span>${['english', 'urdu', 'hindi'].map((l) => chip('l', l, LANG[l].label)).join('')}${chip('pub', '1', 'In an anthology')}${chip('r', '1', 'Has a reel')}</div>
    <div class="filter-row"><span class="filter-label">Theme</span>${top(themes, 14).map(([t, n]) => chip('th', t, cap(t), n)).join('')}</div>
    <details class="more-filters"><summary>More themes and feelings</summary>
      <div class="filter-row">${themes.slice(14).map(([t, n]) => chip('th', t, cap(t), n)).join('')}</div>
      <div class="filter-row"><span class="filter-label">Feeling</span>${emotions.map(([t, n]) => chip('em', t, cap(t), n)).join('')}</div>
    </details>
    <button type="button" class="clear-filters" hidden>Clear all</button>
  </div>
</section>
<section class="coll-results">
  <ol class="coll-list">
  ${poems
    .map(
      (p) => `<li class="coll-item" data-slug="${p.slug}"><a href="${R}poems/${p.slug}/">
      <span class="ci-title" lang="${LANG[p.language].attr}">${esc(p.title)}</span>
      <span class="ci-first" lang="${LANG[p.language].attr}">${esc(p.firstLine)}</span>
      <span class="ci-meta">${LANG[p.language].label} · ${esc(p.form || '')}${p.bookTitle ? ` · ${esc(p.bookTitle)}` : ''}${p.reel ? ' · Reel' : ''}</span>
    </a></li>`
    )
    .join('\n')}
  </ol>
  <p class="coll-empty" hidden>No poem matches that yet. Try another word, or <button type="button" class="link-btn clear-filters-2">clear the filters</button>.</p>
</section>
<script type="application/json" id="poem-index">${JSON.stringify(index).replace(/</g, '\\u003c')}</script>`;
  return { path: 'collection/index.html', html: page({ ...ctx, R, path: 'collection/', title: 'All Poems', description: 'Search and filter every poem by Sujal Negi by language, theme and feeling.', mood: 'paper', active: 'collection', body, scripts: ['collection.js'] }) };
}

/* ───────── Lyrics: "[Section]" headers, blank-line separated ───────── */
function lyricsHTML(text, lang) {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split('\n');
      const head = lines[0].match(/^\[(.+)\]$/);
      if (head) lines.shift();
      return `<p class="ly-block" lang="${lang}">${head ? `<span class="ly-head">${esc(head[1])}</span>` : ''}${lines.map(esc).join('<br>')}</p>`;
    })
    .join('');
}

/* ───────── Reels & songs ───────── */
function reels(ctx) {
  const { site, media, poems, lyrics } = ctx;
  const R = '../';
  const all = [
    ...media.reels,
    ...poems.filter((p) => p.reel && !media.reels.some((r) => r.url === p.reel)).map((p) => ({ url: p.reel, title: p.title, poem: p.slug })),
  ].filter(reelInfo);
  const reelsHTML = all.length
    ? `<div class="reel-grid">${all.map((r) => reelCard(R, r)).join('')}</div>
       <p class="more-on"><a href="${esc(site.links.instagram)}" target="_blank" rel="noopener">More on Instagram ↗</a></p>`
    : `<p class="muted">Reels will appear here. <a href="${esc(site.links.instagram)}" target="_blank" rel="noopener">Watch on Instagram ↗</a></p>`;
  const body = `<section class="reels-hero">
  <div class="wave" aria-hidden="true">${Array.from({ length: 48 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
  <p class="kicker">Songs, Films &amp; Reels</p>
  <h1 class="display ink-in">When the words <em>find a voice</em></h1>
  <div class="media-tabs" role="tablist" aria-label="Choose">
    <a role="tab" href="#songs" data-tab="songs" aria-selected="true">Songs <sup>${media.songs.length}</sup></a>
    <a role="tab" href="#films" data-tab="films" aria-selected="false">Films <sup>${media.films.length}</sup></a>
    <a role="tab" href="#reels" data-tab="reels" aria-selected="false">Reels <sup>${all.length}</sup></a>
  </div>
</section>
<section class="reels-sec" id="songs" role="tabpanel">
  <h2 class="h2">Songs</h2>
  <div class="songs">
  ${media.songs
    .map((s) => {
      const ly = s.lyrics && lyrics[s.lyrics];
      return `<div class="player reveal">
    <button type="button" class="pl-btn" aria-label="Play ${esc(s.title)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="i-play" d="M8 5v14l11-7z"/><path class="i-pause" d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg></button>
    <div class="pl-main">
      <p class="pl-title">${esc(s.title)}</p>
      <p class="pl-credit">${esc(s.credit)}</p>
      <div class="pl-bar"><input type="range" min="0" max="1000" value="0" aria-label="Seek ${esc(s.title)}"><span class="pl-time">0:00 / ${esc(s.duration || '')}</span></div>
    </div>
    <audio preload="none" src="${R}${esc(s.file)}"></audio>
    ${
      ly
        ? `<details class="lyrics"><summary>Lyrics</summary>
      ${ly.en ? `<div class="lang-switch" role="group" aria-label="Lyrics language"><button type="button" data-show="ly-${s.slug}-o" aria-pressed="true">Original</button><button type="button" data-show="ly-${s.slug}-en" aria-pressed="false">English translation</button></div>` : ''}
      <div class="ly" id="ly-${s.slug}-o">${lyricsHTML(ly.original, 'hi-Latn')}</div>
      ${ly.en ? `<div class="ly" id="ly-${s.slug}-en" hidden>${lyricsHTML(ly.en, 'en')}</div>` : ''}
    </details>`
        : ''
    }
    ${reviewNote(site, s.review)}
  </div>`;
    })
    .join('\n')}
  </div>
</section>
<section class="reels-sec" id="films" role="tabpanel">
  <h2 class="h2">Films &amp; drama</h2>
  <div class="films">
  ${media.films
    .map(
      (f) => `<figure class="film reveal">
    <button type="button" class="yt" data-yt="${esc(f.youtubeId)}" aria-label="Play ${esc(f.title)} here">
      <img src="https://i.ytimg.com/vi/${esc(f.youtubeId)}/hqdefault.jpg" alt="" loading="lazy" decoding="async" width="480" height="360">
      <span class="yt-play" aria-hidden="true"></span>
    </button>
    <figcaption><span class="film-kind">${esc(f.kind)}</span><span class="film-title">${esc(f.title)}</span><span class="film-role">${esc(f.role)}</span>
      <a href="https://youtu.be/${esc(f.youtubeId)}" target="_blank" rel="noopener">Open on YouTube ↗</a></figcaption>
  </figure>`
    )
    .join('\n')}
  </div>
</section>
<section class="reels-sec" id="reels" role="tabpanel">
  <h2 class="h2">Spoken poetry reels</h2>
  ${reelsHTML}
</section>`;
  return { path: 'reels/index.html', html: page({ ...ctx, R, path: 'reels/', title: 'Songs, Films & Reels', mood: 'cinema', active: 'reels', body, scripts: ['reels.js', 'about.js'] }) };
}

/* ───────── Journey ───────── */
function journey(ctx) {
  const { timeline, poems } = ctx;
  const R = '../';
  // Poems with a date join the timeline automatically.
  const shared = poems
    .filter((p) => p.date)
    .map((p) => ({ year: Number(p.date.slice(0, 4)), date: p.date, kind: 'poem', title: p.title, detail: p.source || '', link: `poems/${p.slug}/` }));
  const entries = [...timeline.entries, ...shared];
  const groups = new Map();
  for (const e of entries) {
    const k = e.kind === 'beginning' ? 'beginning' : e.year === null ? 'undated' : String(e.year);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(e);
  }
  const order = (k) => (k === 'beginning' ? -1 : k === 'undated' ? 9998 : k === 'soon' ? 9999 : Number(k));
  const KIND = { beginning: 'Beginning', recognition: 'Recognition', book: 'Anthology', screen: 'Screen', music: 'Song', study: 'Study', forthcoming: 'Forthcoming', poem: 'Poem shared' };
  const heading = { beginning: 'The beginning', undated: 'Along the way', soon: 'Next' };
  const keys = [...groups.keys()].sort((a, b) => order(a) - order(b));
  const body = `<section class="journey-hero">
  <p class="kicker">Journey</p>
  <h1 class="display ink-in">A life, like <em>a reel of thread</em></h1>
  <blockquote class="journey-epi" lang="hi">ये जीवन यारों,<br>रील का धागा है<cite><a href="${R}poems/ye-jeevan/">ये जीवन</a></cite></blockquote>
  <nav class="jump years" aria-label="Years">${keys.map((k) => `<a href="#y-${k}">${heading[k] || k}</a>`).join('')}</nav>
</section>
<section class="thread">
  <div class="thread-line" aria-hidden="true"><span></span></div>
  ${keys
    .map(
      (k) => `<section class="thread-year" id="y-${k}">
    <h2 class="year">${heading[k] || esc(k)}</h2>
    ${k === 'undated' ? '<p class="muted small year-note">Years for these are still to be added.</p>' : ''}
    <ol>
    ${groups
      .get(k)
      .sort((a, b) => (a.date || a.sort || '').localeCompare(b.date || b.sort || '') || (a.order || 0) - (b.order || 0))
      .map(
        (e) => `<li class="knot reveal knot-${e.kind}">
      <span class="knot-kind">${KIND[e.kind] || ''}${e.date ? ` · ${fmtDate(e.date)}` : e.label ? ` · ${esc(e.label)}` : ''}</span>
      <h3 ${hasDeva(e.title) ? 'lang="hi"' : ''}>${e.link ? `<a href="${R}${e.link}">${esc(e.title)}</a>` : esc(e.title)}</h3>
      ${e.detail ? `<p>${esc(e.detail)}</p>` : ''}
    </li>`
      )
      .join('')}
    </ol>
  </section>`
    )
    .join('\n')}
</section>`;
  return { path: 'journey/index.html', html: page({ ...ctx, R, path: 'journey/', title: 'Journey', description: 'A timeline of Sujal Negi’s writing life: anthologies, recognitions, poems, songs and films.', mood: 'dusk', active: 'journey', body, scripts: ['journey.js'] }) };
}

/* ───────── Contact ───────── */
function contact(ctx) {
  const { site } = ctx;
  const R = '../';
  const body = `<section class="contact">
  <div class="contact-intro">
    <p class="kicker">Contact</p>
    <h1 class="display ink-in">Write to me</h1>
    <p class="lede">Readers, fellow writers, publishers and collaborators: a letter is always welcome.</p>
    <ul class="contact-links">
      <li><a href="${esc(site.links.instagram)}" target="_blank" rel="noopener"><span>Instagram</span><em>@sujal128005 ↗</em></a></li>
      <li><a href="${esc(site.links.portfolio)}" target="_blank" rel="noopener"><span>Portfolio</span><em>sujalnegi.tech ↗</em></a></li>
    </ul>
  </div>
  <form class="letter-form" data-key="${esc(site.web3formsKey || '')}" data-email="${esc(site.contactEmail || '')}" data-instagram="${esc(site.links.instagram)}" novalidate>
    <input type="checkbox" name="botcheck" class="sr-only" tabindex="-1" autocomplete="off" aria-hidden="true">
    <p class="lf-salute">Dear Sujal,</p>
    <label>I am
      <select name="who"><option>a reader</option><option>a fellow writer</option><option>a publisher</option><option>a collaborator</option><option>someone else</option></select>
    </label>
    <label>My name is <input name="name" required autocomplete="name" placeholder="your name"></label>
    <label>and you can reach me at <input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label>
    <label class="lf-msg"><span class="sr-only">Message</span><textarea name="message" required rows="6" placeholder="Your words…"></textarea></label>
    <div class="lf-actions"><button class="btn" type="submit">Send the letter</button><span class="lf-status" role="status"></span></div>
  </form>
</section>`;
  return { path: 'contact/index.html', html: page({ ...ctx, R, path: 'contact/', title: 'Contact', mood: 'dawn', active: 'contact', body, scripts: ['contact.js'] }) };
}

function notFound(ctx) {
  // Served from any depth, so links are root-absolute here.
  const body = `<section class="nf"><p class="kicker">404</p><h1 class="display">This page<br><em>was never written.</em></h1><p class="lede">Perhaps it is still a thought. <a href="/">Return home →</a></p></section>`;
  return { path: '404.html', html: page({ ...ctx, R: '/', path: '404.html', title: 'Not found', mood: 'night', active: '', body, noFooter: true }) };
}

module.exports = { home, about, english, urduHindi, poemPage, booksIndex, forthcomingPage, collection, reels, journey, contact, notFound, LANG };
