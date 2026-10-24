// The shared page shell: <head> with metadata, header navigation, mobile tab bar, menu and footer.
'use strict';
const { esc } = require('./lib');

// Main sections, in the order they appear everywhere.
const NAV = [
  { key: 'english', href: 'english/', label: 'English' },
  { key: 'urdu-hindi', href: 'urdu-hindi/', label: 'Urdu & Hindi' },
  { key: 'collection', href: 'collection/', label: 'All Poems' },
  { key: 'books', href: 'books/', label: 'Books' },
  { key: 'reels', href: 'reels/', label: 'Songs & Reels' },
  { key: 'journey', href: 'journey/', label: 'Journey' },
  { key: 'about', href: 'about/', label: 'About' },
  { key: 'contact', href: 'contact/', label: 'Contact' },
];

// The full menu, grouped so it is easy to scan.
const GROUPS = [
  { title: 'Poetry', items: [['english/', 'English poems'], ['urdu-hindi/', 'Urdu & Hindi poems'], ['collection/', 'All poems, with search']] },
  { title: 'Work', items: [['books/', 'Books & anthologies'], ['books/from-loves-diary/', 'From Love’s Diary'], ['reels/', 'Songs, films & reels'], ['journey/', 'Journey (timeline)']] },
  { title: 'Me', items: [['about/', 'About me'], ['contact/', 'Contact']] },
];

const ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/>',
  poems: '<path d="M6 3.5h9l3.5 3.5v13.5H6z"/><path d="M9 10h6M9 13.5h6M9 17h4"/>',
  books: '<path d="M4.5 4.5h4v15h-4zM8.5 4.5h4v15h-4z"/><path d="m13.5 5.2 3.8-1 3.9 14.6-3.8 1z"/>',
  reels: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="m10.5 9.2 4.5 2.8-4.5 2.8z"/>',
  more: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

const FONTS =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Tiro+Devanagari+Hindi:ital@0;1&family=Inter:wght@400;500&display=swap';

function head({ site, title, description, path, R, image, type = 'website', jsonld }) {
  const full = title ? `${title} | ${site.penName}` : `${site.penName} | Poetry by ${site.name}`;
  const url = site.url.replace(/\/$/, '') + '/' + path;
  const img = site.url.replace(/\/$/, '') + '/' + (image || 'images/og-default.jpg');
  const desc = description || site.description;
  const urduFont = `https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap&text=${encodeURIComponent(site.penNameUrdu + 'اردو')}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="${esc(site.name)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:site_name" content="${esc(site.penName)}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(full)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<meta name="theme-color" content="#0e0d12">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="${urduFont}">
<link rel="stylesheet" href="${R}css/style.css">
<script>document.documentElement.classList.add('js')</script>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>`;
}

function header({ site, R, active }) {
  const home = R || './';
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <a class="brand" href="${home}" aria-label="${esc(site.penName)}, home" title="Home">
    <span class="brand-ur" lang="ur" dir="rtl">${esc(site.penNameUrdu.split(' ')[0])}</span>
    <span class="brand-en">alfaaz<em>sujal</em>ke</span>
  </a>
  <nav class="top-nav" aria-label="Main">
    <a class="nav-home" href="${home}"${active === 'home' ? ' aria-current="page"' : ''}>${icon('home')}Home</a>
    ${NAV.map((n) => `<a href="${R}${n.href}"${n.key === active ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`).join('')}
  </nav>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu">
    <span class="menu-word">Menu</span><span class="menu-lines" aria-hidden="true"><i></i><i></i></span>
  </button>
</header>
<nav id="menu" class="menu" aria-label="All pages" hidden>
  <div class="menu-inner">
    <a class="menu-home" href="${home}">${esc(site.penName)} <span>Home</span></a>
    <div class="menu-groups">
      ${GROUPS.map(
        (g) => `<section>
        <h2>${g.title}</h2>
        <ul>${g.items.map(([href, label]) => `<li><a href="${R}${href}"${href.startsWith(active + '/') ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`).join('')}</ul>
      </section>`
      ).join('')}
    </div>
    <p class="menu-foot"><a href="${esc(site.links.instagram)}" rel="noopener" target="_blank">Instagram ↗</a><a href="${esc(site.links.portfolio)}" rel="noopener" target="_blank">Portfolio ↗</a></p>
  </div>
</nav>
<nav class="tabbar" aria-label="Quick">
  <a href="${home}"${active === 'home' ? ' aria-current="page"' : ''}>${icon('home')}<span>Home</span></a>
  <a href="${R}collection/"${['collection', 'english', 'urdu-hindi'].includes(active) ? ' aria-current="page"' : ''}>${icon('poems')}<span>Poems</span></a>
  <a href="${R}books/"${active === 'books' ? ' aria-current="page"' : ''}>${icon('books')}<span>Books</span></a>
  <a href="${R}reels/"${active === 'reels' ? ' aria-current="page"' : ''}>${icon('reels')}<span>Reels</span></a>
  <button type="button" class="tab-more" aria-controls="menu" aria-expanded="false">${icon('more')}<span>More</span></button>
</nav>`;
}

function footer({ site, R }) {
  return `<footer class="site-foot">
  <div class="foot-groups">
    ${GROUPS.map((g) => `<div><h2>${g.title}</h2>${g.items.map(([href, label]) => `<a href="${R}${href}">${esc(label)}</a>`).join('')}</div>`).join('')}
    <div><h2>Elsewhere</h2><a href="${esc(site.links.instagram)}" rel="noopener" target="_blank">Instagram ↗</a><a href="${esc(site.links.portfolio)}" rel="noopener" target="_blank">Portfolio ↗</a></div>
  </div>
  <p class="foot-meta">© ${new Date().getFullYear()} ${esc(site.name)} (${esc(site.handle)}). All poems are the author's own and may not be reproduced without permission.</p>
</footer>`;
}

// Breadcrumb trail: [[label, href], ..., [current label]]
function crumbs(R, trail) {
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${trail
    .map(([label, href], i) =>
      i === trail.length - 1 ? `<li aria-current="page">${esc(label)}</li>` : `<li><a href="${R}${href}">${esc(label)}</a></li>`
    )
    .join('')}</ol></nav>`;
}

// mood: night | paper | indigo | walnut | cinema | dusk | dawn
function page(opts) {
  const { mood, body, scripts = [], active, bodyClass = '' } = opts;
  return `${head(opts)}
<body data-mood="${mood}" class="${bodyClass}">
<div class="veil" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>
${header({ ...opts, active })}
<main id="main">
${body}
</main>
${opts.noFooter ? '' : footer(opts)}
<button class="music-btn" type="button" aria-pressed="false" aria-label="Play soft background music" title="Soft library music"><span class="mb-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="mb-label">Music</span></button>
<p class="music-hint" aria-hidden="true">Soft music while you read?</p>
<div class="toast" role="status" aria-live="polite"></div>
<script src="${opts.R}js/main.js" defer></script>
<script src="${opts.R}js/music.js" defer></script>
${scripts.map((s) => `<script src="${opts.R}js/${s}" defer></script>`).join('\n')}
</body>
</html>
`;
}

module.exports = { page, crumbs, NAV };
