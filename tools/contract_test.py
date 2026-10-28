# -*- coding: utf-8 -*-
"""قرارداد رفتاری سایت — کمترین مجموعه تستی که پنج صفحه باید پاسخ دهند.

اجرا از ریشهٔ پروژه:  python tools/contract_test.py
خروجی ۰ یعنی همهٔ موارد پاس؛ خروجی ۱ یعنی شکست + فهرست موارد شکست‌خورده.

گروه‌ها:
  A — پوستهٔ صفحه: متادیتای تکّی، canonical درست، یکتایی عنوان/توضیح
  B — گراف پیوندی: فایل محلی موجود، لنگر معتبر، شبکهٔ لینک متنی بین صفحه‌ها،
      پیوندهای عمیق ?category فقط به کلیدهای واقعی فیلتر
  C — محتوا: متن جایگزین تصاویر، JSON-LD معتبر، جفت تب/پنل (deep link سالم)
  D — واقعیات برند: یک ایمیل، یک تلفن، یک دامنه در کل سایت + رفتار سازندهٔ
      ایمیل فرم (buildProjectMailto با node اجرا می‌شود)
"""
from pathlib import Path
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index.html", "services.html", "portfolio.html", "applications.html", "contact.html"]
SHIPPED = PAGES + ["script.js", "gsap-site.js", "styles.css", "sitemap.xml", "robots.txt"]

DOMAIN = "https://yonolit-decor.ir"
BRAND_EMAIL = "hello@yonolit-decor.ir"
BRAND_PHONE = "+982100000000"
CANONICAL = {"index.html": DOMAIN + "/", **{p: f"{DOMAIN}/{p}" for p in PAGES if p != "index.html"}}

ATTR = re.compile(r'(?:href|src)\s*=\s*"([^"]+)"')
ID = re.compile(r'\sid\s*=\s*"([^"]+)"')
EXTERNAL = ("http://", "https://", "mailto:", "tel:", "data:", "//")

failures: dict[str, list[str]] = {}


def fail(group: str, detail: str) -> None:
    failures.setdefault(group, []).append(detail)


def check(group: str, condition: bool, detail: str) -> None:
    if not condition:
        fail(group, detail)


# ---------- بارگذاری صفحه‌ها ----------
html: dict[str, str] = {}
for page in PAGES:
    path = ROOT / page
    if not path.exists():
        fail("A", f"{page}: فایل وجود ندارد")
    else:
        html[page] = path.read_text(encoding="utf-8")

# ---------- A. پوستهٔ صفحه ----------
for page, doc in html.items():
    check("A", len(re.findall(r"<title>", doc)) == 1, f"{page}: تعداد title برابر {len(re.findall('<title>', doc))} است")
    check("A", len(re.findall(r'<meta name="description"', doc)) == 1, f"{page}: متا توضیح دقیقاً یکی نیست")
    check("A", len(re.findall(r'<link rel="canonical"', doc)) == 1, f"{page}: canonical دقیقاً یکی نیست")
    check("A", len(re.findall(r"<h1", doc)) == 1, f"{page}: تعداد h1 برابر {len(re.findall('<h1', doc))} است")
    canonical = re.search(r'<link rel="canonical" href="([^"]+)"', doc)
    check("A", canonical and canonical.group(1) == CANONICAL[page],
          f"{page}: canonical = {canonical.group(1) if canonical else '—'} ≠ {CANONICAL[page]}")
    og_url = re.search(r'<meta property="og:url" content="([^"]+)"', doc)
    check("A", og_url and og_url.group(1) == CANONICAL[page], f"{page}: og:url با canonical هم‌خوان نیست")

titles = [m.group(1) for m in (re.search(r"<title>([^<]+)</title>", d) for d in html.values()) if m]
check("A", len(titles) == len(PAGES) and len(set(titles)) == len(PAGES), "عنوان صفحه‌ها بین صفحه‌ها یکتا نیست")
descs = [m.group(1) for m in (re.search(r'<meta name="description" content="([^"]+)"', d) for d in html.values()) if m]
check("A", len(descs) == len(PAGES) and len(set(descs)) == len(PAGES), "توضیح متا بین صفحه‌ها یکتا نیست")

