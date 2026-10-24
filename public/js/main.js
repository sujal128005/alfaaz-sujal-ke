// Shared behaviour: menu, scroll reveals, toast, and page changes without a full reload
// (so the background music keeps playing from page to page).
(() => {
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Page scripts register teardown work here; it runs before the next page is shown. */
  let cleanups = [];
  window.onCleanup = (fn) => cleanups.push(fn);

  /* Menu (delegated, because the header is replaced on each page change) */
  const menu = () => document.getElementById('menu');
  const setMenu = (open) => {
    const m = menu();
    body.classList.toggle('menu-open', open);
    document.querySelectorAll('.menu-btn, .tab-more').forEach((b) => b.setAttribute('aria-expanded', String(open)));
    const word = document.querySelector('.menu-word');
    if (word) word.textContent = open ? 'Close' : 'Menu';
    if (open) {
      m.hidden = false;
      m.querySelectorAll('li').forEach((li, i) => li.style.setProperty('--d', (0.15 + i * 0.04).toFixed(3)));
      setTimeout(() => (m.querySelector('[aria-current]') || m.querySelector('a')).focus({ preventScroll: true }), 300);
    } else {
      setTimeout(() => { if (!body.classList.contains('menu-open')) m.hidden = true; }, 700);
    }
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('.menu-btn, .tab-more')) setMenu(!body.classList.contains('menu-open'));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && body.classList.contains('menu-open')) { setMenu(false); (document.querySelector('.menu-btn') || body).focus(); }
  });

  /* Header backdrop once the page scrolls */
  const onScroll = () => body.classList.toggle('is-scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true });

  /* Scroll reveals for whatever is on the page now */
  function reveals() {
    const items = document.querySelectorAll('.reveal:not(.is-in)');
    if ('IntersectionObserver' in window && !reduced) {
      const io = new IntersectionObserver(
        (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }),
        { rootMargin: '0px 0px -8% 0px' }
      );
      items.forEach((el) => io.observe(el));
      window.onCleanup(() => io.disconnect());
    } else items.forEach((el) => el.classList.add('is-in'));
    onScroll();
  }

  /* Toast, shared by other scripts */
  let t;
  window.toast = (msg) => {
    const toast = document.querySelector('.toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(t);
    t = setTimeout(() => toast.classList.remove('is-on'), 2200);
  };

  /* ───── Page changes without reloading ───── */
  const SHARED = ['main.js', 'music.js'];
  const isPage = (url) => url.origin === location.origin && (/\/$/.test(url.pathname) || /\.html$/.test(url.pathname));

  async function go(href, push) {
    const url = new URL(href, location.href);
    body.classList.add('is-leaving');
    const wait = new Promise((r) => setTimeout(r, reduced ? 0 : 430));
    let doc;
    try {
      const res = await fetch(url.href, { headers: { Accept: 'text/html' } });
      if (!res.ok && res.status !== 404) throw new Error(res.status);
      doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    } catch {
      location.href = url.href; // fall back to a normal page load
      return;
    }
    await wait;

    // tear down the old page
    cleanups.forEach((fn) => { try { fn(); } catch {} });
    cleanups = [];
    if (window.ambient && window.ambient.duck) window.ambient.duck(false);
    if (push) history.pushState({}, '', url.href);

    // swap head details
    document.title = doc.title;
    for (const sel of ['meta[name="description"]', 'link[rel="canonical"]', 'meta[property="og:title"]', 'meta[property="og:url"]']) {
      const a = document.head.querySelector(sel), b = doc.head.querySelector(sel);
      if (a && b) a.replaceWith(b.cloneNode(true));
    }

    // swap the page itself; the music button and its hint stay untouched
    body.dataset.mood = doc.body.dataset.mood;
    body.className = doc.body.className;
    for (const sel of ['.site-head', '#menu', '.tabbar', 'main', '.site-foot']) {
      const a = document.querySelector(sel), b = doc.querySelector(sel);
      if (a && b) a.replaceWith(document.importNode(b, true));
      else if (a && !b) a.remove();
      else if (!a && b) document.querySelector('main').after(document.importNode(b, true));
    }
    const veil = document.querySelector('.veil');
    veil.replaceWith(veil.cloneNode()); // replay the arrival animation

    // scroll: to the anchor if there is one, else the top
    const target = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (target) target.scrollIntoView(); else scrollTo(0, 0);

    // run this page's own scripts
    const scripts = [...doc.querySelectorAll('body script[src]')].map((s) => new URL(s.getAttribute('src'), url.href).href).filter((s) => !SHARED.some((n) => s.endsWith('/js/' + n)));
    for (const src of scripts) {
      await new Promise((r) => { const s = document.createElement('script'); s.src = src; s.onload = s.onerror = r; document.body.appendChild(s); });
    }
    document.querySelectorAll('body > script[src]').forEach((s) => { if (!SHARED.some((n) => s.src.endsWith('/js/' + n))) s.remove(); });
    reveals();
    const h1 = document.querySelector('main h1');
    if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (!isPage(url)) return;
    if (url.pathname === location.pathname && url.search === location.search) { if (body.classList.contains('menu-open')) setMenu(false); return; } // same page / anchor
    e.preventDefault();
    body.style.setProperty('--vx', e.clientX + 'px');
    body.style.setProperty('--vy', e.clientY + 'px');
    go(url.href, true);
  });
  addEventListener('popstate', () => go(location.href, false));
  addEventListener('pageshow', (e) => { if (e.persisted) body.classList.remove('is-leaving', 'menu-open'); });

  reveals();
})();
