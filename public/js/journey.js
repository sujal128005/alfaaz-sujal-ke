// Journey: the thread draws itself as you scroll down the years.
(() => {
  const thread = document.querySelector('.thread');
  const line = document.querySelector('.thread-line span');
  if (!thread || !line) return;
  let ticking = false;
  const update = () => {
    const r = thread.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height));
    line.style.setProperty('--p', p.toFixed(4));
    ticking = false;
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', update);
  window.onCleanup && onCleanup(() => { removeEventListener('scroll', onScroll); removeEventListener('resize', update); });
  update();
})();
