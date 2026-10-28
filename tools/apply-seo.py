# -*- coding: utf-8 -*-
"""اعمال متادیتای SEO، Open Graph، hreflang و اسکیمای JSON-LD روی پنج صفحه‌ی سایت.

اجرا از ریشه‌ی پروژه:  python tools/apply-seo.py
- متاهای قبلی <head> (description/theme-color/icon/title) با بلوک کامل جایگزین می‌شوند.
- همه‌ی بلوک‌های <script type="application/ld+json"> با گراف اسکیمای همین اسکریپت جایگزین می‌شوند.
- نام برند «یونولیت استودیو» به «یونولیت دکور» و دامنه‌ی yonolit.studio به yonolitdecor.ir تغییر می‌کند.
- sitemap.xml و robots.txt در ریشه‌ی سایت ساخته می‌شوند.
قبل از اجرا از فایل‌ها نسخه‌ی پشتیبان در tools/_backup-head/ گرفته می‌شود.
"""
from pathlib import Path
import json
import re
import shutil

ROOT = Path(__file__).resolve().parent.parent
DOMAIN = "https://yonolitdecor.ir"
BRAND = "یونولیت دکور"
BACKUP = ROOT / "tools" / "_backup-head"

PAGES = ["index.html", "services.html", "portfolio.html", "applications.html", "contact.html"]

ORG_ID = f"{DOMAIN}/#organization"
SITE_ID = f"{DOMAIN}/#website"

ORG = {
    "@type": "Organization",
    "@id": ORG_ID,
    "name": BRAND,
    "alternateName": "Yonolit Decor",
    "description": "ساخت سفارشی دکور، استند نمایشگاهی، ماکت و مجسمه، المان حجمی و قالب بسته‌بندی با یونولیت (فوم EPS) و برش CNC.",
    "url": f"{DOMAIN}/",
    "logo": {"@type": "ImageObject", "url": f"{DOMAIN}/assets/site_logo.webp", "width": 512, "height": 512},
    "image": f"{DOMAIN}/assets/baseball-ball-mockup.webp",
    "areaServed": {"@type": "Country", "name": "ایران"},
    "knowsLanguage": "fa-IR",
    "knowsAbout": [
        "یونولیت", "فوم EPS", "پلی‌استایرن منبسط‌شده", "برش CNC یونولیت",
        "دکور صحنه", "استند نمایشگاهی", "ماکت و مجسمه", "قالب بسته‌بندی",
    ],
}

WEBSITE = {
    "@type": "WebSite",
    "@id": SITE_ID,
    "url": f"{DOMAIN}/",
    "name": BRAND,
    "inLanguage": "fa-IR",
    "publisher": {"@id": ORG_ID},
}

# تصاویر کلیدی: نام فایل، عنوان، توضیح، ابعاد
IMAGES = {
    "baseball-ball-mockup": ("المان حجمی توپ بیسبال", "ماکت و المان حجمی توپ بیسبال با یونولیت EPS و برش حرارتی؛ سه مرحله‌ی قبل، در حال ساخت و نهایی.", 1536, 1024),
    "eps-astronaut-mockup": ("ماکت حجمی فضانورد", "ماکت فضانورد سفارشی با یونولیت EPS و پوشش ضد ضربه برای نمایش محصول.", 1024, 1536),
    "peghah-3d-brand-logo": ("لوگوی سه‌بعدی و ماکت برند", "لوگوی حجمی سه‌بعدی برند و ماکت محصول، ساخته‌شده با فوم انبساطی EPS برای رویداد و کمپین.", 1487, 976),
    "exhibition-stand-branding": ("استند نمایشگاهی برندینگ", "استند نمایشگاهی یونولیتی برای غرفه و رویداد برندینگ با طراحی و اجرای رنگ سازمانی.", 1447, 1087),
    "university-stand-3d-letters": ("تابلو و حروف برجسته", "تابلو و حروف برجسته‌ی یونولیتی با برش CNC و رنگ‌آمیزی صنعتی برای رویداد و نمایشگاه.", 1447, 1087),
    "arvin-sanat-asia-3d-logo": ("لوگوی سه‌بعدی روی دیوار", "نشان حجمی و لوگوی سه‌بعدی نصب‌شده روی دیوار، ساخته‌شده با یونولیت و برش CNC.", 626, 858),
    "yonolit-decorative-panel-simcard": ("پنل دکوراتیو دیواری", "پنل دکوراتیو یونولیتی با برش CNC برای دیوارپوش داخلی؛ وزن سبک، مقاوم و نصب آسان.", 1024, 1536),
    "custom-eps-packaging-mold": ("قالب و بسته‌بندی سفارشی", "ساخت قالب و بسته‌بندی سفارشی یونولیتی برای محافظت از قطعات صنعتی و کالای شکستنی.", 1536, 1024),
}


