# Shahnameh: Crown of Ashes & Light

یک بازی اکشن دوبعدی/سه‌بعدی الهام‌گرفته از شاهنامهٔ فردوسی. مخزن از React 19، TypeScript، Vite و Three.js استفاده می‌کند.

## دریافت نسخه‌ها

- [GitHub Releases](https://github.com/HYNazism/Shahnameh/releases)
- [گردش‌کار ساخت و انتشار](https://github.com/HYNazism/Shahnameh/actions/workflows/release-multiplatform.yml)

هنگامی که انتشار کامل شود، گردش‌کار برای ساخت و پیوست این خروجی‌ها پیکربندی شده است: نصاب و نسخهٔ قابل‌حمل ویندوز (`.exe`)، فایل نصب اندروید (`.apk`)، بستهٔ macOS (`.dmg`)، بسته‌های Linux (`.AppImage` و `.deb`) و باندل وب آفلاین (`.zip`). فایل ZIP وب، نصاب ویندوز یا اندروید نیست. پیش از نصب، فهرست دارایی‌های همان انتشار را بررسی کنید؛ این مخزن هنوز اجرای موفق انتشار چندسکویی را تأیید نکرده است.

## توسعهٔ محلی

پیش‌نیازها: Node.js 22، npm؛ برای ساخت Android نیز Java 21 و Android SDK لازم است.

```bash
git clone https://github.com/HYNazism/Shahnameh.git
cd Shahnameh
npm install --legacy-peer-deps
npm run dev
```

دستورات اصلی موجود در `package.json`:

```bash
npm run lint
npm test
npm run build
```

`npm run lint` بررسی TypeScript، `npm test` آزمون قواعد بازی و `npm run build` ساخت وب را اجرا می‌کند. ساخت‌های دسکتاپ و Android در GitHub Actions تعریف شده‌اند.

## انتشار

گردش‌کار با تگ‌های نسخهٔ `v*.*.*` یا اجرای دستی از تب **Actions** آغاز می‌شود. در اجرای دستی، نسخهٔ پیش‌فرض بعد از `5.0.0` برابر `v5.0.1` است. اجرای گردش‌کار، به‌تنهایی تضمین انتشار موفق نیست؛ وضعیت jobها و دارایی‌های Release را پس از هر اجرا بررسی کنید.
