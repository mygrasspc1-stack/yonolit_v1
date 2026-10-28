# -*- coding: utf-8 -*-
"""بازنویسی صفحهٔ نمونه‌کارها: حذف لحن شاعرانه، جایگزینی با توصیف فنی و کلیدواژه‌محور."""
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parent.parent
F = "portfolio.html"

PAIRS = [
    ("<h1>هر تصویر، یک بار<br><span>از خام تا نهایی.</span></h1>",
     "<h1>نمونه‌کارهای یونولیت<br><span>قبل و بعد ساخت</span></h1>"),

    ("<p class=\"lead\">در آرشیو ما فقط تصویر محصول نهایی نیست؛ فرم خام، مرحله‌ی برش و سطح "
     "پرداخت‌شده هم ثبت می‌شود. همین تفاوت را می‌شود در تصاویر دید: از بلوک سفید بی‌شکل تا "
     "فرمی که در فضا می‌ایستد.</p>",
     "<p class=\"lead\">در هر پروژه سه تصویر ثبت شده است: فرم خام، مرحله‌ی برش، و سطح "
     "نهایی‌شده. همین سه تصویر نشان می‌دهد کار از کجا شروع می‌شود، کجا زمان می‌برد و خروجی "
     "نهایی چه شکلی است.</p>"),

    ("<h2>قبل، در حال ساخت،<br><span>نهایی.</span></h2>",
     "<h2>سه مرحله،<br><span>سه تصویر</span></h2>"),

    ("<p class=\"section-side\">این ترتیب، خودِ فرآیند است. هر پروژه از یک بلوک خام شروع "
     "می‌شود و به فرمی می‌رسد که پوشش، رنگ و جزئیات دارد.</p>",
     "<p class=\"section-side\">ترتیب تصاویر همان ترتیب کارگاه است: بلوک خام، برش و مونتاژ، "
     "پوشش و رنگ.</p>"),

    ("<h3>از بلوک سفید تا فرم ایستاده</h3>", "<h3>فرم‌دهی از بلوک EPS</h3>"),
    ("<h3>قطعه‌بندی برای یک روز نصب</h3>", "<h3>قطعه‌بندی برای نصب یک‌روزه</h3>"),
    ("<h3>جایی که شکستن، گزینه نیست</h3>", "<h3>قالب محافظ ضدضربه</h3>"),

    ("<h2 id=\"stories-title\">فرم، پرداخت،<br><span>و نتیجهٔ نهایی.</span></h2>",
     "<h2 id=\"stories-title\">سه پروژه،<br><span>سه کاربرد متفاوت</span></h2>"),

    ("<h2>همه‌ی فرم‌ها،<br><span>با فیلتر.</span></h2>",
     "<h2>آرشیو کامل،<br><span>با فیلتر دسته</span></h2>"),

    ("<h2>پروژه‌ی مشابهی در ذهن دارید؟</h2>", "<h2>پروژه‌ی مشابه دارید؟</h2>"),
]


def main():
    path = ROOT / F
    html = path.read_text(encoding="utf-8")
    errors = []
    for old, new in PAIRS:
        n = html.count(old)
        if n != 1:
            errors.append(f"{n}× {old[:70]}")
            continue
        html = html.replace(old, new, 1)
    if errors:
        print("FAILED — چیزی نوشته نشد:")
        for e in errors:
            print("  ", e)
        return 1
    path.write_text(html, encoding="utf-8")
    print(f"OK {F}: {len(PAIRS)} جایگزینی")
    return 0


if __name__ == "__main__":
    sys.exit(main())