def image_object(key, page_url):
    name, description, width, height = IMAGES[key]
    return {
        "@type": "ImageObject",
        "@id": f"{page_url}#image-{key}",
        "contentUrl": f"{DOMAIN}/assets/{key}.webp",
        "url": f"{DOMAIN}/assets/{key}.webp",
        "name": name,
        "description": description,
        "width": width,
        "height": height,
        "caption": name,
        "representativeOfPage": False,
        "creator": {"@id": ORG_ID},
        "copyrightHolder": {"@id": ORG_ID},
    }


def breadcrumb(page_url, name):
    return {
        "@type": "BreadcrumbList",
        "@id": f"{page_url}#breadcrumb",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "خانه", "item": f"{DOMAIN}/"},
            {"@type": "ListItem", "position": 2, "name": name, "item": page_url},
        ],
    }


def web_page(page_url, name, description):
    return {
        "@type": "WebPage",
        "@id": f"{page_url}#webpage",
        "url": page_url,
        "name": name,
        "description": description,
        "inLanguage": "fa-IR",
        "isPartOf": {"@id": SITE_ID},
        "about": {"@id": ORG_ID},
        "primaryImageOfPage": {"@id": f"{page_url}#image-baseball-ball-mockup"},
    }


FAQ_HOME = [
    ("یونولیت دقیقاً چه متریالی است و چه تفاوتی با پلاستوفوم دارد؟",
     "یونولیت نام رایج پلی‌استایرن منبسط‌شده (EPS) در ایران است؛ همان متریالی که در بازار با نام پلاستوفوم هم شناخته می‌شود. تفاوت اصلی در دانسیته (تراکم) و کاربرد است؛ برای کارهای دکوراتیو از بلوک با تراکم بالاتر استفاده می‌شود تا لبه‌ها تمیز برش بخورند."),
    ("چه پروژه‌هایی را می‌توان با یونولیت و برش CNC اجرا کرد؟",
     "چهار دستهٔ اصلی: استند و تبلیغات محیطی، دکور صحنه و مراسم، ماکت و مجسمهٔ حجمی، و قالب و بسته‌بندی سفارشی. از المان کوچک رومیزی تا سازهٔ بزرگ محوطه، بسته به ابعاد و محل نصب بررسی می‌شود."),
    ("برای ثبت درخواست ساخت سفارشی چه اطلاعاتی لازم است؟",
     "کاربرد قطعه، محل نصب (فضای داخلی، بیرونی یا حمل‌ونقل)، ابعاد تقریبی و تاریخ تحویل. تصویر مرجع یا فایل سه‌بعدی برآورد را دقیق‌تر می‌کند، اما الزامی نیست."),
    ("یونولیت برای فضای باز، رطوبت و ضربه مناسب است؟",
     "با پوشش سطحی و رنگ صنعتی مقاوم به آفتاب، برای محوطه و استفادهٔ فصلی مناسب است. برای اجرای دائمی، سازهٔ نگه‌دارندهٔ جداگانه لازم است؛ چون یونولیت فرم را می‌دهد نه بار سازه را."),
    ("هزینهٔ ساخت با یونولیت بر چه اساسی محاسبه می‌شود؟",
     "پنج متغیر: دانسیته و حجم فرم، پیچیدگی برش و تعداد قطعات، نوع پوشش و رنگ، حمل و نصب در محل، و مهلت تحویل. عدد قطعی از روی تصویر قابل تعیین نیست."),
]

