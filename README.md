# یونولیت استودیو

یک سایت استاتیک RTL برای معرفی خدمات طراحی و ساخت با EPS / یونولیت.

## اجرا

این پوشه را با یک وب‌سرور ساده اجرا کنید:

```powershell
python -m http.server 4173
```

سپس به `http://localhost:4173` بروید.

## ساختار

- `index.html`: محتوای صفحه، متادیتا و JSON-LD
- `styles.css`: سیستم بصری، layout و motion
- `script.js`: گالری، فیلتر، لایت‌باکس و revealها
- `assets/`: کپی تمام تصاویر منبع
- `docs/read-this.txt`: متن و استراتژی SEO ارسالی
- `agents/`: تقسیم نقش طراحی، پیاده‌سازی و QA
