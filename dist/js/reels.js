// Reels page: custom audio players, click-to-load YouTube, Instagram embeds.
(() => {
  const fmt = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');
  const players = [...document.querySelectorAll('.player')];
  if (!players.length && !document.querySelector('.reel-play, .yt')) return;

  // Songs · Films · Reels tabs: the chosen one shows right under the tabs (Songs by default)
  const tabs = [...document.querySelectorAll('.media-tabs [data-tab]')];
  if (tabs.length) {
    const show = (name, fromHash) => {
      if (!tabs.some((t) => t.dataset.tab === name)) name = 'songs';
      tabs.forEach((t) => {
        const on = t.dataset.tab === name;
        t.setAttribute('aria-selected', String(on));
        const panel = document.getElementById(t.dataset.tab);
        if (panel) { panel.hidden = !on; if (on) panel.querySelectorAll('.reveal').forEach((r) => r.classList.add('is-in')); }
      });
      if (fromHash !== null) history.replaceState(history.state, '', '#' + name);
      if (fromHash) document.querySelector('.media-tabs').scrollIntoView({ block: 'start' });
    };
    tabs.forEach((t) => t.addEventListener('click', (e) => { e.preventDefault(); show(t.dataset.tab, false); }));
    const start = location.hash.slice(1);
    show(start || 'songs', start ? true : null);
  }

  players.forEach((pl) => {
    const audio = pl.querySelector('audio');
    const btn = pl.querySelector('.pl-btn');
    const range = pl.querySelector('input[type=range]');
    const time = pl.querySelector('.pl-time');
    let seeking = false;
    btn.addEventListener('click', () => {
      if (audio.paused) {
        players.forEach((o) => o !== pl && o.querySelector('audio').pause());
        audio.play().catch(() => window.toast && toast('Could not play this file'));
      } else audio.pause();
    });
    audio.addEventListener('play', () => { pl.classList.add('is-playing'); btn.setAttribute('aria-label', btn.getAttribute('aria-label').replace('Play', 'Pause')); });
    audio.addEventListener('pause', () => { pl.classList.remove('is-playing'); btn.setAttribute('aria-label', btn.getAttribute('aria-label').replace('Pause', 'Play')); });
    audio.addEventListener('timeupdate', () => {
      if (!seeking && audio.duration) range.value = Math.round((audio.currentTime / audio.duration) * 1000);
      time.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
    });
    range.addEventListener('input', () => { seeking = true; if (audio.duration) time.textContent = `${fmt((range.value / 1000) * audio.duration)} / ${fmt(audio.duration)}`; });
    range.addEventListener('change', () => {
      const go = () => { audio.currentTime = (range.value / 1000) * audio.duration; seeking = false; };
      if (audio.duration) go(); else { audio.addEventListener('loadedmetadata', go, { once: true }); audio.load(); }
    });
  });

  // YouTube: load the player only when asked (keeps the page light)
  document.querySelectorAll('.yt').forEach((b) =>
    b.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0`;
      f.title = b.getAttribute('aria-label');
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      b.replaceChildren(f);
    }, { once: true })
  );

  // Instagram / Facebook reels: load the platform's player only when tapped
  document.querySelectorAll('.reel-play').forEach((b) =>
    b.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = b.dataset.embed;
      f.title = b.getAttribute('aria-label');
      f.allow = 'autoplay; encrypted-media; picture-in-picture; clipboard-write; fullscreen';
      f.allowFullscreen = true;
      f.loading = 'lazy';
      f.setAttribute('scrolling', 'no');
      const wrap = document.createElement('div');
      wrap.className = 'reel-frame';
      wrap.appendChild(f);
      b.replaceWith(wrap);
    }, { once: true })
  );
})();