FAQ_APP = [
    ("یونولیت برای کدام کاربردها انتخاب درستی است؟",
     "فرم‌های بزرگ و سبک، ماکت و مجسمه، استند و دکور، بسته‌بندی محافظ و المان‌های محوطه‌ای که با پوشش مناسب اجرا می‌شوند."),
    ("یونولیت برای بارهای سنگین سازه‌ای مناسب است؟",
     "نه. یونولیت متریال باربر نیست؛ فرم و حجم را می‌سازد و بار باید توسط سازه‌ی جداگانه تحمل شود."),
    ("المان یونولیتی در فضای باز چه محدودیتی دارد؟",
     "با پوشش ضدآب و رنگ مقاوم به UV برای استفاده‌ی فصلی و محوطه مناسب است؛ دوام نهایی به نوع پوشش و نگهداری بستگی دارد."),
    ("امکان تولید سری و تکرار قالب وجود دارد؟",
     "بله. قالب و نقشه‌ی هر پروژه ذخیره می‌شود و سفارش‌های بعدی با همان ابعاد تکرار می‌شوند."),
]


def faq(items):
    return {
        "@type": "FAQPage",
        "inLanguage": "fa-IR",
        "mainEntity": [
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": a}}
            for q, a in items
        ],
    }


HOWTO = {
    "@type": "HowTo",
    "name": "فرایند ساخت سفارشی با یونولیت (EPS)",
    "inLanguage": "fa-IR",
    "step": [
        {"@type": "HowToStep", "position": 1, "name": "دریافت ایده و فایل", "text": "دریافت فایل سه‌بعدی، اسکچ، تصویر مرجع یا توضیح پروژه."},
        {"@type": "HowToStep", "position": 2, "name": "طراحی و مدل‌سازی سه‌بعدی", "text": "تبدیل ایده به مدل قابل برش با ابعاد و محدودیت‌های اجرایی."},
        {"@type": "HowToStep", "position": 3, "name": "انتخاب متریال و دانسیته", "text": "انتخاب EPS با تراکم متناسب با وزن نهایی و نوع پوشش."},
        {"@type": "HowToStep", "position": 4, "name": "برش CNC و سیم داغ", "text": "برش دقیق قطعات، منحنی‌ها و حفره‌های داخلی."},
        {"@type": "HowToStep", "position": 5, "name": "مونتاژ و شکل‌دهی", "text": "اتصال قطعات، تراش نهایی و آماده‌سازی سطح."},
        {"@type": "HowToStep", "position": 6, "name": "پوشش سطحی و رنگ", "text": "لایهٔ محافظ، ضدآب یا مقاوم به UV، سپس رنگ‌آمیزی صنعتی."},
        {"@type": "HowToStep", "position": 7, "name": "کنترل کیفیت", "text": "بازبینی جزئیات، ابعاد نهایی و یکنواختی سطح."},
        {"@type": "HowToStep", "position": 8, "name": "حمل و نصب", "text": "قطعه‌بندی، بسته‌بندی سفر، حمل و نصب در محل پروژه."},
    ],
}


def service(key, name, description, page_url):
    return {
        "@type": "Service",
        "@id": f"{page_url}#{key}",
        "name": name,
        "serviceType": name,
        "description": description,
        "url": f"{page_url}#{key}",
        "provider": {"@id": ORG_ID},
        "areaServed": {"@type": "Country", "name": "ایران"},
        "availableChannel": {"@type": "ServiceChannel", "serviceUrl": f"{DOMAIN}/contact.html"},
        "image": image_object("exhibition-stand-branding" if key == "decor" else
                              "custom-eps-packaging-mold" if key == "pack" else
                              "eps-astronaut-mockup" if key == "mold" else
                              "university-stand-3d-letters", page_url),
    }


