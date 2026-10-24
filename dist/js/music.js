// Quiet library ambience, composed live in the browser (no audio file):
// slow warm chords, a few soft piano-like notes, and a faint room hush.
// Off until the visitor turns it on; the choice is remembered from page to page.
(() => {
  const KEY = 'alfaaz-music';
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };
  const btn = document.querySelector('.music-btn');
  if (!btn || !(window.AudioContext || window.webkitAudioContext)) { if (btn) btn.hidden = true; return; }

  let ctx, master, bus, playing = false, timer = null, chordIndex = 0;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // D major colours: Dmaj9 · Bm9 · Gmaj7 · A(add9)
  const CHORDS = [[50, 54, 57, 61, 64], [47, 50, 54, 57, 61], [43, 47, 50, 54, 57], [45, 52, 57, 59, 61]];
  const MELODY = [62, 64, 66, 69, 71, 74, 76, 78, 81];
  const CHORD_LEN = 9;
  const BASE = 0.35; // overall loudness: soft by default

  function setup() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    // a soft hall made from decaying noise
    const len = ctx.sampleRate * 4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
    const verb = ctx.createConvolver(); verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.6;
    bus = ctx.createGain();
    bus.connect(master);
    bus.connect(verb).connect(wet).connect(master);
    // the room: very quiet, low noise, like distant rain on a library window
    const nb = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), nd = nb.getChannelData(0);
    let last = 0;
    for (let i = 0; i < nd.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; nd[i] = last * 3.5; }
    const noise = ctx.createBufferSource(); noise.buffer = nb; noise.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 700;
    const ng = ctx.createGain(); ng.gain.value = 0.05;
    noise.connect(nf).connect(ng).connect(master);
    noise.start();
  }

  function pad(notes, t) {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 850; f.Q.value = 0.3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 3);
    g.gain.setValueAtTime(0.05, t + CHORD_LEN - 1);
    g.gain.linearRampToValueAtTime(0, t + CHORD_LEN + 3);
    f.connect(g).connect(bus);
    for (const n of notes) for (const [type, cents] of [['triangle', -5], ['sine', 5]]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = hz(n); o.detune.value = cents;
      o.connect(f); o.start(t); o.stop(t + CHORD_LEN + 3.2);
    }
  }

  function note(m, t, vel = 0.06) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2200;
    g.connect(f).connect(bus);
    [[1, 1], [2, 0.25], [3, 0.08]].forEach(([mult, amp]) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = hz(m) * mult;
      const og = ctx.createGain(); og.gain.value = amp;
      o.connect(og).connect(g); o.start(t); o.stop(t + 3.3);
    });
  }

  function schedule() {
    const t = ctx.currentTime + 0.1;
    pad(CHORDS[chordIndex % CHORDS.length], t);
    // two to four unhurried notes per chord, chosen to sit inside it
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const at = t + 1 + Math.random() * (CHORD_LEN - 2);
      note(MELODY[Math.floor(Math.random() * MELODY.length)], at, 0.035 + Math.random() * 0.03);
    }
    chordIndex++;
    timer = setTimeout(schedule, CHORD_LEN * 1000);
  }

  function start() {
    if (!ctx) setup();
    ctx.resume();
    if (playing) return;
    playing = true;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(level, ctx.currentTime + 4);
    schedule();
    show();
  }

  function stop() {
    if (!playing) return;
    playing = false;
    clearTimeout(timer);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    setTimeout(() => !playing && ctx.suspend(), 1700);
    show();
  }

  function show() {
    btn.setAttribute('aria-pressed', String(playing));
    btn.classList.toggle('is-playing', playing);
    btn.setAttribute('aria-label', playing ? 'Turn off background music' : 'Play soft background music');
  }

  btn.addEventListener('click', () => {
    hideHint();
    if (playing) stop(); else start();
    store.set(KEY, 'used');
  });

  // Make room for other sound without switching the music off:
  // pause while one of the songs plays (and come back after), go very quiet while a reel or film plays.
  let level = BASE, heldForSong = false;
  const fade = (to, secs) => {
    if (!ctx || !playing) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(to, ctx.currentTime + secs);
  };
  document.addEventListener('play', (e) => { if (/AUDIO|VIDEO/.test(e.target.tagName)) { heldForSong = true; fade(0, 1); } }, true);
  const back = (e) => { if (/AUDIO|VIDEO/.test(e.target.tagName) && heldForSong) { heldForSong = false; fade(level, 3); } };
  document.addEventListener('pause', back, true);
  document.addEventListener('ended', back, true);
  document.addEventListener('click', (e) => { if (e.target.closest('.reel-play, .yt')) { level = BASE * 0.15; fade(level, 1.5); } });

  // A page-turn rustle for the book reader, only while the music is on.
  window.ambient = {
    duck(on) { level = on ? BASE * 0.15 : BASE; heldForSong = false; fade(level, 2); },
    rustle() {
      if (!playing) return;
      const t = ctx.currentTime, len = ctx.sampleRate * 0.35;
      const b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin(Math.PI * i / len), 2);
      const s = ctx.createBufferSource(); s.buffer = b;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = 0.6;
      const g = ctx.createGain(); g.gain.value = 0.12;
      s.connect(f).connect(g).connect(master); s.start(t);
    },
  };

  // A one-time, gentle invitation.
  const hint = document.querySelector('.music-hint');
  function hideHint() { if (hint) hint.classList.remove('is-on'); store.set(KEY + '-hinted', '1'); }
  if (hint && !store.get(KEY) && !store.get(KEY + '-hinted')) {
    setTimeout(() => hint.classList.add('is-on'), 2500);
    setTimeout(hideHint, 11000);
  }
})();
