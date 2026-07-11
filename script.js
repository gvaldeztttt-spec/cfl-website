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

  document.querySelectorAll('.signup-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('button');
      const original = button.innerHTML;
      button.textContent = t('signup_success');
      button.disabled = true;
      setTimeout(() => {
        button.innerHTML = original;
        button.disabled = false;
        event.currentTarget.reset();
        window.CFL_applyLang?.(window.CFL_getLang?.() || 'en');
      }, 2600);
    });
  });
})();