def page_definitions():
    home = f"{DOMAIN}/"
    services = f"{DOMAIN}/services.html"
    portfolio = f"{DOMAIN}/portfolio.html"
    applications = f"{DOMAIN}/applications.html"
    contact = f"{DOMAIN}/contact.html"

    return {
        "index.html": dict(
            title=f"{BRAND} | ساخت سفارشی دکور، استند و ماکت با یونولیت و فوم EPS",
            description="ساخت سفارشی دکور، استند نمایشگاهی، ماکت و مجسمه و قالب بسته‌بندی با یونولیت (فوم EPS) و برش CNC. نمونه‌کارهای واقعی را ببینید و درخواست پروژه را ثبت کنید.",
            url=home,
            og_type="website",
            og_image="baseball-ball-mockup",
            og_alt="المان حجمی توپ بیسبال ساخته‌شده با یونولیت، نمونه‌کار یونولیت دکور",
            graph=lambda: [
                ORG, WEBSITE,
                web_page(home, f"{BRAND} | ساخت سفارشی با یونولیت و فوم EPS",
                         "معرفی پروژه‌های واقعی ساخت دکور، استند، ماکت و قالب بسته‌بندی با یونولیت (فوم EPS) و برش CNC."),
                {
                    "@type": "ItemList",
                    "@id": f"{home}#featured",
                    "name": "پروژه‌های شاخص یونولیت دکور",
                    "itemListOrder": "https://schema.org/ItemListOrderAscending",
                    "numberOfItems": 3,
                    "itemListElement": [
                        {"@type": "ListItem", "position": 1, "item": image_object("baseball-ball-mockup", home)},
                        {"@type": "ListItem", "position": 2, "item": image_object("peghah-3d-brand-logo", home)},
                        {"@type": "ListItem", "position": 3, "item": image_object("university-stand-3d-letters", home)},
                    ],
                },
                faq(FAQ_HOME),
                HOWTO,
            ],
        ),
        "services.html": dict(
            title=f"خدمات {BRAND} | برش CNC، استند، ماکت، قالب و بسته‌بندی EPS",
            description="چهار گروه خدمات ساخت سفارشی با یونولیت: دکور و استند نمایشگاهی، ماکت و مجسمه با برش CNC، المان شهری و محوطه، و قالب و بسته‌بندی محافظ EPS — با فرایند هشت‌گامی ساخت.",
            url=services,
            og_type="website",
            og_image="exhibition-stand-branding",
            og_alt="استند نمایشگاهی یونولیتی با طراحی و اجرای رنگ سازمانی",
            graph=lambda: [
                web_page(services, f"خدمات و فرایند ساخت با یونولیت | {BRAND}",
                         "چهار گروه خدماتی که یونولیت دکور به شما عزیزان ارایِه میدهد شامل موارد زیر میباشد         ."),
                breadcrumb(services, "خدمات و فرایند"),
                service("decor", "استند نمایشگاهی، دکور و تبلیغات محیطی با یونولیت",
                        "ساخت استند نمایشگاهی، بک‌دراپ، تابلو حجمی، حروف برجسته و نشان سه‌بعدی برند با یونولیت و برش CNC؛ سبک برای نصب سریع در غرفه، فروشگاه و رویداد.", services),
                service("pack", "قالب و بسته‌بندی محافظ با فوم EPS",
                        "قالب‌سازی با فرزcnc و محافظ ضربه  بر اساس ابعاد دقیق قطعه، برای بسته‌بندی قطعات صنعتی، کالاهای شکستنی و حمل‌ونقل ایمن.", services),
                service("mold", "ماکت، مجسمه و قالب‌سازی با یونولیت",
                        "ساخت ماکت حجمی سفارشی، مجسمه و حجم‌های روایی با مدل‌سازی سه‌بعدی، برش CNC و تراش دستی؛ آماده‌ی پوشش و رنگ.", services),
                service("urban", "المان شهری و محوطه‌سازی با یونولیت",
                        "المان حجمی فضای باز، تابلوی ورودی مجموعه و نماد محوطه با پوشش ضدآب و رنگ مقاوم به UV، به‌همراه سازه‌ی نگه‌دارندهٔ مجزا.", services),
                HOWTO,
            ],
        ),
        "portfolio.html": dict(
            title=f"نمونه‌کارها | گالری پروژه‌های یونولیت، دکور صحنه، ماکت و بسته‌بندی",
            description="آرشیو تصویری پروژه‌های اجرایی با یونولیت و فوم EPS: حروف برجسته، لوگوی سه‌بعدی، ماکت حجمی، پنل دکوراتیو و قالب بسته‌بندی محصول؛ با فیلتر دسته و نورگیر تصویر.",
            url=portfolio,
            og_type="website",
            og_image="baseball-ball-mockup",
            og_alt="گالری پروژه‌های یونولیت دکور، المان حجمی توپ بیسبال",
            graph=lambda: [
                web_page(portfolio, f"نمونه‌کارهای {BRAND}",
                         "گالری پروژه‌های به اتمام رسیده     (فوم EPS) در دسته‌های استند های نمایشگاهی و تبلیغاتی، دکور و صحنه، مجسمه و ساخت ماکت ،  قالبسازی و بسته‌بندی."),
                breadcrumb(portfolio, "نمونه‌کارها"),
                {
                    "@type": "ImageGallery",
                    "@id": f"{portfolio}#gallery",
                    "name": "آرشیو پروژه‌های انجام شده یونولیت دکور",
                    "inLanguage": "fa-IR",
                    "isPartOf": {"@id": f"{portfolio}#webpage"},
                    "associatedMedia": [image_object(key, portfolio) for key in IMAGES],
                },
                {
                    "@type": "ItemList",
                    "@id": f"{portfolio}#stories",
                    "name": "سه روایت پروژه‌ای",
                    "numberOfItems": 3,
                    "itemListElement": [
                        {"@type": "ListItem", "position": 1, "item": image_object("baseball-ball-mockup", portfolio)},
                        {"@type": "ListItem", "position": 2, "item": image_object("eps-astronaut-mockup", portfolio)},
                        {"@type": "ListItem", "position": 3, "item": image_object("arvin-sanat-asia-3d-logo", portfolio)},
                    ],
                },
            ],
        ),
        "applications.html": dict(
            title="کاربردهای یونولیت EPS | از بازسازی صحنه و ویترین نمایشگاهها، بسته‌بندی محصول و قالبسازی قطعات و فضاهای باز و میادین شهری",
            description="کجا یونولیت انتخاب درستی است؟ پنج صنعت، مقایسه‌ی متریال با MDF و گچ و فوم سخت، داده‌ی بازار EPS و محدودیت‌های واقعی این متریال.",
            url=applications,
            og_type="article",
            og_image="custom-eps-packaging-mold",
            og_alt="قالب و بسته‌بندی سفارشی یونولیتی برای قطعات صنعتی",
            graph=lambda: [
                web_page(applications, f"کاربردها و صنایع | {BRAND}",
                         "پنج صنعت مصرف‌کننده‌ی یونولیت، مقایسه‌ی متریال و محدودیت‌های فنی این متریال."),
                breadcrumb(applications, "کاربردها و صنایع"),
                {
                    "@type": "ItemList",
                    "@id": f"{applications}#industries",
                    "name": "صنایع و کاربردهای یونولیت",
                    "numberOfItems": 5,
                    "itemListElement": [
                        {"@type": "ListItem", "position": 1, "name": "غرفه و نمایشگاه", "item": image_object("exhibition-stand-branding", applications)},
                        {"@type": "ListItem", "position": 2, "name": "صحنه، تئاتر و تولید محتوا",
                         "item": f"{applications}#stage"},
                        {"@type": "ListItem", "position": 3, "name": "بسته‌بندی صنعتی", "item": image_object("custom-eps-packaging-mold", applications)},
                        {"@type": "ListItem", "position": 4, "name": "غذایی و تبلیغاتی", "item": image_object("peghah-3d-brand-logo", applications)},
                        {"@type": "ListItem", "position": 5, "name": "شهری و محوطه", "item": image_object("baseball-ball-mockup", applications)},
                    ],
                },
                faq(FAQ_APP),
            ],
        ),
        "contact.html": dict(
            title=f"درخواست ساخت و برآورد | {BRAND} — ساخت سفارشی با یونولیت",
            description="فرم درخواست ساخت سفارشی با یونولیت: ابعاد مورد نظر، محل نصب و تاریخ تحویل را ذکر کنید تا نحوه انجام و برآورد هزینه ها صورت گیرد. بررسی فایل سه‌بعدی و مشاوره‌ی فنی.",
            url=contact,
            og_type="website",
            og_image="peghah-3d-brand-logo",
            og_alt="لوگوی حجمی سه‌بعدی برند، نمونه‌ پروژه‌ی انجام شده  یونولیت دکور",
            graph=lambda: [
                {
                    "@type": "ContactPage",
                    "@id": f"{contact}#webpage",
                    "url": contact,
                    "name": f"درخواست ساخت و برآورد هزینه | {BRAND}",
                    "description": "فرم درخواست مشاوره اولیه و ساخت پروژه های سفارشی  (فوم EPS) و مسیر بررسی فنی تا برآورد.",
                    "inLanguage": "fa-IR",
                    "isPartOf": {"@id": SITE_ID},
                    "about": {"@id": ORG_ID},
                    "primaryImageOfPage": {"@id": f"{contact}#image-peghah-3d-brand-logo"},
                },
                breadcrumb(contact, "درخواست ساخت"),
                image_object("peghah-3d-brand-logo", contact),
            ],
        ),
    }