# ---------- B. گراف پیوندی ----------
ids = {page: set(ID.findall(doc)) for page, doc in html.items()}
for page, doc in html.items():
    for target in ATTR.findall(doc):
        if target.startswith(EXTERNAL):
            continue
        file_part, _, anchor = target.partition("#")
        file_part = file_part.split("?")[0]
        if not file_part:
            if anchor and anchor not in ids[page]:
                fail("B", f"{page}: لنگر #{anchor} در همان صفحه نیست")
            continue
        candidate = ROOT / file_part
        if not candidate.exists():
            fail("B", f"{page}: مقصد محلی وجود ندارد → {target}")
            continue
        if anchor and candidate.suffix == ".html" and candidate.name in ids and anchor not in ids[candidate.name]:
            fail("B", f"{page}: {file_part}#{anchor} — id در صفحهٔ مقصد نیست")

# شبکهٔ لینک متنی: هر صفحه از <main> هر چهار صفحهٔ دیگر لینک بگیرد
for target_page in PAGES:
    sources = set()
    for source_page, doc in html.items():
        if source_page == target_page:
            continue
        main = doc.split("<main", 1)[-1].split("</main>", 1)[0]
        for href in ATTR.findall(main):
            base = href.partition("#")[0].partition("?")[0]
            if base == target_page:
                sources.add(source_page)
    missing = set(PAGES) - {target_page} - sources
    check("B", not missing, f"{target_page}: از این صفحه‌ها لینک متنی نمی‌گیرد → {sorted(missing)}")

# پیوند عمیق ?category فقط به کلیدهای واقعی فیلتر
filter_keys = set()
for doc in html.values():
    filter_keys.update(re.findall(r'data-filter="([^"]+)"', doc))
for page, doc in html.items():
    for key in re.findall(r'\?category=([A-Za-z0-9_-]+)', doc):
        check("B", key in filter_keys, f"{page}: ?category={key} کلید فیلتر نیست ({sorted(filter_keys)})")

# ---------- C. محتوا و اسکیما ----------
for page, doc in html.items():
    for tag in re.findall(r"<img\b[^>]*>", doc, re.I):
        alt = re.search(r'alt\s*="([^"]*)"', tag) or re.search(r"alt\s*=\s*'([^']*)'", tag)
        check("C", bool(alt and alt.group(1).strip()), f"{page}: تصویر بدون متن جایگزین → {tag[:80]}")
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', doc, re.S):
        try:
            json.loads(block)
        except json.JSONDecodeError as error:
            fail("C", f"{page}: JSON-LD نامعتبر ({error})")

apps = html.get("applications.html", "")
tab_keys = set(re.findall(r'data-tab="([^"]+)"', apps))
panel_keys = set(re.findall(r'data-panel="([^"]+)"', apps))
panel_ids = set(re.findall(r'<article class="tab-panel[^"]*" data-panel="[^"]+" id="([^"]+)"', apps))
check("C", tab_keys and tab_keys == panel_keys == panel_ids,
      f"کلیدهای تب ≠ پنل‌ها ≠ id → tabs={sorted(tab_keys)} panels={sorted(panel_keys)} ids={sorted(panel_ids)}")

# ---------- D. واقعیات برند ----------
shipped = {name: (ROOT / name).read_text(encoding="utf-8") for name in SHIPPED}
mailto_hits = {name: set(re.findall(r"mailto:([^?`\"'\s]+)", text)) for name, text in shipped.items()}
for name, addrs in mailto_hits.items():
    check("D", addrs <= {BRAND_EMAIL}, f"{name}: آدرس‌های mailto غیر از برند → {sorted(addrs)}")
tel_hits = {name: set(re.findall(r"tel:([+\d]+)", text)) for name, text in shipped.items() if name.endswith(".html")}
for name, numbers in tel_hits.items():
    check("D", numbers == {BRAND_PHONE}, f"{name}: شمارهٔ tel غیر از برند → {sorted(numbers)}")
for name, text in shipped.items():
    for old in ("yonolit.studio", "یونولیت استودیو", "YONOLIT STUDIO", "یونولیت دیکور"):
        check("D", old not in text, f"{name}: نشانی/نام قدیمی باقی‌مانده → «{old}»")

sitemap = shipped["sitemap.xml"]
locs = set(re.findall(r"<loc>([^<]+)</loc>", sitemap))
check("D", locs == set(CANONICAL.values()), f"sitemap ≠ canonical‌ها → {sorted(locs)}")
check("D", f"{DOMAIN}/sitemap.xml" in shipped["robots.txt"], "robots.txt به sitemap اشاره نمی‌کند")

