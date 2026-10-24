// Forthcoming books: a cover that opens and pages that turn.
// Two-page spreads on wide screens, single pages on phones. Without JS the pages simply stack.
(() => {
  const src = document.querySelector('[data-flipbook]');
  if (!src) return;
  const pages = [...src.children];
  const bar = document.querySelector('.reader-bar');
  const hint = document.querySelector('.reader-hint');
  const status = bar.querySelector('.rb-status');
  const prevBtn = bar.querySelector('.rb-prev');
  const nextBtn = bar.querySelector('.rb-next');
  const mq = matchMedia('(max-width: 760px)');
  let book, leaves = [], idx = 0, single, cur = 0;

  const max = () => (single ? leaves.length - 1 : leaves.length);

  function build() {
    single = mq.matches;
    if (book) book.remove();
    book = document.createElement('div');
    book.className = 'fb ' + (single ? 'fb-single' : 'fb-double');
    book.setAttribute('role', 'region');
    book.setAttribute('aria-label', src.getAttribute('aria-label'));
    leaves = [];
    const step = single ? 1 : 2;
    for (let i = 0; i < pages.length; i += step) {
      const leaf = document.createElement('div');
      leaf.className = 'leaf';
      const front = document.createElement('div');
      front.className = 'face front';
      front.appendChild(pages[i].cloneNode(true));
      const back = document.createElement('div');
      back.className = 'face back';
      if (!single && pages[i + 1]) back.appendChild(pages[i + 1].cloneNode(true));
      leaf.append(front, back);
      book.appendChild(leaf);
      leaves.push(leaf);
    }
    src.hidden = true;
    src.after(book);
    idx = Math.min(single ? cur : Math.round(cur / 2), max());
    render(false);
    book.addEventListener('click', onClick);
    book.addEventListener('touchstart', (e) => (sx = e.touches[0].clientX), { passive: true });
    book.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    });
  }
  let sx = 0;

  function render(animate, moving) {
    leaves.forEach((l, i) => {
      const flipped = i < idx;
      l.classList.toggle('flipped', flipped);
      l.style.zIndex = i === moving ? leaves.length + 5 : flipped ? i + 1 : leaves.length - i;
    });
    if (moving !== undefined) setTimeout(() => render(false), 950);
    book.classList.toggle('at-start', idx === 0);
    book.classList.toggle('at-end', !single && idx === leaves.length);
    cur = single ? idx : idx * 2;
    const total = pages.length;
    status.textContent =
      idx === 0 ? 'Tap the cover to open'
      : idx === max() ? 'The end'
      : single ? `Page ${idx + 1} of ${total}`
      : `Pages ${idx * 2} and ${idx * 2 + 1} of ${total}`;
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === max();
  }

  function go(dir) {
    const next = idx + dir;
    if (next < 0 || next > max()) return;
    const moving = dir > 0 ? idx : next;
    idx = next;
    render(true, moving);
    if (window.ambient && window.ambient.rustle) window.ambient.rustle();
  }

  function onClick(e) {
    if (e.target.closest('a')) return;
    const r = book.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    if (idx === 0) return go(1);
    go(single ? (x < 0.35 ? -1 : 1) : x < 0.5 ? -1 : 1);
  }

  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  const onKey = (e) => {
    if (/input|textarea|select/i.test(document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  };
  document.addEventListener('keydown', onKey);
  mq.addEventListener('change', build);
  window.onCleanup && onCleanup(() => { document.removeEventListener('keydown', onKey); mq.removeEventListener('change', build); });
  bar.hidden = false;
  hint.hidden = false;
  build();
})();
