// Two-way language switches (About intro, song lyrics): each button shows its target and hides its siblings'.
(() => {
  document.querySelectorAll('.lang-switch').forEach((group) => {
    const buttons = [...group.querySelectorAll('[data-show]')];
    buttons.forEach((b) =>
      b.addEventListener('click', () => {
        buttons.forEach((o) => {
          const on = o === b;
          o.setAttribute('aria-pressed', String(on));
          const el = document.getElementById(o.dataset.show);
          if (el) el.hidden = !on;
        });
      })
    );
  });
})();
