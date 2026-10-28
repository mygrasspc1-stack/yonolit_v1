/* رفتار مشترک همه‌ی صفحه‌ها: منو، گالری، لایت‌باکس و فرم درخواست.
   هر بخش فقط زمانی فعال می‌شود که عنصر مربوط به آن در صفحه وجود داشته باشد. */
const galleryItems = [
  ['baghale ifel.webp','دکور و استند','decor','باغچه‌ی ایفل'],['img-001.jpg','دکور و استند','decor','دیوار باستانی CNC'],['ifel.webp','دکور و استند','decor','المان شهری'],['img-002.webp','غذایی و تبلیغاتی','food','کمپین آب‌پرتقال'],['img-003.webp','دکور و استند','decor','استند زمینی'],['img-004.webp','دکور و استند','decor','استند نمایشگاهی'],['img-005.jpg','دکور و استند','decor','چیدمان نمایشگاهی'],['img-006.webp','غذایی و تبلیغاتی','food','فرم تبلیغاتی هندوانه'],['img-007.jpg','بسته‌بندی','pack','محافظ بشقاب'],['img-008.webp','بسته‌بندی','pack','محافظ قطعه خودرو'],['img-009.webp','بسته‌بندی','pack','بسته‌بندی لوستر'],['img-010.jpg','بسته‌بندی','pack','محافظ کریستال'],['img-011.webp','بسته‌بندی','pack','فرم محافظ گل'],['img-012.jpg','دکور و استند','decor','تابلو و استند پگاه'],['img-013.jpg','غذایی و تبلیغاتی','food','فرم تبلیغاتی قهوه'],['img-014.webp','دکور و استند','decor','دکور تئاتر'],['img-015.webp','غذایی و تبلیغاتی','food','صحنه‌ی یلدا'],['img-016.webp','غذایی و تبلیغاتی','food','ماکت محصول'],['img-017.webp','دکور و استند','decor','صحنه‌ی صدا و سیما'],['img-018.webp','قالب‌سازی','mold','فرم چهره'],['img-019.jpg','قالب‌سازی','mold','فرایند ساخت'],['img-020.webp','قالب‌سازی','mold','قلعه و حجم‌پردازی'],['img-021.webp','قالب‌سازی','mold','قالب ابزار'],['img-022.webp','بسته‌بندی','pack','محافظ لوازم آرایش'],['img-023.webp','دکور و استند','decor','مجسمه باستانی'],['img-024.webp','قالب‌سازی','mold','فرم خام'],['img-025.webp','قالب‌سازی','mold','فرم پرداخت‌شده'],['img-026.webp','قالب‌سازی','mold','بلوک خام'],['img-027.webp','قالب‌سازی','mold','ماکت موتورسیکلت'],['img-028.jpg','غذایی و تبلیغاتی','food','فرم تبلیغاتی کروسان'],['img-029.jpg','دکور و استند','decor','جشن ۳۵ سالگی']
];
const asset = (name) => `assets/${encodeURIComponent(name)}`;

