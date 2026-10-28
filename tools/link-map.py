# -*- coding: utf-8 -*-
"""ساخت نقشهٔ پیوندهای داخلی سایت در docs/internal-links.md

اجرا از ریشهٔ پروژه:  python tools/link-map.py
لینک‌های زمینه‌ای (داخل متن) از لینک‌های ناوبری جدا می‌شوند تا کیفیت لینک‌سازی داخلی قابل بررسی باشد.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index.html", "services.html", "portfolio.html", "applications.html", "contact.html"]
LINK = re.compile(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>', re.S | re.I)
TAGS = re.compile(r'<[^>]+>')


def visible(html: str) -> str:
    return re.sub(r'\s+', ' ', TAGS.sub('', html)).strip()


rows = []
for page in PAGES:
    html = (ROOT / page).read_text(encoding="utf-8")
    # فقط بدنهٔ main (لینک‌های زمینه‌ای)، نه هدر/فوتر
    main = html.split("<main", 1)[-1].split("</main>", 1)[0]
    for href, text in LINK.findall(main):
        if href.startswith(("http", "mailto:", "tel:", "#")):
            continue
        rows.append((page, visible(text) or "(بدون متن)", href))

out = ["# نقشهٔ پیوندهای داخلی (Internal Link Map)", "",
       "لینک‌های زمینه‌ای داخل متن هر صفحه؛ لینک‌های نوار ناوبری و فوتر در این فهرست نیامده‌اند.",
       "هدف: هر صفحه از هر چهار صفحهٔ دیگر لینک بگیرد و متن لنگر توصیفی باشد (نه «اینجا کلیک کنید»).", ""]
for page in PAGES:
    targets = sorted({href for source, _, href in rows if source == page})
    out.append(f"## از {page}")
    out.append("")
    out.append("| متن لنگر | مقصد |")
    out.append("| --- | --- |")
    for source, text, href in rows:
        if source == page:
            out.append(f"| {text} | `{href}` |")
    out.append("")
    out.append(f"مقصدها: {len(targets)} پیوند یکتا")
    out.append("")

out += ["## پیوندهای دریافتی هر صفحه", "", "| صفحهٔ مقصد | از کدام صفحه‌ها |", "| --- | --- |"]
for page in PAGES:
    sources = sorted({source for source, _, href in rows if href.split("#")[0].split("?")[0] == page})
    out.append(f"| {page} | {', '.join(sources) if sources else '—'} |")
out.append("")

(ROOT / "docs" / "internal-links.md").write_text("\n".join(out), encoding="utf-8")
print("docs/internal-links.md ساخته شد", file=open(1, "w", encoding="utf-8", closefd=False))
