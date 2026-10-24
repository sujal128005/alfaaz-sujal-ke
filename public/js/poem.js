// Poem page: lines arrive one by one, text size, focus mode, Roman toggle, sharing.
(() => {
  const root = document.documentElement;
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };

  /* Lines appear in reading order as they scroll into view */
  const lines = [...document.querySelectorAll('.poem-orig .line')];
  if ('IntersectionObserver' in window) {
    let queue = [], timer = null;
    const flush = () => {
      const el = queue.shift();
      if (el) el.classList.add('is-in');
      timer = queue.length ? setTimeout(flush, 110) : null;
    };
    const io = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e) => { queue.push(e.target); io.unobserve(e.target); });
      queue.sort((a, b) => lines.indexOf(a) - lines.indexOf(b));
      if (!timer) timer = setTimeout(flush, 300);
    }, { rootMargin: '0px 0px -5% 0px' });
    lines.forEach((l) => io.observe(l));
  } else lines.forEach((l) => l.classList.add('is-in'));

  /* Text size, remembered per reader */
  let scale = parseFloat(store.get('poem-scale')) || 1;
  const apply = () => root.style.setProperty('--poem-scale', scale);
  apply();
  document.querySelectorAll('[data-size]').forEach((b) =>
    b.addEventListener('click', () => {
      scale = Math.min(1.5, Math.max(0.8, +(scale + 0.1 * b.dataset.size).toFixed(2)));
      apply();
      store.set('poem-scale', scale);
    })
  );

  /* Focus mode */
  const focusBtn = document.querySelector('[data-focus]');
  focusBtn && focusBtn.addEventListener('click', () => {
    const on = document.body.classList.toggle('is-reading');
    focusBtn.setAttribute('aria-pressed', String(on));
  });

  /* Original ↔ Roman transliteration */
  const romanBtn = document.querySelector('[data-roman]');
  romanBtn && romanBtn.addEventListener('click', () => {
    const orig = document.querySelector('.poem-orig');
    const rom = document.querySelector('.poem-roman-text');
    const on = rom.hidden;
    rom.hidden = !on; orig.hidden = on;
    rom.querySelectorAll('.line').forEach((l) => l.classList.add('is-in'));
    romanBtn.setAttribute('aria-pressed', String(on));
  });

  /* Share */
  const share = document.querySelector('[data-share]');
  share && share.addEventListener('click', async () => {
    const data = { title: share.dataset.title + ' | Alfaaz Sujal Ke', url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(location.href); window.toast && toast('Link copied'); }
    } catch (e) { if (e.name !== 'AbortError') window.toast && toast('Copy the link from the address bar'); }
  });
})();
