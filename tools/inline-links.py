"""Add contextual in-body links (long-tail anchors) at precise insertion points.

Each entry: page, marker phrase (unique), sentence appended before the closing </p>.
Idempotent: skips when the sentence is already present.
"""
import sys

EDITS = [
    (
        'index.html',
        'ایده‌های شما را با EPS، مدل‌سازی سه‌بعدی و برش CNC',
        ' روش کار و تلورانس ابعاد در <a href="cnc.html#what">برش CNC یونولیت</a> توضیح داده شده است.',
    ),
    (
        'services.html',
        'بدون جرثقیل سنگین',
        ' سقف ابعاد و ضخامت مجاز در <a href="cnc.html#limits">محدودیت‌های برش یونولیت</a> آمده است.',
    ),
    (
        'cnc.html',
        'لبه‌ی قطعه از همان مرحله',
        ' تفاوت این روش با برش سیمی و برش حرارتی در <a href="#compare">جدول مقایسه‌ی همین صفحه</a> آمده است.',
    ),
    (
        'applications.html',
        'نصب با نیروی کمتر و بدون تجهیزات سنگین',
        ' نمونه‌های اجراشده در <a href="portfolio.html?category=decor">نمونه‌کارهای استند نمایشگاهی</a> قابل دیدن است.',
    ),
    (
        'portfolio.html',
        'قالب محافظ بر اساس فرم دقیق قطعه',
        ' روش ساخت این قالب‌ها در <a href="services.html#pack">خدمت قالب و بسته‌بندی محافظ</a> آمده است.',
    ),
]


def main():
    for page, marker, sentence in EDITS:
        with open(page, encoding='utf-8') as fh:
            html = fh.read()
        if sentence.strip() in html:
            print(f'  skip {page} (already linked)')
            continue
        pos = html.find(marker)
        if pos == -1:
            print(f'  !! {page}: marker not found -> {marker}')
            continue
        end = html.find('</p>', pos)
        if end == -1:
            print(f'  !! {page}: no </p> after marker')
            continue
        html = html[:end] + sentence + html[end:]
        with open(page, 'w', encoding='utf-8') as fh:
            fh.write(html)
        print(f'  ok {page}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
