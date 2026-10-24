// Collection: instant search + filters over the embedded poem index. State lives in the URL.
(() => {
  const data = JSON.parse(document.getElementById('poem-index').textContent);
  const input = document.getElementById('q');
  const count = document.querySelector('.search-count');
  const empty = document.querySelector('.coll-empty');
  const clear = document.querySelector('.clear-filters');
  const chips = [...document.querySelectorAll('.chip')];
  const items = new Map([...document.querySelectorAll('.coll-item')].map((li) => [li.dataset.slug, li]));
  const titles = new Map([...items].map(([s, li]) => [s, li.querySelector('.ci-title').textContent]));

  const norm = (s) =>
    String(s || '').normalize('NFC').toLowerCase()
      .replace(/़/g, '').replace(/[ँं]/g, 'ं')
      .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();

  const active = () => {
    const f = {};
    chips.filter((c) => c.getAttribute('aria-pressed') === 'true').forEach((c) => (f[c.dataset.group] ||= new Set()).add(c.dataset.value));
    return f;
  };

  const highlight = (el, text, terms) => {
    if (!terms.length) { el.textContent = text; return; }
    const re = new RegExp('(' + terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
    el.innerHTML = text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]).replace(re, '<mark>$1</mark>');
  };

  const run = () => {
    const q = norm(input.value);
    const terms = q ? q.split(' ') : [];
    const f = active();
    let n = 0;
    for (const p of data) {
      const ok =
        terms.every((t) => p.x.includes(t)) &&
        (!f.l || f.l.has(p.l)) &&
        (!f.pub || f.pub.has(String(p.pub))) &&
        (!f.r || f.r.has(String(p.r))) &&
        (!f.th || p.th.some((t) => f.th.has(t))) &&
        (!f.em || p.em.some((t) => f.em.has(t)));
      const li = items.get(p.s);
      if (li.hidden === ok) { li.hidden = !ok; if (ok) { li.classList.remove('is-new'); void li.offsetWidth; li.classList.add('is-new'); } }
      if (ok) { n++; highlight(li.querySelector('.ci-title'), titles.get(p.s), input.value.trim() ? input.value.trim().split(/\s+/) : []); }
    }
    count.textContent = n === data.length ? `${n} poems` : `${n} of ${data.length}`;
    empty.hidden = n > 0;
    clear.hidden = !Object.keys(f).length && !q;
    // keep the URL shareable
    const params = new URLSearchParams();
    if (input.value.trim()) params.set('q', input.value.trim());
    for (const [g, set] of Object.entries(f)) params.set(g, [...set].join(','));
    history.replaceState(null, '', params.toString() ? '?' + params : location.pathname);
  };

  // restore from URL (?q=love&l=urdu)
  const params = new URLSearchParams(location.search);
  input.value = params.get('q') || '';
  chips.forEach((c) => { if ((params.get(c.dataset.group) || '').split(',').includes(c.dataset.value)) c.setAttribute('aria-pressed', 'true'); });

  input.addEventListener('input', run);
  chips.forEach((c) => c.addEventListener('click', () => { c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true')); run(); }));
  const reset = () => { input.value = ''; chips.forEach((c) => c.setAttribute('aria-pressed', 'false')); run(); input.focus(); };
  clear.addEventListener('click', reset);
  document.querySelector('.clear-filters-2').addEventListener('click', reset);
  const onKey = (e) => { if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); } };
  addEventListener('keydown', onKey);
  window.onCleanup && onCleanup(() => removeEventListener('keydown', onKey));
  run();
})();
