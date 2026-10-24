// Contact: the letter is delivered by Web3Forms when a key is set (address stays private),
// otherwise it opens the visitor's email app, or Instagram if no email is configured.
(() => {
  const form = document.querySelector('.letter-form');
  if (!form) return;
  const status = form.querySelector('.lf-status');
  const button = form.querySelector('button[type=submit]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let bad = null;
    form.querySelectorAll('[required]').forEach((el) => {
      const ok = el.checkValidity() && el.value.trim();
      el.setAttribute('aria-invalid', String(!ok));
      if (!ok && !bad) bad = el;
    });
    if (bad) { status.textContent = 'A few words are missing.'; bad.focus(); return; }
    const d = Object.fromEntries(new FormData(form));
    if (d.botcheck) return; // a bot filled the hidden box
    const subject = `A letter from ${d.name} (${d.who})`;
    const text = `Dear Sujal,\n\nI am ${d.who}. My name is ${d.name} and you can reach me at ${d.email}.\n\n${d.message}\n`;

    if (form.dataset.key) {
      button.disabled = true;
      status.textContent = 'Sending your letter…';
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ access_key: form.dataset.key, subject, from_name: 'Alfaaz Sujal Ke website', name: d.name, email: d.email, who: d.who, message: d.message }),
        });
        const out = await res.json();
        if (!out.success) throw new Error(out.message);
        form.reset();
        status.textContent = 'Thank you. Your letter has reached Sujal.';
      } catch {
        status.textContent = 'The letter could not be sent just now. Please try again in a moment.';
      }
      button.disabled = false;
      return;
    }
    if (form.dataset.email) {
      location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
      status.textContent = 'Your email app should open with the letter ready to send.';
      return;
    }
    const copied = navigator.clipboard ? navigator.clipboard.writeText(text).then(() => true, () => false) : Promise.resolve(false);
    window.open(form.dataset.instagram, '_blank', 'noopener'); // open synchronously so it isn't blocked
    status.textContent = (await copied)
      ? 'Your letter is copied. Paste it in a message on Instagram.'
      : 'Instagram opened in a new tab. Send your letter there as a message.';
  });
})();
