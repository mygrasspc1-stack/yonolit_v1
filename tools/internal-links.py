"""Internal-linking pass: hub blocks + long-tail footer anchors + docs link cleanup.

Idempotent: skips pages that already contain the ilinks block.
"""
import re
import sys

PAGES = {
    'index.html': {
        'id': 'ilinks-index',
        'title': 'صفحه‌های کلیدی سایت',
        'links': [
            ('cnc.html#pricing', 'قیمت برش CNC یونولیت چطور حساب می‌شود', 'پنج متغیر هزینه: ابعاد، ضخامت، پیچیدگی فرم، تیراژ و پوشش.'),
            ('services.html#decor', 'ساخت استند نمایشگاهی با یونولیت', 'فرم بزرگ با وزن کم؛ نصب بدون جرثقیل سنگین.'),
            ('services.html#pack', 'قالب بسته‌بندی یونولیت برای قطعات صنعتی', 'جیب و تکیه‌گاه بر اساس ابعاد دقیق قطعه.'),
            ('applications.html#compare', 'یونولیت یا MDF و گچ؛ انتخاب برای المان حجمی', 'جدول مقایسه در پنج معیار: وزن، سرعت، هزینه، دوام، شکل‌پذیری.'),
            ('portfolio.html#gallery', 'نمونه‌کارهای یونولیت به تفکیک دسته', 'دکور، بسته‌بندی و ماکت؛ عکس اجرای واقعی.'),
            ('contact.html#request-form', 'استعلام قیمت با ارسال فایل یا عکس', 'برآورد بر اساس ابعاد، تیراژ و زمان تحویل.'),
        ],
    },
    'services.html': {
        'id': 'ilinks-services',
        'title': 'خدمات مرتبط با همین بخش',
        'links': [
            ('cnc.html#process', 'مراحل برش CNC یونولیت از فایل تا تحویل', 'شش گام: فایل، بررسی، برش، پرداخت، کنترل، ارسال.'),
            ('cnc.html#limits', 'محدودیت برش یونولیت و ضخامت مجاز', 'کجا فرم شکسته می‌شود و کجا باید متریال عوض شود.'),
            ('portfolio.html?category=decor', 'نمونه‌کارهای استند و دکور یونولیتی', 'پروژه‌های اجراشده با عکس و ابعاد.'),
            ('applications.html#compare', 'مقایسه یونولیت با MDF، گچ و فلز', 'کدام متریال برای کدام کاربرد ارزان‌تر و سریع‌تر است.'),
            ('services.html#pricing', 'پنج متغیر قیمت ساخت یونولیت', 'چه چیزی قیمت را بالا می‌برد و چه چیزی پایین.'),
            ('contact.html#request-form', 'ثبت درخواست ساخت با ابعاد و فایل', 'فرم کوتاه؛ پاسخ با برآورد اولیه.'),
        ],
    },
    'cnc.html': {
        'id': 'ilinks-cnc',
        'title': 'ادامهٔ مسیر برش CNC',
        'links': [
            ('services.html#mold', 'ساخت ماکت و مجسمه با برش CNC', 'از فایل سه‌بعدی تا فرم حجمی آمادهٔ پوشش.'),
            ('services.html#pack', 'قالب بسته‌بندی EPS با برش CNC', 'جیب‌های محافظ بر اساس فرم قطعه.'),
            ('applications.html#industries', 'کاربرد برش CNC یونولیت در صنایع', 'نمایشگاه، صحنه، معماری، بسته‌بندی.'),
            ('portfolio.html?category=mold', 'نمونه‌کارهای برش‌خورده ماکت و مجسمه', 'خروجی واقعی دستگاه روی یونولیت.'),
            ('cnc.html#limits', 'ضخامت و ابعاد مجاز برش', 'سقف ابعاد و مرزهای تلورانس.'),
            ('contact.html#request-form', 'ارسال فایل برش و گرفتن برآورد', 'فایل سه‌بعدی، نقشه یا عکس کافی است.'),
        ],
    },
    'portfolio.html': {
        'id': 'ilinks-portfolio',
        'title': 'از نمونه‌کار به تصمیم',
        'links': [
            ('cnc.html#what', 'برش CNC یونولیت چیست و چه شکلی می‌سازد', 'تفاوت برش سیمی، دستی و فرز CNC.'),
            ('services.html#process', 'هشت گام ساخت، از فایل تا نصب', 'ترتیب کار و نقطه‌های تأیید شما.'),
            ('applications.html#expo', 'کاربرد نمایشگاهی یونولیت', 'استند، بک‌دراپ و ویترین با فرم سفارشی.'),
            ('services.html#pricing', 'چه چیزی قیمت پروژه را تعیین می‌کند', 'پنج متغیر مؤثر بر هزینهٔ نهایی.'),
            ('portfolio.html?category=pack', 'نمونه‌کارهای بسته‌بندی و قالب', 'قالب‌های محافظ قطعات حساس.'),
            ('contact.html#request-form', 'درخواست پروژهٔ مشابه', 'عکس یا ابعاد بفرستید؛ برآورد می‌گیرید.'),
        ],
    },
    'applications.html': {
        'id': 'ilinks-applications',
        'title': 'کاربرد، متریال و قیمت',
        'links': [
            ('cnc.html#materials', 'برش CNC روی کدام گرید یونولیت', 'دانسیته و تأثیرش بر سطح برش.'),
            ('services.html#urban', 'المان شهری و محوطه با یونولیت', 'حجم بزرگ، نصب سبک، پوشش مقاوم.'),
            ('portfolio.html#stories', 'روایت پروژه‌ها با عکس اجرا', 'قبل و بعدِ ساخت در پروژه‌های واقعی.'),
            ('services.html#deliverables', 'تحویل‌دادنی هر خدمت', 'دقیقاً چه چیزی دریافت می‌کنید.'),
            ('cnc.html#pricing', 'هزینهٔ برش CNC یونولیت', 'پنج متغیر مؤثر بر قیمت.'),
            ('contact.html#request-form', 'مشاورهٔ کاربرد برای پروژهٔ شما', 'انتخاب متریال بر اساس شرایط اجرا.'),
        ],
    },
    'contact.html': {
        'id': 'ilinks-contact',
        'title': 'قبل از ارسال درخواست',
        'links': [
            ('services.html#deliverables', 'چه چیزی تحویل می‌گیرید', 'فایل اجرایی، قطعهٔ برش‌خورده یا نصب نهایی.'),
            ('cnc.html#what', 'برش CNC یونولیت چیست', 'روش ساخت و تلورانس ابعاد.'),
            ('portfolio.html#cases', 'پروژه‌های اجراشده', 'نمونه‌های مشابه درخواست شما.'),
            ('applications.html#limits', 'مرزهای استفاده از یونولیت', 'کجا این متریال پاسخ نمی‌دهد.'),
            ('services.html#pricing', 'چه چیزی روی قیمت اثر دارد', 'ابعاد، تیراژ، پوشش و زمان.'),
            ('index.html#process', 'فرایند کار در یک نگاه', 'از تماس اول تا تحویل.'),
        ],
    },
}

