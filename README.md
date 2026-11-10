## Latest release / آخرین انتشار

`v5.0.1` is published. [Download the release assets](https://github.com/HYNazism/Shahnameh/releases/tag/v5.0.1): Windows installer and portable `.exe`, Android `.apk`, macOS `.dmg`, Linux `.AppImage` and `.deb`, and offline web `.zip`. The web ZIP is not an installer. [Successful workflow run](https://github.com/HYNazism/Shahnameh/actions/runs/42742550006).

نسخهٔ `v5.0.1` منتشر شده است. [دانلود فایل‌های انتشار](https://github.com/HYNazism/Shahnameh/releases/tag/v5.0.1): نصاب و نسخهٔ قابل‌حمل ویندوز (`.exe`)، فایل نصب اندروید (`.apk`)، بستهٔ macOS (`.dmg`)، بسته‌های Linux (`.AppImage` و `.deb`) و باندل آفلاین وب (`.zip`). ZIP وب نصاب نیست. [اجرای موفق گردشکار](https://github.com/HYNazism/Shahnameh/actions/runs/42742550006).

---

## English

Shahnameh: Crown of Ash and Light is a 2D/3D action game inspired by Ferdowsi’s Shahnameh. The project uses React 19, TypeScript, Vite, and Three.js.

### Downloads

- [GitHub Releases](https://github.com/HYNazism/Shahnameh/releases)
- [Multi-platform release workflow](https://github.com/HYNazism/Shahnameh/actions/workflows/release-multiplatform.yml)

After a successful workflow run, configured assets include a Windows installer and portable `.exe`, an Android `.apk`, a macOS `.dmg`, Linux `.AppImage` and `.deb` packages, and an offline web bundle (`.zip`). The web ZIP is not a Windows or Android installer. Check the assets attached to the specific release before downloading.

### Local development

Requirements: Node.js 22 and npm. Android builds also require Java 21 and the Android SDK.

```bash
git clone https://github.com/HYNazism/Shahnameh.git
cd Shahnameh
npm install --legacy-peer-deps
npm run dev
```

Check TypeScript, run the game-rules tests, and build the web app with:

```bash
npm run lint
npm test
npm run build
```

Desktop and Android builds are defined in GitHub Actions.

### Releases

The workflow starts on a `v*.*.*` tag or a manual dispatch from **Actions**. The current package version and manual default are both `v5.0.1`. Starting a run does not guarantee a release; verify all jobs and the assets on the resulting GitHub Release.



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