/* پروژه‌های تازه: نام فایل لاتین و بهینه، به‌همراه متن جایگزین (alt) هدفمند برای موتور جست‌وجو */
const seoProjects = [
  ['baseball-ball-mockup.webp', 'ماکت و المان حجمی', 'mold', 'المان حجمی توپ بیسبال', 'ماکت و المان حجمی توپ بیسبال با یونولیت EPS و برش حرارتی؛ سه مرحله‌ی قبل، در حال ساخت و نهایی'],
  ['eps-astronaut-mockup.webp', 'ماکت و مجسمه', 'mold', 'ماکت حجمی فضانورد', 'ماکت فضانورد سفارشی با یونولیت EPS و پوشش ضد ضربه برای نمایش محصول'],
  ['peghah-3d-brand-logo.webp', 'دکور و استند', 'decor', 'لوگوی سه‌بعدی و ماکت برند', 'لوگوی حجمی سه‌بعدی برند و ماکت محصول، ساخته‌شده با فوم انبساطی EPS برای رویداد و کمپین'],
  ['exhibition-stand-branding.webp', 'دکور و استند', 'decor', 'استند نمایشگاهی برندینگ', 'استند نمایشگاهی یونولیتی برای غرفه و رویداد برندینگ با طراحی و اجرای رنگ سازمانی'],
  ['university-stand-3d-letters.webp', 'دکور و استند', 'decor', 'تابلو و حروف برجسته‌ی دانشگاه', 'تابلو و حروف برجسته‌ی یونولیتی با برش CNC و رنگ‌آمیزی صنعتی برای رویداد و نمایشگاه'],
  ['arvin-sanat-asia-3d-logo.webp', 'دکور و استند', 'decor', 'لوگوی سه‌بعدی روی دیوار', 'نشان حجمی و لوگوی سه‌بعدی نصب‌شده روی دیوار، ساخته‌شده با یونولیت و برش CNC'],
  ['yonolit-decorative-panel-simcard.webp', 'دکور و استند', 'decor', 'پنل دکوراتیو دیواری', 'پنل دکوراتیو یونولیتی با برش CNC برای دیوارپوش داخلی؛ وزن سبک، مقاوم و نصب آسان'],
  ['custom-eps-packaging-mold.webp', 'بسته‌بندی', 'pack', 'قالب و بسته‌بندی سفارشی', 'ساخت قالب و بسته‌بندی سفارشی یونولیتی برای محافظت از قطعات صنعتی و کالای شکستنی در حمل‌ونقل'],
];
galleryItems.push(...seoProjects);

/* ---------- گالری و لایت‌باکس (فقط در صفحه‌هایی که گالری دارند) ---------- */
const grid = document.querySelector('#gallery-grid');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');

function openLightbox(src, caption) {
  if (!lightbox || !lightboxImage || !lightboxCaption) return;
  lightboxImage.src = src;
  lightboxImage.alt = caption;
  lightboxCaption.textContent = caption;
  if (typeof lightbox.showModal === 'function') lightbox.showModal();
}
function renderGallery(filter = 'all') {
  if (!grid) return;
  grid.innerHTML = galleryItems
    .filter(([, , category]) => filter === 'all' || category === filter)
    .map(([name, label, category, title, alt], index) => `
    <button class="gallery-item reveal" data-image="${asset(name)}" data-caption="${title} / ${label}" aria-label="مشاهده ${title}">
      <img src="${asset(name)}" alt="${alt || title}" loading="lazy"><span>${String(index + 1).padStart(2, '0')}</span><div><b>${title}</b><small>${label}</small></div>
    </button>`).join('');
  grid.querySelectorAll('.gallery-item').forEach((item) => item.addEventListener('click', () => openLightbox(item.dataset.image, item.dataset.caption)));
  observeReveals();
  document.dispatchEvent(new CustomEvent('gallery:rendered', { detail: { grid, filter } }));
}
if (lightbox) {
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox || event.target.closest('.lightbox-close')) lightbox.close();
  });
}
document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
  const active = document.querySelector('.filter.active');
  if (active) active.classList.remove('active');
  button.classList.add('active');
  renderGallery(button.dataset.filter);
  /* وضعیت فیلتر در نشانی می‌ماند تا رفرش صفحه انتخاب را حفظ کند */
  const url = new URL(window.location.href);
  if (button.dataset.filter === 'all') url.searchParams.delete('category');
  else url.searchParams.set('category', button.dataset.filter);
  window.history.replaceState(null, '', url);
}));

/* ---------- ظاهر شدن نرم (پشتیبان وقتی GSAP در دسترس نیست) ---------- */
const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
}), { threshold: 0.12 });
function observeReveals() { document.querySelectorAll('.reveal:not(.is-visible)').forEach((element) => observer.observe(element)); }
observeReveals();

/* ---------- منوی موبایل ---------- */
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');
if (menuToggle && nav) {
  const setMenu = (open) => {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
    nav.classList.toggle('nav-open', open);
  };
  menuToggle.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  /* کلیک بیرون از منو یا کلید Escape آن را می‌بندد تا روی محتوا باقی نماند */
  document.addEventListener('click', (event) => {
    if (nav.classList.contains('nav-open') && !nav.contains(event.target) && !menuToggle.contains(event.target)) setMenu(false);
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('nav-open')) setMenu(false);
  });
}
/* بستن لایت‌باکس با Escape کار خودِ <dialog> است (رفتار پیش‌فرض مرورگر) */

