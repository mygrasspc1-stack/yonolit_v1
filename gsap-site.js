/* ============================================================
   gsap-site.js — انیمیشن‌های سایت با GSAP + ScrollTrigger
   هر بخش صفحه، انیمیشن مخصوص خودش را دارد:
   هیرو (ورود)، گالری، شمارنده‌ها، پارالاکس، پنل‌های افقی،
   تب‌ها، تایم‌لاین فرآیند، فرم و نوار پیشرفت اسکرول.
   ============================================================ */
(() => {
  const gsap = window.gsap;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const ST = window.ScrollTrigger;
  const faDigits = '۰۱۲۳۴۵۶۷۸۹';
  const toFa = (value, decimals) => {
    const text = Number(value).toFixed(decimals);
    return text.replace('.', '٫').replace(/\d/g, (digit) => faDigits[Number(digit)]);
  };

  /* بدون GSAP: محتوا باید کامل دیده شود، پس هیچ‌چیز پنهان نمی‌ماند */
  if (!gsap) {
    $('.reveal').forEach((el) => el.classList.add('is-visible'));
    return;
  }
  if (ST) gsap.registerPlugin(ST);
  document.documentElement.classList.add('gsap-anim');

  /* وضعیت نهایی شمارنده‌ها، حتی وقتی انیمیشن غیرفعال است */
  const counters = $('[data-count]');
  const setCounterText = (el, value) => {
    const decimals = Number(el.dataset.decimals || 0);
    el.textContent = `${el.dataset.prefix || ''}${toFa(value, decimals)}${el.dataset.suffix || ''}`;
  };
  if (reduce) {
    counters.forEach((el) => setCounterText(el, Number(el.dataset.count)));
    return;
  }

  /* ---------- ۱. ورود صفحه: هدر، هیرو و تیتر کلمه‌به‌کلمه ---------- */
  const splitWords = (element) => {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          if (!child.textContent.trim()) return;
          const fragment = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part.trim()) { fragment.appendChild(document.createTextNode(part)); return; }
            const span = document.createElement('span');
            span.className = 'gsap-word';
            span.style.display = 'inline-block';
            span.style.willChange = 'transform';
            span.textContent = part;
            fragment.appendChild(span);
          });
          node.replaceChild(fragment, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR' && !child.classList.contains('gsap-word')) {
          walk(child);
        }
      });
    };
    walk(element);
    return $('.gsap-word', element);
  };

  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  if ($('.topline').length) intro.from('.topline', { yPercent: -100, duration: .5 });
  if ($('.site-header').length) intro.from('.site-header', { yPercent: -100, duration: .6 }, '<.1');

  const heroTitle = document.querySelector('[data-hero] h1, .hero h1');
  if (heroTitle) {
    const words = splitWords(heroTitle);
    intro.from(words, { yPercent: 115, opacity: 0, duration: .9, stagger: .055 }, '-=.25');
  }
  const crumbs = $('[data-hero] .crumbs, [data-hero] .eyebrow, .hero .eyebrow');
  if (crumbs.length) intro.from(crumbs, { opacity: 0, y: 12, duration: .6 }, '-=.9');
  const heroLead = $('[data-hero] .lead, .hero .hero-lead');
  if (heroLead.length) intro.from(heroLead, { opacity: 0, y: 16, duration: .7 }, '-=.6');
  const heroActions = $('[data-hero] .svc-tags, .hero-actions, [data-hero] .button');
  if (heroActions.length) intro.from(heroActions, { opacity: 0, y: 14, duration: .6, stagger: .08 }, '-=.45');

  const heroMedia = document.querySelector('[data-hero-media], .hero-media');
  if (heroMedia) {
    intro.from(heroMedia, { clipPath: 'inset(0 0 100% 0)', duration: 1.05 }, '-=.85');
    const mediaImg = heroMedia.querySelector('img');
    if (mediaImg) intro.from(mediaImg, { scale: 1.14, duration: 1.4, ease: 'power2.out' }, '<');
  }
  const heroFacts = $('.hero-facts > div, .stat-band .stat');
  if (heroFacts.length) intro.from(heroFacts, { opacity: 0, y: 14, duration: .55, stagger: .07 }, '-=.7');

  /* ---------- ۲. ظاهر شدن بخش‌ها با اسکرول (batch) ---------- */
  const reveals = $('.reveal');
  if (ST && reveals.length) {
    gsap.set(reveals, { opacity: 0, y: 24 });
    ScrollTrigger.batch(reveals, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: .75, stagger: .07, overwrite: true })
    });
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- ۳. شمارنده‌ها ---------- */
  counters.forEach((el) => {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    const state = { value: 0 };
    const config = { value: target, duration: 1.5, ease: 'power2.out', onUpdate: () => setCounterText(el, state.value) };
    if (decimals) config.snap = { value: 1 / Math.pow(10, decimals) };
    else config.snap = { value: 1 };
    if (ST) config.scrollTrigger = { trigger: el.closest('.stat-band') || el, start: 'top 92%', once: true };
    gsap.to(state, config);
  });

  /* ---------- ۴. پارالاکس تصاویر ---------- */
  if (ST) {
    $('[data-parallax], .page-hero-media img, .proof-images img, .panel-grid img').forEach((img) => {
      const trigger = img.closest('figure') || img.closest('section') || img;
      gsap.fromTo(img,
        { yPercent: -5, scale: 1.09 },
        { yPercent: 5, scale: 1.09, ease: 'none',
          scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- ۵. پنل‌های افقی (pin + scrub) ---------- */
  const hscrollSection = document.querySelector('[data-hscroll]');
  const hscrollTrack = document.querySelector('[data-hscroll-track]');
  if (ST && hscrollSection && hscrollTrack && window.matchMedia('(min-width: 901px)').matches) {
    const distance = () => Math.max(0, hscrollTrack.scrollWidth - window.innerWidth + 24);
    gsap.to(hscrollTrack, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: hscrollSection,
        start: 'top top',
        end: () => `+=${distance() + window.innerHeight}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
    gsap.from('.hpanel', {
      opacity: 0, y: 30, duration: .7, stagger: .1,
      scrollTrigger: { trigger: hscrollSection, start: 'top 70%', once: true }
    });
  }

  /* ---------- ۶. تایم‌لاین فرآیند: خط پیشرفت + گام‌ها ---------- */
  const progressBar = document.querySelector('[data-timeline-progress]');
  if (ST && progressBar) {
    gsap.to(progressBar, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: progressBar.closest('.timeline-wrap'), start: 'top 75%', end: 'bottom 85%', scrub: .6 }
    });
    gsap.from('.timeline li b', {
      opacity: 0, x: 14, duration: .5, stagger: .06,
      scrollTrigger: { trigger: '.timeline', start: 'top 80%', once: true }
    });
  }

  /* ---------- ۶٫۵. نشانگر لودینگ دایره‌ای: با اسکرول پر و خالی می‌شود ---------- */
  const scrollLoader = document.querySelector('[data-scroll-loader]');
  if (scrollLoader) {
    const fillCircle = scrollLoader.querySelector('[data-sl-fill]');
    const pctLabel = scrollLoader.querySelector('[data-sl-pct]');
    const radius = Number(fillCircle.getAttribute('r')) || 52;
    const LEN = 2 * Math.PI * radius;
    const state = { p: 0 };
    /* رسم حلقه بر اساس نسبت پرشدگی ۰ تا ۱ */
    const paint = () => {
      fillCircle.style.strokeDashoffset = String(LEN * (1 - state.p));
      if (pctLabel) pctLabel.textContent = Math.round(state.p * 100) + '%';
    };
    paint();
    if (ST) {
      /* تایم‌لاین دو پله‌ای: نیمهٔ اول پر شدن، نیمهٔ دوم خالی شدن — با اسکرول scrub می‌شود */
      const loop = gsap.timeline({
        scrollTrigger: {
          trigger: scrollLoader.closest('section') || scrollLoader,
          start: 'top bottom',
          end: 'bottom top',
          scrub: .35
        }
      });
      loop.to(state, { p: 1, duration: 1, ease: 'none', onUpdate: paint })
        .to(state, { p: 0, duration: 1, ease: 'none', onUpdate: paint });
    } else {
      /* بدون ScrollTrigger: لوپ خودکار تا نشانگر بی‌استفاده نماند */
      gsap.to(state, { p: 1, duration: 1.9, repeat: -1, yoyo: true, ease: 'sine.inOut', onUpdate: paint });
    }
  }

  /* ---------- ۷. تب‌های کاربردها ---------- */
  const tabsWrap = document.querySelector('[data-tabs]');
  if (tabsWrap) {
    const panels = $('[data-panel]');
    const activate = (key) => {
      const panel = panels.find((item) => item.dataset.panel === key);
      if (!panel) return;
      panels.forEach((item) => item.classList.toggle('active', item === panel));
      gsap.fromTo(panel, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .55, ease: 'power2.out' });
      gsap.fromTo($('h3, p', panel), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .5, stagger: .06, delay: .08 });
      if (ST) ScrollTrigger.refresh();
    };
    /* یک مسیر واحد برای انتخاب تب: کلیک، بارگذاری با #hash و تغییر hash */
    const selectTab = (key, scrollToTab = false) => {
      const tab = tabsWrap.querySelector(`.tab[data-tab="${key}"]`);
      if (!tab) return false;
      $('.tab', tabsWrap).forEach((item) => {
        const active = item === tab;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', String(active));
      });
      activate(key);
      if (scrollToTab) tab.scrollIntoView({ block: 'start' });
      return true;
    };
    tabsWrap.addEventListener('click', (event) => {
      const tab = event.target.closest('.tab');
      if (!tab) return;
      /* انتخاب تب در نشانی می‌ماند تا رفرش صفحه آن را حفظ کند */
      if (selectTab(tab.dataset.tab)) window.history.replaceState(null, '', '#' + tab.dataset.tab);
    });
    /* پیوند مستقیم به یک تب، مثل applications.html#pack (برای لینک‌سازی داخلی بین صفحه‌ها) */
    const hashKey = window.location.hash.replace('#', '');
    if (!selectTab(hashKey, true)) {
      const initial = tabsWrap.querySelector('.tab.active');
      if (initial) activate(initial.dataset.tab);
    }
    window.addEventListener('hashchange', () => selectTab(window.location.hash.replace('#', ''), true));
  }

  /* ---------- ۸. گالری و لایت‌باکس ---------- */
  document.addEventListener('gallery:rendered', (event) => {
    const items = Array.from(event.detail.grid.querySelectorAll('.gallery-item'));
    if (!items.length) return;
    gsap.from(items, { opacity: 0, y: 20, scale: .98, duration: .5, stagger: .035, overwrite: true, ease: 'power2.out' });
  });
  if (ST) {
    const lightbox = document.querySelector('.lightbox');
    if (lightbox) {
      new MutationObserver(() => {
        if (lightbox.open) gsap.fromTo(lightbox, { opacity: 0, scale: .98 }, { opacity: 1, scale: 1, duration: .3, ease: 'power2.out' });
      }).observe(lightbox, { attributes: true, attributeFilter: ['open'] });
    }
    /* تصاویر داخلی بخش‌ها: بزرگ‌نمایی نرم هنگام اسکرول */
    $('.app-card img, .feature-collage img').forEach((img) => {
      gsap.fromTo(img, { scale: 1.08 }, {
        scale: 1, duration: 1, ease: 'power2.out',
        scrollTrigger: { trigger: img, start: 'top 92%', once: true }
      });
    });
  }

  /* ---------- ۹. فرم درخواست ساخت ---------- */
  const form = document.querySelector('[data-reveal-form]');
  if (form && ST) {
    gsap.from(Array.from(form.querySelectorAll('.field')), {
      opacity: 0, y: 16, duration: .5, stagger: .05,
      scrollTrigger: { trigger: form, start: 'top 82%', once: true }
    });
  }
  $('[data-magnetic]').forEach((button) => {
    const strength = 0.28;
    button.addEventListener('pointermove', (event) => {
      const box = button.getBoundingClientRect();
      gsap.to(button, {
        x: (event.clientX - (box.left + box.width / 2)) * strength,
        y: (event.clientY - (box.top + box.height / 2)) * strength,
        duration: .4,
        ease: 'power2.out'
      });
    });
    button.addEventListener('pointerleave', () => {
      gsap.to(button, { x: 0, y: 0, duration: .5, ease: 'elastic.out(1, .5)' });
    });
  });

  /* ---------- ۱۰. نوار پیشرفت اسکرول ---------- */
  if (ST) {
    const bar = document.createElement('div');
    bar.setAttribute('aria-hidden', 'true');
    bar.style.cssText = 'position:fixed;top:0;right:0;left:0;height:2px;background:var(--orange);z-index:60;transform:scaleX(0);transform-origin:right center';
    document.body.appendChild(bar);
    gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .25 } });
  }

  /* در دسترس برای محتوایی که بعداً ساخته می‌شود */
  window.gsapReveal = (scope) => {
    const elements = Array.from((scope || document).querySelectorAll('.reveal:not(.gsap-done)'));
    elements.forEach((el) => el.classList.add('gsap-done'));
    if (elements.length) gsap.from(elements, { opacity: 0, y: 18, duration: .6, stagger: .05, overwrite: true });
  };
})();
