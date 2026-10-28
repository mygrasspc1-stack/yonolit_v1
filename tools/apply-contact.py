# -*- coding: utf-8 -*-
"""Apply the real business contact details across the site.

Idempotent: running twice produces the same output.
"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ["index.html", "services.html", "cnc.html", "portfolio.html",
         "applications.html", "contact.html"]

PHONE_TEL = "+989122530650"
PHONE_FA = "۰۹۱۲۲۵۳۰۶۵۰"
PERSON = "مجتبی دارستانی"
EMAIL = "hello@yonolit-decor.ir"
TG = "https://t.me/yonolitdecor"
EITAA = "https://eitaa.com/yonolitdecorr"
BALE = "https://ble.ir/yonolitdecor"

SOCIAL = (
    '<div class="footer-social">'
    '<a href="%s" target="_blank" rel="noopener">تلگرام</a>'
    '<a href="%s" target="_blank" rel="noopener">ایتا</a>'
    '<a href="%s" target="_blank" rel="noopener">بله</a>'
    '</div>' % (TG, EITAA, BALE)
)

FOOTER_RE = re.compile(
    r'(<div(?:\s[^>]*)?><span class="footer-label"(?:\s[^>]*)?>ارتباط</span>)(.*?)(</div>)',
    re.S)


def rebuild_footer(m):
    head, body, tail = m.group(1), m.group(2), m.group(3)
    if 'footer-social' in body:          # already done
        return m.group(0)
    other = None
    for a in re.findall(r'<a\b[^>]*>.*?</a>', body, re.S):
        if 'tel:' in a or 'mailto:' in a:
            continue
        other = a
    new = (
        '<a href="tel:%s">%s<small>%s</small></a>'
        '<a href="mailto:%s">%s</a>%s'
        % (PHONE_TEL, PHONE_FA, PERSON, EMAIL, EMAIL, SOCIAL)
    )
    if other:
        new += other
    return head + new + tail


CONTACT_LINES_OLD = (
    '<div class="contact-lines">\n'
    '            <a href="mailto:hello@yonolit-decor.ir">hello@yonolit-decor.ir</a>\n'
    '            <a href="tel:+982100000000">+98 21 0000 0000</a>\n'
    '            <span style="color:#a8ada5">شنبه تا چهارشنبه، ۹ تا ۱۷</span>\n'
    '          </div>'
)

CONTACT_LINES_NEW = (
    '<div class="contact-lines">\n'
    '            <b class="contact-person">' + PERSON + '</b>\n'
    '            <a class="contact-phone" href="tel:' + PHONE_TEL + '">' + PHONE_FA + '</a>\n'
    '            <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>\n'
    '            <span class="contact-hours">شنبه تا چهارشنبه، ۹ تا ۱۷</span>\n'
    '            <div class="contact-social">\n'
    '              <a href="' + TG + '" target="_blank" rel="noopener">تلگرام</a>\n'
    '              <a href="' + EITAA + '" target="_blank" rel="noopener">ایتا</a>\n'
    '              <a href="' + BALE + '" target="_blank" rel="noopener">بله</a>\n'
    '            </div>\n'
    '          </div>'
)

ORG_ANCHOR = '      "knowsLanguage": "fa-IR",\n'
ORG_EXTRA = (
    '      "knowsLanguage": "fa-IR",\n'
    '      "telephone": "' + PHONE_TEL + '",\n'
    '      "founder": {\n'
    '        "@type": "Person",\n'
    '        "name": "' + PERSON + '",\n'
    '        "jobTitle": "مدیر ساخت"\n'
    '      },\n'
    '      "sameAs": [\n'
    '        "' + TG + '",\n'
    '        "' + EITAA + '",\n'
    '        "' + BALE + '"\n'
    '      ],\n'
    '      "contactPoint": [\n'
    '        {\n'
    '          "@type": "ContactPoint",\n'
    '          "telephone": "' + PHONE_TEL + '",\n'
    '          "contactType": "sales",\n'
    '          "areaServed": "IR",\n'
    '          "availableLanguage": ["fa"]\n'
    '        }\n'
    '      ],\n'
)


def main():
    report = []
    for page in PAGES:
        path = os.path.join(ROOT, page)
        src = io.open(path, encoding="utf-8").read()
        out = src
        hits = []

        # 1. phone number (href + visible text)
        n1 = out.count("tel:+982100000000")
        out = out.replace("tel:+982100000000", "tel:" + PHONE_TEL)
        n2 = out.count("+98 21 0000 0000")
        out = out.replace("+98 21 0000 0000", PHONE_FA)
        if n1 or n2:
            hits.append("phone x%d" % (n1 + n2))

        # 2. footer contact column
        out, nf = FOOTER_RE.subn(rebuild_footer, out)
        if nf:
            hits.append("footer-col x%d" % nf)

        # 3. contact page blocks
        if page == "contact.html":
            if 'contact-social' not in out:
                out, nc = re.subn(r'<div class="contact-lines">.*?</div>',
                                  CONTACT_LINES_NEW, out, count=1, flags=re.S)
                if nc:
                    hits.append("contact-lines")
            out = out.replace(
                '<a href="mailto:hello@yonolit-decor.ir">ایمیل مستقیم <b>↗</b></a>',
                '<a href="tel:' + PHONE_TEL + '">تماس مستقیم <b>↗</b></a>')
            hits.append("topline")

        # 4. Organization schema
        if page == "index.html" and '"sameAs"' not in out and ORG_ANCHOR in out:
            out = out.replace(ORG_ANCHOR, ORG_EXTRA, 1)
            hits.append("jsonld")

        # 5. cache busting
        out = re.sub(r"styles\.css\?v=\d+", "styles.css?v=18", out)

        if out != src:
            io.open(path, "w", encoding="utf-8", newline="").write(out)
        report.append("%-20s %s" % (page, ", ".join(hits) or "no change"))

    print("\n".join(report))


if __name__ == "__main__":
    main()
