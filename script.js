(() => {
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');
  const hero = document.querySelector('[data-slider]');
  const slides = hero ? [...hero.querySelectorAll('.hero-slide')] : [];
  const dotsRoot = document.querySelector('[data-dots]');
  const currentNumber = document.querySelector('[data-current]');
  let current = 0;
  let timer;

  const t = (key) => {
    const lang = window.CFL_getLang?.() || 'en';
    return window.CFL_I18N?.[lang]?.[key] || window.CFL_I18N?.es?.[key] || key;
  };

  window.CFL_applyLang?.(window.CFL_getLang?.() || 'en');

  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.CFL_setLang?.(btn.getAttribute('data-lang'));
    });
  });

  const setHeader = () => {
    if (header?.classList.contains('is-page')) return;
    header?.classList.toggle('is-sticky', window.scrollY > 100);
  };
  setHeader();
  window.addEventListener('scroll', setHeader, { passive: true });

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    nav?.classList.toggle('is-open', !open);
  });

  nav?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuButton?.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    });
  });

  const renderSlide = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
    dotsRoot?.querySelectorAll('button').forEach((dot, i) => {
      dot.classList.toggle('is-active', i === current);
      dot.setAttribute('aria-label', `${t('show_slide')} ${i + 1}`);
    });
    if (currentNumber) currentNumber.textContent = String(current + 1).padStart(2, '0');
  };

  const restart = () => {
    clearInterval(timer);
    timer = setInterval(() => renderSlide(current + 1), 6500);
  };

  if (slides.length && dotsRoot) {
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `${t('show_slide')} ${i + 1}`);
      dot.addEventListener('click', () => { renderSlide(i); restart(); });
      dotsRoot.append(dot);
    });
    renderSlide(0);
    restart();
    document.querySelector('[data-next]')?.addEventListener('click', () => { renderSlide(current + 1); restart(); });
    document.querySelector('[data-prev]')?.addEventListener('click', () => { renderSlide(current - 1); restart(); });
  }

  window.addEventListener('cfl:langchange', () => {
    dotsRoot?.querySelectorAll('button').forEach((dot, i) => {
      dot.setAttribute('aria-label', `${t('show_slide')} ${i + 1}`);
    });
  });

  const updateCountdown = (node) => {
    const target = new Date(node.dataset.date).getTime();
    const distance = Math.max(0, target - Date.now());
    const values = {
      days: Math.floor(distance / 86400000),
      hours: Math.floor((distance % 86400000) / 3600000),
      minutes: Math.floor((distance % 3600000) / 60000),
      seconds: Math.floor((distance % 60000) / 1000),
    };
    Object.entries(values).forEach(([key, value]) => {
      const el = node.querySelector(`[data-${key}]`);
      if (el) el.textContent = String(value).padStart(2, '0');
    });
  };

  const countdowns = [...document.querySelectorAll('[data-countdown]')];
  const tickCountdowns = () => countdowns.forEach(updateCountdown);
  tickCountdowns();
  setInterval(tickCountdowns, 1000);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  const COMMS_ENDPOINT =
    'https://script.google.com/macros/s/AKfycby5D7vu8tYjYH4VY-NCwSO6ECkXnbjHX5CoXrQldo_gX-V85-Wnp2p-OvGzwOQ9cRPHbg/exec';

  document.querySelectorAll('.signup-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const status = form.querySelector('[data-signup-status]');
      const button = form.querySelector('button[type="submit"]');
      const setStatus = (key, kind) => {
        if (!status) return;
        status.textContent = t(key);
        status.classList.toggle('is-success', kind === 'success');
        status.classList.toggle('is-error', kind === 'error');
      };

      if (String(data.get('company') || '').trim()) {
        setStatus('signup_success', 'success');
        return;
      }

      const email = String(data.get('email') || '').trim();
      if (!form.checkValidity() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        form.reportValidity();
        return;
      }

      if (button) button.disabled = true;
      setStatus('signup_sending', '');

      try {
        await fetch(COMMS_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            form: 'comms',
            name: String(data.get('name') || '').trim(),
            email,
            lang: window.CFL_getLang?.() || document.documentElement.lang || 'en',
            source: form.getAttribute('data-source') || 'site',
            tickets: true,
            events: true,
            news: true,
          }),
        });
        setStatus('signup_success', 'success');
        form.reset();
      } catch {
        setStatus('signup_error', 'error');
      } finally {
        if (button) button.disabled = false;
      }
    });
  });

  const dict = () => window.CFL_I18N?.[window.CFL_getLang?.() || 'en'] || {};

  const sale = document.querySelector('[data-ticket-sale]');
  const chips = [...document.querySelectorAll('[data-ticket-chip]')];
  if (sale || chips.length) {
    const paintSale = () => {
      const copy = dict();
      const opens = new Date(sale?.dataset.ticketOpens || chips[0]?.dataset.opens || '').getTime();
      const url = (sale?.dataset.ticketUrl || '').trim();
      const open = Boolean(url) || (Number.isFinite(opens) && Date.now() >= opens);
      const ready = open && Boolean(url);

      sale?.querySelector('[data-ticket-status]')?.classList.toggle('is-waiting', !open);
      sale?.querySelector('[data-ticket-status]')?.classList.toggle('is-live', open);
      const statusText = sale?.querySelector('[data-ticket-status-text]');
      if (statusText) statusText.textContent = copy[open ? 'tickets_status_live' : 'tickets_status_waiting'] || '';
      const blurb = sale?.querySelector('[data-ticket-copy]');
      if (blurb) blurb.textContent = copy[open ? 'tickets_copy_live' : 'tickets_copy_waiting'] || '';
      const saleClock = sale?.querySelector('[data-sale-clock]');
      const fightClock = sale?.querySelector('[data-fight-clock]');
      if (saleClock) saleClock.hidden = open;
      if (fightClock) fightClock.hidden = !open;

      const buy = sale?.querySelector('[data-ticket-buy]');
      const label = buy?.querySelector('[data-ticket-buy-label]');
      const note = sale?.querySelector('[data-ticket-buy-note]');
      if (buy) {
        if (ready) {
          buy.href = url;
          buy.target = '_blank';
          buy.rel = 'noopener noreferrer';
          buy.removeAttribute('aria-disabled');
          if (label) label.textContent = copy.tickets_buy || 'Buy tickets';
        } else {
          buy.removeAttribute('href');
          buy.removeAttribute('target');
          buy.removeAttribute('rel');
          buy.setAttribute('aria-disabled', 'true');
          if (label) label.textContent = copy[open ? 'tickets_buy_pending' : 'tickets_buy_waiting'] || '';
        }
      }
      if (note) {
        note.hidden = ready;
        note.textContent = copy[open ? 'tickets_buy_note_pending' : 'tickets_buy_note_waiting'] || '';
      }

      chips.forEach((chip) => {
        chip.classList.toggle('is-waiting', !open);
        chip.classList.toggle('is-live', open);
        const chipLabel = chip.querySelector('[data-ticket-chip-label]');
        if (chipLabel) chipLabel.textContent = copy[open ? 'tickets_status_live' : 'tickets_status_waiting'] || '';
      });
    };

    paintSale();
    setInterval(paintSale, 1000);
    window.addEventListener('cfl:langchange', paintSale);
  }
})();