HEAD_BLOCK = """    <title>{title}</title>
    <meta name="description" content="{description}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <meta name="author" content="{brand}" />
    <meta name="theme-color" content="#202522" />
    <link rel="canonical" href="{url}" />
    <link rel="alternate" hreflang="fa-IR" href="{url}" />
    <link rel="alternate" hreflang="x-default" href="{url}" />
    <meta property="og:type" content="{og_type}" />
    <meta property="og:locale" content="fa_IR" />
    <meta property="og:site_name" content="{brand}" />
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{description}" />
    <meta property="og:url" content="{url}" />
    <meta property="og:image" content="{domain}/assets/{og_image}.webp" />
    <meta property="og:image:alt" content="{og_alt}" />
    <meta property="og:image:width" content="{og_w}" />
    <meta property="og:image:height" content="{og_h}" />
    <meta property="og:image:type" content="image/webp" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{title}" />
    <meta name="twitter:description" content="{description}" />
    <meta name="twitter:image" content="{domain}/assets/{og_image}.webp" />
    <meta name="twitter:image:alt" content="{og_alt}" />
    <link rel="icon" href="assets/site_logo.webp" type="image/webp" />
"""

REMOVE_PATTERNS = [
    re.compile(r'\s*<title>.*?</title>', re.S),
    # همهٔ متاهای تکراری (جز viewport و charset) تا اجرای دوبارهٔ اسکریپت فایل را تکراری نکند
    re.compile(r'\s*<meta\s+name="(?!viewport)[^"]+"[^>]*>'),
    re.compile(r'\s*<meta\s+property="[^"]+"[^>]*>'),
    re.compile(r'\s*<meta\s+charset="[^"]+"[^>]*>'),
    re.compile(r'\s*<link\s+rel="(?:canonical|alternate|icon)"[^>]*>'),
    re.compile(r'\s*<script type="application/ld\+json">.*?</script>', re.S),
]