FOOTER_ANCHORS = [
    ('خانه', 'صفحه اصلی'),
    ('خدمات', 'خدمات ساخت با یونولیت'),
    ('برش CNC', 'برش CNC یونولیت'),
    ('برش با فرز CNC', 'برش CNC یونولیت'),
    ('نمونه‌کارها', 'نمونه‌کارهای یونولیت'),
    ('کاربردها', 'کاربردهای یونولیت'),
    ('درخواست ساخت', 'استعلام قیمت و درخواست ساخت'),
]

DOC_REPLACEMENTS = {
    'index.html': [('<a href="docs/market-research.md">گزارش بازار</a>',
                    '<a href="applications.html#market">داده‌های بازار یونولیت</a>')],
    'services.html': [('<a href="docs/market-research.md" data-page-node-id="4z0yYPiGSSIX1I4IyoRiVI">market-research.md</a>',
                       '<a href="contact.html#request-form" data-page-node-id="4z0yYPiGSSIX1I4IyoRiVI">برآورد پروژه‌ای</a>'),
                      ('<a href="docs/market-research.md" data-page-node-id="LHw1873L7hwbh7aIYnph8L">گزارش بازار</a>',
                       '<a href="applications.html#market" data-page-node-id="LHw1873L7hwbh7aIYnph8L">داده‌های بازار یونولیت</a>')],
    'cnc.html': [('<a href="docs/market-research.md" data-page-node-id="hdk8D2b9bpDS2Ygs01FRbG">گزارش بازار</a>',
                  '<a href="applications.html#market" data-page-node-id="hdk8D2b9bpDS2Ygs01FRbG">داده‌های بازار یونولیت</a>')],
    'portfolio.html': [('<a href="docs/lead-research.md">بریف مشتریان B2B</a>',
                        '<a href="services.html#process">فرایند ساخت پروژه</a>')],
    'applications.html': [('<a href="docs/market-research.md" style="border-bottom:1px solid currentColor">market-research.md</a>',
                           '<a href="#market" style="border-bottom:1px solid currentColor">بخش بازار همین صفحه</a>'),
                          ('<a href="docs/market-research.md">گزارش بازار</a>',
                           '<a href="#market">داده‌های بازار یونولیت</a>')],
    'contact.html': [('<a href="docs/market-research.md">گزارش بازار</a>',
                      '<a href="applications.html#market">داده‌های بازار یونولیت</a>')],
}