# ---------- D2. رفتار سازندهٔ ایمیل فرم (node) ----------
js = shipped["script.js"]
labels_src = re.search(r"const projectMailLabels = \{.*?\};", js, re.S)
summary_src = re.search(r"function buildProjectSummary\(data\) \{.*?\n\}", js, re.S)
func_src = re.search(r"function buildProjectMailto\(data\) \{.*?\n\}", js, re.S)
facts = {}
if not labels_src or not summary_src or not func_src:
    fail("D", "buildProjectSummary/buildProjectMailto یا projectMailLabels در script.js پیدا نشد")
else:
    harness = (
        labels_src.group(0) + "\n" + summary_src.group(0) + "\n" + func_src.group(0) + "\n"
        "const w = (o) => ({ get: (k) => (k in o ? o[k] : null) });\n"
        "const dec = (u) => { const i = u.indexOf('?subject=');"
        " const p = u.slice(i + 9).split('&body=');"
        " return { to: u.slice(7, i), subject: decodeURIComponent(p[0]), body: decodeURIComponent(p[1] || '') }; };\n"
        "console.log(JSON.stringify({\n"
        "  full: dec(buildProjectMailto(w({ name: 'علی رضایی', phone: '۰۹۱۲۱۲۳۴۵۶۷', email: 'a@b.ir',"
        " type: 'دکور', place: 'بیرونی', size: '۳×۲', brief: 'توضیح کامل پروژهٔ آزمایشی' }))),\n"
        "  sparse: dec(buildProjectMailto(w({ name: 'X', company: '', qty: '', brief: '' }))),\n"
        "  weird: dec(buildProjectMailto(w({ name: 'A & B\\nC', type: 'دکور', brief: '۱۲۳ & <ok>' })))\n"
        "}));"
    )
    proc = subprocess.run(["node", "-e", harness], capture_output=True, cwd=ROOT)
    if proc.returncode != 0:
        fail("D", f"اجرای buildProjectMailto در node شکست خورد: {proc.stderr.decode('utf-8', 'replace').strip()[:200]}")
    else:
        facts = json.loads(proc.stdout.decode("utf-8"))

if facts:
    full, sparse, weird = facts["full"], facts["sparse"], facts["weird"]
    FORM_CASES = [
        ("مقصد ایمیل برابر آدرس برند است", lambda f: f["full"]["to"] == BRAND_EMAIL),
        ("موضوع شامل نام و نوع پروژه است", lambda f: "علی رضایی" in f["full"]["subject"] and "دکور" in f["full"]["subject"]),
        ("فیلدهای پر با برچسب فارسی در بدنه‌اند", lambda f: all(
            label in f["full"]["body"] for label in ["نام", "موبایل", "ایمیل", "نوع پروژه", "محل استفاده", "ابعاد", "توضیح پروژه"])),
        ("فیلدهای خالی حذف می‌شوند", lambda f: "برند/شرکت" not in f["sparse"]["body"] and "تعداد" not in f["sparse"]["body"]),
        ("نویسه‌های خاص سالم برمی‌گردند", lambda f: "A & B\nC" in f["weird"]["subject"] and "۱۲۳ & <ok>" in f["weird"]["body"]),
        ("امضای متن، برند فعلی است", lambda f: "یونولیت دکور" in f["full"]["body"] and "استودیو" not in f["full"]["body"]),
    ]
    for name, predicate in FORM_CASES:
        check("D", predicate(facts), f"سازندهٔ ایمیل: {name}")

# ---------- گزارش ----------
GROUPS = {
    "A": "پوستهٔ صفحه (متادیتا)",
    "B": "گراف پیوندی (لینک، لنگر، شبکه، پیوند عمیق)",
    "C": "محتوا (alt، JSON-LD، تب/پنل)",
    "D": "واقعیات برند + سازندهٔ ایمیل فرم",
}
def _out(text: str) -> None:
    print(text, file=open(1, "w", encoding="utf-8", closefd=False))

_out("=== قرارداد رفتاری سایت یونولیت دکور ===")
for key, title in GROUPS.items():
    problems = failures.get(key)
    stamp = "FAIL" if problems else "PASS"
    _out(f"[{stamp}] {key} — {title}")
    for detail in problems or []:
        _out(f"       - {detail}")
total = sum(len(v) for v in failures.values())
if total:
    _out(f"\n{total} مورد شکست خورده.")
    sys.exit(1)
_out("\nOK — همهٔ موارد قرارداد پاس شد.")