def strip_head(head: str) -> str:
    for pattern in REMOVE_PATTERNS:
        head = pattern.sub("", head)
    return head


def main():
    BACKUP.mkdir(parents=True, exist_ok=True)
    definitions = page_definitions()
    for page in PAGES:
        path = ROOT / page
        text = path.read_text(encoding="utf-8")
        if not (BACKUP / page).exists():
            shutil.copy2(path, BACKUP / page)

        spec = definitions[page]
        og_w, og_h = IMAGES[spec["og_image"]][2], IMAGES[spec["og_image"]][3]
        viewport = re.search(r'<meta name="viewport"[^>]*>', text)
        if not viewport:
            raise SystemExit(f"viewport meta not found in {page}")
        start = viewport.end()
        end = text.index("</head>")
        head = strip_head(text[start:end])
        block = "\n" + HEAD_BLOCK.format(
            title=spec["title"], description=spec["description"], url=spec["url"],
            brand=BRAND, domain=DOMAIN, og_type=spec["og_type"], og_image=spec["og_image"],
            og_alt=spec["og_alt"], og_w=og_w, og_h=og_h,
        )
        graph = {"@context": "https://schema.org", "@graph": spec["graph"]()}
        jsonld = '    <script type="application/ld+json">\n' + \
            json.dumps(graph, ensure_ascii=False, indent=2) + "\n    </script>\n"
        text = text[:start] + block + head.strip() + "\n" + jsonld + text[end:]

        # یکدست‌سازی نام برند و دامنه در کل فایل
        text = text.replace("یونولیت استودیو", BRAND).replace("yonolit.studio", "yonolitdecor.ir")
        text = text.replace("EPS / CNC / FORM", "YONOLIT DECOR")
        path.write_text(text, encoding="utf-8")
        print(f"{page}: متادیتا و اسکیمای {len(graph['@graph'])} گره اعمال شد")

    # sitemap.xml
    urls = []
    page_images = {
        "index.html": ["baseball-ball-mockup", "peghah-3d-brand-logo", "university-stand-3d-letters"],
        "services.html": ["exhibition-stand-branding", "yonolit-decorative-panel-simcard", "custom-eps-packaging-mold", "eps-astronaut-mockup", "university-stand-3d-letters"],
        "portfolio.html": list(IMAGES),
        "applications.html": ["exhibition-stand-branding", "custom-eps-packaging-mold", "peghah-3d-brand-logo", "baseball-ball-mockup"],
        "contact.html": ["peghah-3d-brand-logo"],
    }
    for page in PAGES:
        spec = definitions[page]
        entry = [f"  <url>", f"    <loc>{spec['url']}</loc>", "    <lastmod>2026-10-07</lastmod>",
                 "    <changefreq>weekly</changefreq>",
                 f"    <priority>{'1.0' if page == 'index.html' else '0.9' if page == 'portfolio.html' else '0.8'}</priority>"]
        for key in page_images[page]:
            name = IMAGES[key][0]
            entry.append(f"    <image:image>\n      <image:loc>{DOMAIN}/assets/{key}.webp</image:loc>\n      <image:title>{name}</image:title>\n    </image:image>")
        entry.append("  </url>")
        urls.append("\n".join(entry))
    sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
               '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
               + "\n".join(urls) + "\n</urlset>\n")
    (ROOT / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    (ROOT / "robots.txt").write_text(
        "User-agent: *\nAllow: /\n\nSitemap: " + DOMAIN + "/sitemap.xml\n", encoding="utf-8")
    print("sitemap.xml و robots.txt ساخته شدند")


if __name__ == "__main__":
    main()