def build_block(spec):
    items = '\n'.join(
        f'      <a class="ilink" href="{href}"><b>{title}</b><span>{desc}</span></a>'
        for href, title, desc in spec['links']
    )
    return (
        '\n  <!-- بلوک لینک‌سازی داخلی: شش مقصد مرتبط با همین صفحه، با انکر متنی بلند -->\n'
        f'  <section class="section ilinks" aria-labelledby="{spec["id"]}">\n'
        '    <div class="ilinks-head">\n'
        '      <div><p class="kicker">مسیرهای مرتبط</p>\n'
        f'      <h2 id="{spec["id"]}">{spec["title"]}</h2></div>\n'
        '      <p class="ilinks-side">هر لینک، یک تصمیم مشخص را کوتاه می‌کند: قیمت، متریال، نمونه یا درخواست.</p>\n'
        '    </div>\n'
        '    <nav class="ilinks-grid" aria-label="لینک‌های مرتبط">\n'
        f'{items}\n'
        '    </nav>\n'
        '  </section>\n'
    )


def rewrite_footer_nav(footer_html):
    for old, new in FOOTER_ANCHORS:
        footer_html = re.sub(
            r'(<a [^>]*href="(?:index|services|cnc|portfolio|applications|contact)\.html"[^>]*>)' + re.escape(old) + r'(</a>)',
            lambda m, new=new: m.group(1) + new + m.group(2),
            footer_html,
            count=1,
        )
    return footer_html


def main():
    changed = []
    for page, spec in PAGES.items():
        with open(page, encoding='utf-8') as fh:
            html = fh.read()
        original = html

        for old, new in DOC_REPLACEMENTS.get(page, []):
            if old in html:
                html = html.replace(old, new)

        m = re.search(r'<footer\b.*?</footer>', html, re.S)
        if m:
            html = html[:m.start()] + rewrite_footer_nav(m.group(0)) + html[m.end():]

        if 'class="section ilinks"' not in html:
            idx = html.find('<footer')
            if idx == -1:
                print(f'  !! {page}: footer not found')
                continue
            html = html[:idx] + build_block(spec) + '\n' + html[idx:]

        if html != original:
            with open(page, 'w', encoding='utf-8') as fh:
                fh.write(html)
            changed.append(page)

    print('changed:', ', '.join(changed) if changed else 'none')
    return 0


if __name__ == '__main__':
    sys.exit(main())
