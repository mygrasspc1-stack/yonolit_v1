#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
استودیو ویرایش بصری — سرور محلی پروژه + ذخیرهٔ تغییرات روی فایل‌های واقعی.

اجرا:  python tools/studio.py 8080
سپس:   http://127.0.0.1:8080/dev/studio.html

قابلیت‌ها:
  - سرو کردن فایل‌های پروژه با no-cache (تغییرات فوری دیده می‌شوند)
  - POST /__style  → ذخیرهٔ استایل یک المان در styles.css (بلوک STUDIO)
  - POST /__text   → جایگزینی متن در فایل HTML (فقط اگر متن یکتا باشد)
  - POST /__img    → عوض کردن src تصویر + alt
  - POST /__reset  → حذف استایل‌های ذخیره‌شدهٔ یک المان یا همه
  - GET  /__assets → لیست تصاویر assets/ برای انتخابگر تصویر
  - GET  /__state  → وضعیت فعلی ویرایش‌ها

هر نوشتن روی HTML قبلش در dev/backups/ بکاپ می‌گیرد.
"""

import json
import re
import shutil
import sys
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
DEV = ROOT / "dev"
BACKUP = DEV / "backups"
STATE_FILE = DEV / "studio-state.json"
CSS_FILE = ROOT / "styles.css"

# صفحه‌های قابل ویرایش: نام فایل → مقدار data-page روی <body>
PAGES = {
    "index.html": "home",
    "services.html": "services",
    "cnc.html": "cnc",
    "portfolio.html": "portfolio",
    "applications.html": "applications",
    "contact.html": "contact",
}

S_START = "/* ==== STUDIO:START — ساختهٔ پنل ویرایش، پاک کردنش آزاد است ==== */"
S_END = "/* ==== STUDIO:END ==== */"
BLOCK_RE = re.compile(re.escape(S_START) + r".*?" + re.escape(S_END), re.S)


# ---------------------------------------------------------------- state
def load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"styles": []}


def save_state(state):
    DEV.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=1), encoding="utf-8")


def render_block(state):
    """بلوک CSS را از state می‌سازد؛ هر ذخیره کل بلوک را بازنویسی می‌کند (idempotent)."""
    out = [S_START]
    for item in state["styles"]:
        sel = item["selector"]
        if item.get("page") and item["page"] != "*":
            sel = f'body[data-page="{item["page"]}"] {sel}'
        body = "".join(f"{k}:{v};" for k, v in item["props"].items())
        out.append(f"{sel}{{{body}}}")
    out.append(S_END)
    return "\n".join(out)


def write_css(state):
    css = CSS_FILE.read_text(encoding="utf-8")
    css = BLOCK_RE.sub("", css).rstrip()
    CSS_FILE.write_text(css + "\n\n" + render_block(state) + "\n", encoding="utf-8")


def backup(path: Path):
    BACKUP.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    shutil.copy2(path, BACKUP / f"{path.name}.{stamp}.bak")
    # فقط ۴۰ بکاپ آخر نگه داشته شود
    olds = sorted(BACKUP.glob(f"{path.name}.*.bak"))
    for old in olds[:-40]:
        old.unlink(missing_ok=True)


# ---------------------------------------------------------------- actions
def act_style(payload):
    state = load_state()
    page = payload.get("page") or "*"
    selector = (payload.get("selector") or "").strip()
    props = {k: v for k, v in (payload.get("props") or {}).items() if v not in (None, "")}
    if not selector:
        return {"ok": False, "error": "selector خالی است"}

    state["styles"] = [s for s in state["styles"]
                       if not (s["selector"] == selector and s.get("page") == page)]
    if props:
        state["styles"].append({"page": page, "selector": selector, "props": props})
    save_state(state)
    write_css(state)
    return {"ok": True, "count": len(state["styles"])}


def act_text(payload):
    page = payload.get("page")
    raw_old = payload.get("rawOld") or ""
    raw_new = payload.get("rawNew")
    if page not in PAGES:
        return {"ok": False, "error": "صفحه نامعتبر"}
    if not raw_old.strip():
        return {"ok": False, "error": "متن اصلی خالی است"}
    if raw_new is None:
        return {"ok": False, "error": "متن جدید ارسال نشد"}

    path = ROOT / page
    html = path.read_text(encoding="utf-8")
    hits = html.count(raw_old)
    if hits == 0:
        return {"ok": False, "error": "متن اصلی در فایل پیدا نشد — شاید قبلاً عوض شده"}
    if hits > 1:
        return {"ok": False, "error": f"این متن {hits} بار در صفحه تکرار شده و یکتا نیست", "count": hits}

    backup(path)
    path.write_text(html.replace(raw_old, raw_new, 1), encoding="utf-8")
    return {"ok": True}


def act_img(payload):
    page = payload.get("page")
    old = payload.get("oldSrc") or ""
    new = payload.get("newSrc") or ""
    if page not in PAGES:
        return {"ok": False, "error": "صفحه نامعتبر"}
    if not old or not new:
        return {"ok": False, "error": "مسیر تصویر ناقص است"}

    path = ROOT / page
    html = path.read_text(encoding="utf-8")
    hits = html.count(f'src="{old}"')
    if hits == 0:
        return {"ok": False, "error": "تصویر پیدا نشد — شاید مسیر مطلق/نسبی متفاوت است"}
    if hits > 1 and not payload.get("all"):
        return {"ok": False, "needAll": True, "count": hits,
                "error": f"این تصویر {hits} بار در صفحه استفاده شده"}

    backup(path)
    if payload.get("all"):
        html = html.replace(f'src="{old}"', f'src="{new}"')
    else:
        html = html.replace(f'src="{old}"', f'src="{new}"', 1)
    path.write_text(html, encoding="utf-8")
    return {"ok": True, "count": hits}


def act_alt(payload):
    """alt تصویر را عوض می‌کند: تگ img را با src یکتا پیدا می‌کند و alt را داخل همان تگ جایگزین می‌کند."""
    page = payload.get("page")
    src = payload.get("src") or ""
    alt = payload.get("alt")
    if page not in PAGES or not src or alt is None:
        return {"ok": False, "error": "پارامتر ناقص"}

    path = ROOT / page
    html = path.read_text(encoding="utf-8")
    pattern = re.compile(r'<img\b[^>]*src="' + re.escape(src) + r'"[^>]*>')
    matches = pattern.findall(html)
    if not matches:
        return {"ok": False, "error": "تگ img پیدا نشد"}
    tag = matches[0]
    if 'alt="' in tag:
        new_tag = re.sub(r'alt="[^"]*"', 'alt="' + alt.replace('"', "&quot;") + '"', tag, count=1)
    else:
        new_tag = tag[:-1] + ' alt="' + alt.replace('"', "&quot;") + '">'

    backup(path)
    path.write_text(html.replace(tag, new_tag, 1), encoding="utf-8")
    return {"ok": True}


def act_reset(payload):
    state = load_state()
    if payload.get("all"):
        state["styles"] = []
    else:
        selector = payload.get("selector")
        page = payload.get("page")
        state["styles"] = [s for s in state["styles"]
                           if not (s["selector"] == selector and (page in (None, s.get("page"))))]
    save_state(state)
    write_css(state)
    return {"ok": True, "count": len(state["styles"])}


# ---------------------------------------------------------------- http
class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".webp": "image/webp",
        ".avif": "image/avif",
        ".woff2": "font/woff2",
        ".json": "application/json",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/__assets"):
            files = []
            for f in sorted((ROOT / "assets").glob("*")):
                if f.suffix.lower() in (".webp", ".jpg", ".jpeg", ".png", ".svg", ".avif"):
                    files.append({"src": f"assets/{f.name}", "name": f.name,
                                  "kb": round(f.stat().st_size / 1024)})
            return self._json(files)
        if self.path.startswith("/__state"):
            return self._json(load_state())
        if self.path.startswith("/__pages"):
            return self._json([{"file": k, "page": v} for k, v in PAGES.items()])
        return super().do_GET()

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            return self._json({"ok": False, "error": "JSON نامعتبر"}, 400)

        routes = {
            "/__style": act_style,
            "/__text": act_text,
            "/__img": act_img,
            "/__alt": act_alt,
            "/__reset": act_reset,
        }
        fn = routes.get(self.path)
        if not fn:
            return self._json({"ok": False, "error": "مسیر ناشناخته"}, 404)
        try:
            return self._json(fn(payload))
        except Exception as exc:  # خطای غیرمنتظره نباید سرور را بخواباند
            return self._json({"ok": False, "error": f"{type(exc).__name__}: {exc}"}, 500)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    DEV.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"studio: http://127.0.0.1:{port}/dev/studio.html")
    print(f"root   : {ROOT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
