

---

## فارسی

«شاهنامه: تاج خاکستر و نور» یک بازی اکشن دوبعدی/سه‌بعدی الهام‌گرفته از شاهنامهٔ فردوسی است. فناوری‌های اصلی مخزن React 19، TypeScript، Vite و Three.js هستند.

### دریافت نسخه‌ها

- [انتشارهای GitHub](https://github.com/HYNazism/Shahnameh/releases)
- [گردش‌کار ساخت و انتشار چندسکویی](https://github.com/HYNazism/Shahnameh/actions/workflows/release-multiplatform.yml)

پس از موفقیت اجرای گردش‌کار، فایل‌های زیر برای انتشار پیکربندی شده‌اند: نصاب و نسخهٔ قابل‌حمل ویندوز (`.exe`)، فایل نصب اندروید (`.apk`)، بستهٔ macOS (`.dmg`)، بسته‌های Linux (`.AppImage` و `.deb`) و باندل وب آفلاین (`.zip`). ZIP وب جایگزین نصاب ویندوز یا Android نیست. پیش از نصب، دارایی‌های پیوست‌شده به همان نسخه را بررسی کنید.

### اجرای محلی

پیش‌نیازها: Node.js 22 و npm؛ برای ساخت Android، Java 21 و Android SDK نیز لازم است.

```bash
git clone https://github.com/HYNazism/Shahnameh.git
cd Shahnameh
npm install --legacy-peer-deps
npm run dev
```

برای بررسی TypeScript، اجرای آزمون قواعد بازی و ساخت نسخهٔ وب:

```bash
npm run lint
npm test
npm run build
```

ساخت‌های دسکتاپ و Android در GitHub Actions تعریف شده‌اند.

### انتشار

گردش‌کار با تگ نسخهٔ `v*.*.*` یا اجرای دستی از تب **Actions** آغاز می‌شود. نسخهٔ پیش‌فرض اجرای دستی `v5.0.1` است که پس از نسخهٔ `5.0.0` در `package.json` قرار می‌گیرد. آغاز گردش‌کار تضمین موفقیت انتشار نیست؛ وضعیت jobها و فایل‌های Release را پس از اجرا بررسی کنید.
