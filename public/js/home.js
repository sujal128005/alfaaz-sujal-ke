// Home: a slow field of ink motes in lamplight, and lines of poetry that change like breath.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Rotating lines */
  const fig = document.querySelector('.home-line');
  if (fig) {
    const lines = JSON.parse(fig.dataset.lines || '[]');
    const q = fig.querySelector('blockquote');
    const link = fig.querySelector('figcaption a');
    const title = fig.querySelector('.hl-title');
    let i = 0;
    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
    const next = () => {
      if (document.hidden || lines.length < 2) return;
      fig.classList.add('is-fading');
      setTimeout(() => {
        i = (i + 1) % lines.length;
        const l = lines[i];
        q.lang = l.l;
        q.innerHTML = esc(l.t).replace(/\n/g, '<br>');
        title.textContent = l.n;
        link.href = 'poems/' + l.p + '/';
        fig.classList.remove('is-fading');
      }, 900);
    };
    if (!reduced) { const iv = setInterval(next, 7000); window.onCleanup && onCleanup(() => clearInterval(iv)); }
  }

  /* Ink field */
  const c = document.querySelector('.ink-field');
  if (!c) return;
  const ctx = c.getContext('2d');
  let w, h, dpr, motes = [], mouse = { x: -9999, y: -9999 }, raf;
  const GOLD = [214, 164, 94];
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = c.clientWidth; h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(110, (w * h) / 14000));
    motes = Array.from({ length: n }, () => spawn(true));
  };
  const spawn = (anywhere) => ({
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + 10,
    r: Math.random() * 1.6 + 0.3,
    vy: -(Math.random() * 0.18 + 0.04),
    vx: (Math.random() - 0.5) * 0.08,
    a: Math.random() * 0.5 + 0.15,
    ph: Math.random() * Math.PI * 2,
  });
  const draw = (t) => {
    ctx.clearRect(0, 0, w, h);
    // lamplight
    const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, Math.max(w, h) * 0.6);
    g.addColorStop(0, 'rgba(214,164,94,0.10)');
    g.addColorStop(1, 'rgba(14,13,18,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (const m of motes) {
      const dx = m.x - mouse.x, dy = m.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 16000) { const f = (1 - d2 / 16000) * 0.6; m.x += (dx / Math.sqrt(d2 + 1)) * f; m.y += (dy / Math.sqrt(d2 + 1)) * f; }
      m.x += m.vx + Math.sin(t / 3000 + m.ph) * 0.06;
      m.y += m.vy;
      if (m.y < -10 || m.x < -10 || m.x > w + 10) Object.assign(m, spawn(false));
      const tw = 0.6 + 0.4 * Math.sin(t / 900 + m.ph);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${GOLD[0]},${GOLD[1]},${GOLD[2]},${(m.a * tw).toFixed(3)})`;
      ctx.fill();
    }
  };
  const loop = (t) => { draw(t); raf = requestAnimationFrame(loop); };
  resize();
  const move = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
  const vis = () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(loop); };
  addEventListener('resize', resize);
  addEventListener('pointermove', move, { passive: true });
  window.onCleanup && onCleanup(() => { cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('pointermove', move); document.removeEventListener('visibilitychange', vis); });
  if (reduced) draw(0);
  else {
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', vis);
  }
})();