/* ---------- فرم درخواست ساخت ---------- */
/* نام فیلدها به برچسب فارسی، برای ساخت متن ایمیل */
const projectMailLabels = {
  name: 'نام', company: 'برند/شرکت', phone: 'موبایل', email: 'ایمیل', type: 'نوع پروژه',
  place: 'محل استفاده', size: 'ابعاد', qty: 'تعداد', deadline: 'تاریخ تحویل',
  file: 'لینک فایل', brief: 'توضیح پروژه', source: 'نحوه‌ی آشنایی'
};
/* خلاصهٔ متنی درخواست: هم بدنهٔ ایمیل، هم متنی که کاربر می‌تواند کپی کند */
function buildProjectSummary(data) {
  const lines = Object.keys(projectMailLabels)
    .map((key) => [projectMailLabels[key], (data.get(key) || '').toString().trim()])
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`);
  lines.push('', '— ارسال‌شده از فرم سایت یونولیت دکور');
  return lines.join('\n');
}
/* از خلاصه، لینک mailto کامل می‌سازد (تابع مستقل و قابل تست) */
function buildProjectMailto(data) {
  const name = (data.get('name') || '').toString().trim();
  const type = (data.get('type') || '').toString().trim();
  const subject = encodeURIComponent(`درخواست برآورد — ${name} — ${type}`);
  return `mailto:hello@yonolit-decor.ir?subject=${subject}&body=${encodeURIComponent(buildProjectSummary(data))}`;
}

const form = document.querySelector('#project-form');
if (form) {
  const success = document.querySelector('#form-success');
  const fallbackLink = document.querySelector('#mailto-fallback');
  const copyButton = document.querySelector('#copy-request');
  let requestSummary = '';
  const toLatinDigits = (value) => value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  const phonePattern = /^(\+?98|0)?9\d{9}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const fieldOf = (element) => element.closest('.field');

  const isValid = (element) => {
    const value = (element.value || '').trim();
    if (element.hasAttribute('required') && !value) return false;
    if (element.id === 'phone' && value) return phonePattern.test(toLatinDigits(value).replace(/[\s()-]/g, ''));
    if (element.id === 'email' && value) return emailPattern.test(value);
    if (element.id === 'brief') return value.length >= 20;
    return true;
  };
  const markValidity = () => {
    let valid = true;
    form.querySelectorAll('input, select, textarea').forEach((element) => {
      const ok = isValid(element);
      const field = fieldOf(element);
      if (field) field.classList.toggle('invalid', !ok);
      if (!ok) valid = false;
    });
    return valid;
  };

  form.addEventListener('input', (event) => {
    const field = event.target.closest && event.target.closest('.field');
    if (field && event.target.id !== 'brief') field.classList.remove('invalid');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!markValidity()) {
      const firstInvalid = form.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea');
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    const data = new FormData(form);
    const mailto = buildProjectMailto(data);
    requestSummary = buildProjectSummary(data);
    if (fallbackLink) fallbackLink.setAttribute('href', mailto);
    if (success) {
      success.classList.add('show');
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (window.gsap) window.gsap.fromTo(success, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .5 });
    }
    /* تلاش برای باز کردن برنامهٔ ایمیل؛ اگر برنامه‌ای نباشد، پنل بالا راه جایگزین (کپی) را نشان می‌دهد */
    window.location.href = mailto;
  });

  /* کپی خلاصهٔ درخواست: تنها مسیری که روی همهٔ دستگاه‌ها کار می‌کند */
  if (copyButton) {
    const flashLabel = (label) => {
      const original = copyButton.innerHTML;
      copyButton.textContent = label;
      window.setTimeout(() => { copyButton.innerHTML = original; }, 2500);
    };
    copyButton.addEventListener('click', async () => {
      if (!requestSummary) return;
      let copied = false;
      try {
        await navigator.clipboard.writeText(requestSummary);
        copied = true;
      } catch (error) {
        const area = document.createElement('textarea');
        area.value = requestSummary;
        area.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(area);
        area.select();
        try { copied = document.execCommand('copy'); } catch (fallbackError) { copied = false; }
        area.remove();
      }
      flashLabel(copied ? 'کپی شد ✓' : 'کپی نشد؛ متن را از ایمیل انتخاب کنید');
    });
  }
}

/* پشتیبانی از پیوند مستقیم دسته، مثل portfolio.html?category=pack (برای لینک‌سازی داخلی بین صفحه‌ها) */
const filterKeys = ['all', ...new Set(galleryItems.map(([, , category]) => category))];
const requestedFilter = new URLSearchParams(window.location.search).get('category');
const initialFilter = requestedFilter && filterKeys.includes(requestedFilter) ? requestedFilter : 'all';
if (initialFilter !== 'all') {
  document.querySelectorAll('.filter').forEach((button) => button.classList.toggle('active', button.dataset.filter === initialFilter));
}
renderGallery(initialFilter);

/* ---------- نمایندهٔ سه‌بعدی Spline (فقط در services.html) ---------- */
/* بارگذارندهٔ Spline در خود services.html به‌صورت <script type="module"> است.
   تزریق آن با جاوااسکریپت باعث می‌شد رندرکنندهٔ WebGL راه نیفتد و کادر خالی بماند.
   اینجا فقط لایهٔ «در حال بارگذاری» مدیریت می‌شود. */
const splineHost = document.querySelector('[data-spline]');
if (splineHost) {
  const splineViewer = splineHost.querySelector('spline-viewer');
  const splineLoading = splineHost.querySelector('[data-spline-loading]');
  const markSplineReady = () => splineHost.classList.add('is-ready');

  if (splineViewer) {
    /* کامپوننت رویداد load قابل اتکایی نمی‌دهد؛ آماده‌بودن از نسبت canvas
       به کادر تشخیص داده می‌شود. تا نیامدن صحنه، canvas روی ۳۰۰×۱۵۰ می‌ماند. */
    const readyPoll = setInterval(() => {
      const canvas = splineViewer.shadowRoot && splineViewer.shadowRoot.querySelector('canvas');
      const box = splineViewer.getBoundingClientRect();
      if (!canvas || !canvas.width || !box.width || !box.height) return;
      if (Math.abs((canvas.width / canvas.height) - (box.width / box.height)) > 0.05) return;
      clearInterval(readyPoll);
      markSplineReady();
    }, 400);

    /* اگر پس از ۳۰ ثانیه صحنه نیامد، چرخنده جای خود را به پیام روشن می‌دهد
       (لایه برداشته نمی‌شود تا کادر خاکستریِ خالی دیده نشود) */
    setTimeout(() => {
      if (!splineHost.classList.contains('is-ready') && splineLoading) {
        splineLoading.innerHTML = '<b>نمایش سه‌بعدی در این مرورگر بارگذاری نشد</b>';
      }
    }, 30000);
  }
}

/* آیکون‌های پیام‌رسان در کف فوتر: با رسیدن کاربر به انتهای صفحه،
   آیکون‌ها از بالا می‌افتند و روی لبهٔ پایین سایت می‌نشینند.
   کلاس حالت اولیه فقط از همین‌جا اضافه می‌شود؛ اگر جاوااسکریپت اجرا نشود
   آیکون‌ها از ابتدا سر جای خودشان دیده می‌شوند (بدون پرش یا عنصر نامرئی). */
(() => {
  const rail = document.querySelector('.social-rail');
  if (!rail) return;
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const items = Array.from(rail.querySelectorAll('.social-item'));
  if (!items.length) return;

  let done = false;
  const land = () => {
    if (done) return;
    done = true;
    items.forEach((el, i) => {
      /* تاخیر پله‌ای: اول تلگرام، بعد ایتا، بعد بله — مثل افتادن پی‌درپی */
      el.style.transitionDelay = (i * 90) + 'ms';
      el.classList.add('is-landed');
    });
  };

  rail.classList.add('is-falling');

  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      land();
      io.disconnect();
    }
  }, { threshold: 0.35 });

  io.observe(rail);

  /* تور نجات: اگر ناظر به هر دلیلی شلیک نکند، آیکون‌ها نباید نامرئی بمانند */
  setTimeout(land, 3500);
})();
