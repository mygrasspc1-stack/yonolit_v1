# -*- coding: utf-8 -*-
"""Replace the footer text chips with an icon rail anchored to the page floor."""
import io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ["index.html", "services.html", "cnc.html", "portfolio.html",
         "applications.html", "contact.html"]

TG, EITAA, BALE = ("https://t.me/yonolitdecor",
                   "https://eitaa.com/yonolitdecorr",
                   "https://ble.ir/yonolitdecor")


def item(href, name, icon):
    return (
        '<a class="social-item" href="%s" target="_blank" rel="noopener" '
        'aria-label="%s یونولیت دکور"><span>%s</span>'
        '<img src="assets/social/%s" alt="%s یونولیت دکور" width="40" height="40" '
        'loading="lazy" decoding="async"></a>' % (href, name, name, icon, name)
    )


RAIL = (
    '<div class="social-rail" aria-label="یونولیت دکور در پیام‌رسان‌ها">'
    + item(TG, "تلگرام", "telegram.png")
    + item(EITAA, "ایتا", "eitaa.svg")
    + item(BALE, "بله", "bale.png")
    + '</div>'
)


def chip(href, name, icon):
    """چیپ افقی صفحهٔ تماس: آیکون + متن، برای خوانایی در ستون باریک."""
    return ('<a href="%s" target="_blank" rel="noopener">'
            '<img src="assets/social/%s" alt="%s" width="15" height="15" '
            'loading="lazy" decoding="async">%s</a>' % (href, icon, name, name))


for page in PAGES:
    p = os.path.join(ROOT, page)
    s = io.open(p, encoding="utf-8").read()
    before = s

    # ۱) چیپ‌های متنی فوتر حذف می‌شوند
    s = re.sub(r'<div class="footer-social">.*?</div>', '', s, flags=re.S)

    # ۲) ریل آیکون‌ها به‌عنوان آخرین فرزند فوتر (کف صفحه)
    if 'social-rail' not in s:
        s = s.replace('</footer>', RAIL + '</footer>', 1)

    # ۳) چیپ‌های صفحهٔ تماس آیکون‌دار می‌شوند
    if page == "contact.html":
        s = re.sub(
            r'<a href="' + re.escape(TG) + r'" target="_blank" rel="noopener">تلگرام</a>',
            chip(TG, "تلگرام", "telegram.png"), s)
        s = re.sub(
            r'<a href="' + re.escape(EITAA) + r'" target="_blank" rel="noopener">ایتا</a>',
            chip(EITAA, "ایتا", "eitaa.svg"), s)
        s = re.sub(
            r'<a href="' + re.escape(BALE) + r'" target="_blank" rel="noopener">بله</a>',
            chip(BALE, "بله", "bale.png"), s)

    # ۴) بامپ کش
    s = re.sub(r"styles\.css\?v=\d+", "styles.css?v=19", s)
    s = re.sub(r"script\.js\?v=\d+", "script.js?v=10", s)

    if s != before:
        io.open(p, "w", encoding="utf-8", newline="").write(s)
    print("%-18s rail=%s chips=%s" % (
        page, 'social-rail' in s, 'footer-social' not in s))
