const galleryItems = [
  ['baghale ifel.jpg','دکور و استند','decor','باغچه‌ی ایفل'],['ChatGPT Image Sep 22, 2026, 07_34_38 PM.png','دکور و استند','decor','فرم مفهومی سفارشی'],['cnc-دیوار-باستانی.jpg','دکور و استند','decor','دیوار باستانی CNC'],['ifel.jpg','دکور و استند','decor','المان شهری'],['اب پرتقال-طراحی.jpg','غذایی و تبلیغاتی','food','کمپین آب‌پرتقال'],['استند-زمینی.png','دکور و استند','decor','استند زمینی'],['استند-نمایشگاهی۳.jpg','دکور و استند','decor','استند نمایشگاهی'],['استند-نمایشگاه۲.jpg','دکور و استند','decor','چیدمان نمایشگاهی'],['برش-هندوانه.jpg','غذایی و تبلیغاتی','food','فرم تبلیغاتی هندوانه'],['بسته بندی-بشقاب.jpg','بسته‌بندی','pack','محافظ بشقاب'],['بسته بندی-قطعه-خودرو.png','بسته‌بندی','pack','محافظ قطعه خودرو'],['بسته بندی-لوستر.png','بسته‌بندی','pack','بسته‌بندی لوستر'],['بسته بندی-کریستال.jpg','بسته‌بندی','pack','محافظ کریستال'],['بسته بندی-گل-رنگین-کمونی.jpg','بسته‌بندی','pack','فرم محافظ گل'],['تابلو-پگاه.jpg','دکور و استند','decor','تابلو و استند پگاه'],['دانه-قهوه.jpg','غذایی و تبلیغاتی','food','فرم تبلیغاتی قهوه'],['دکور تاتر-رنگی.jpg','دکور و استند','decor','دکور تئاتر'],['سفره-یلدا.png','غذایی و تبلیغاتی','food','صحنه‌ی یلدا'],['شامپو-شاورما.jpg','غذایی و تبلیغاتی','food','ماکت محصول'],['صحنه-صداسیما.jpg','دکور و استند','decor','صحنه‌ی صدا و سیما'],['صورتک-آدم.jpg','قالب‌سازی','mold','فرم چهره'],['فرایند ساخت. . .jpg','قالب‌سازی','mold','فرایند ساخت'],['قلعه.jpg','قالب‌سازی','mold','قلعه و حجم‌پردازی'],['قیچی-انبر.jpg','قالب‌سازی','mold','قالب ابزار'],['ماتیک-لاک-لوازم ارایش.jpg','بسته‌بندی','pack','محافظ لوازم آرایش'],['مجسمه-باستانی.png','دکور و استند','decor','مجسمه باستانی'],['موتور-آدم-خام.jpg','قالب‌سازی','mold','فرم خام'],['موتور-آدم.jpg','قالب‌سازی','mold','فرم پرداخت‌شده'],['موتور-خام.jpg','قالب‌سازی','mold','بلوک خام'],['موتورسیکلت.jpg','قالب‌سازی','mold','ماکت موتورسیکلت'],['کیک-کروسان.jpg','غذایی و تبلیغاتی','food','فرم تبلیغاتی کروسان'],['۳۵انیورسری.jpg','دکور و استند','decor','جشن ۳۵ سالگی']
];
const asset = (name) => `assets/${encodeURIComponent(name)}`;
const grid = document.querySelector('#gallery-grid');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');

function renderGallery(filter = 'all') {
  grid.innerHTML = galleryItems.filter(([, , category]) => filter === 'all' || category === filter).map(([name, label, category, title], index) => `
    <button class="gallery-item reveal" data-image="${asset(name)}" data-caption="${title} / ${label}" aria-label="مشاهده ${title}">
      <img src="${asset(name)}" alt="${title}" loading="lazy"><span>${String(index + 1).padStart(2, '0')}</span><div><b>${title}</b><small>${label}</small></div>
    </button>`).join('');
  grid.querySelectorAll('.gallery-item').forEach((item) => item.addEventListener('click', () => openLightbox(item.dataset.image, item.dataset.caption)));
  observeReveals();
}
function openLightbox(src, caption) { lightboxImage.src = src; lightboxImage.alt = caption; lightboxCaption.textContent = caption; lightbox.showModal(); }
lightbox.addEventListener('click', (event) => { if (event.target === lightbox || event.target.closest('.lightbox-close')) lightbox.close(); });
document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => { document.querySelector('.filter.active').classList.remove('active'); button.classList.add('active'); renderGallery(button.dataset.filter); }));
const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: 0.12 });
function observeReveals() { document.querySelectorAll('.reveal:not(.is-visible)').forEach((element) => observer.observe(element)); }
observeReveals(); renderGallery();
const menuToggle = document.querySelector('.menu-toggle'); const nav = document.querySelector('nav');
menuToggle.addEventListener('click', () => { const open = menuToggle.getAttribute('aria-expanded') === 'true'; menuToggle.setAttribute('aria-expanded', String(!open)); nav.classList.toggle('nav-open', !open); });
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { nav.classList.remove('nav-open'); menuToggle.setAttribute('aria-expanded', 'false'); }));
window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && lightbox.open) lightbox.close(); });
