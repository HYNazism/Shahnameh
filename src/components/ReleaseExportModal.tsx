import React, { useState } from 'react';
import { GameLanguage } from '../data/i18nAndSettings';
import { PlayerRunState } from '../game/rules';
import { SHAHNAMEH_BUILD_MANIFEST } from '../data/versionManifest';
import {
  Download,
  Monitor,
  Smartphone,
  GitBranch,
  CheckCircle2,
  Copy,
  Send,
  Globe,
  Terminal,
  Gamepad2,
} from 'lucide-react';

interface ReleaseExportModalProps {
  language: GameLanguage;
  runState: PlayerRunState;
  touchControlsEnabled: boolean;
  onToggleTouchControls: (next: boolean) => void;
  onClose: () => void;
}

export const ReleaseExportModal: React.FC<ReleaseExportModalProps> = ({
  language,
  runState,
  touchControlsEnabled,
  onToggleTouchControls,
  onClose,
}) => {
  const isFa = language !== 'en';
  const [activeTab, setActiveTab] = useState<'packages' | 'github_release' | 'ci_workflow'>(
    'packages'
  );
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Direct GitHub Release API state
  const [githubRepo, setGithubRepo] = useState<string>('username/shahnameh-crown-of-ashes');
  const [githubToken, setGithubToken] = useState<string>('');
  const [releaseTag, setReleaseTag] = useState<string>(`v${runState.version}`);
  const [releaseTitle, setReleaseTitle] = useState<string>(
    `Shahnameh: Crown of Ashes & Light v${runState.version} (Windows .EXE + Android .APK)`
  );
  const [publishStatus, setPublishStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
    url?: string;
  }>({ type: 'idle', message: '' });

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2500);
  };

  const downloadFile = (filename: string, content: string, mimeType = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1. Windows .BAT Automated EXE Builder & Launcher Script
  const windowsExeBuilderBatch = `@echo off
title Shahnameh: Crown of Ashes & Light - Windows .EXE Builder (v${runState.version})
echo ===============================================================================
echo   SHAHNAMEH: CROWN OF ASHES AND LIGHT (v${runState.version})
echo   Automated Windows Desktop (.EXE Installer + Portable .EXE) Builder
echo ===============================================================================
echo.
echo [1/4] Installing project dependencies...
call npm install
echo.
echo [2/4] Installing Electron & Electron-Builder...
call npm install --no-save electron@^33.2.0 electron-builder@^25.1.8
echo.
echo [3/4] Compiling production Persian Miniature bundle...
call npx vite build --base=./
echo.
echo [4/4] Packaging Windows .EXE (NSIS Installer + Portable x64 .EXE)...
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npx electron-builder --win --config electron-builder.yml --publish never
echo.
echo ===============================================================================
echo   SUCCESS! Your Windows .EXE files are ready in:
echo   release-builds\\desktop\\Shahnameh-CrownOfAshes-${runState.version}-Windows-x64.exe
echo   release-builds\\desktop\\Shahnameh-CrownOfAshes-${runState.version}-Portable-x64.exe
echo ===============================================================================
pause
`;

  // 2. Android .SH Automated APK Builder Script
  const androidApkBuilderScript = `#!/usr/bin/env bash
set -euo pipefail
echo "==============================================================================="
echo "  SHAHNAMEH: CROWN OF ASHES & LIGHT (v${runState.version})"
echo "  Automated Android Package (.APK) Builder via Capacitor & Gradle"
echo "==============================================================================="

echo "[1/5] Installing web dependencies..."
npm install

echo "[2/5] Building production game bundle with relative asset paths..."
npx vite build --base=./

echo "[3/5] Installing Capacitor Android bridge..."
npm install --no-save @capacitor/core@^6.1.2 @capacitor/cli@^6.1.2 @capacitor/android@^6.1.2
if [ ! -d "android" ]; then
  npx cap add android
fi
npx cap sync android

echo "[4/5] Configuring SensorLandscape Fullscreen mode for Android..."
sed -i.bak 's/android:name=".MainActivity"/android:name=".MainActivity" android:screenOrientation="sensorLandscape"/g' android/app/src/main/AndroidManifest.xml || true

echo "[5/5] Building installable Android .APK with Gradle..."
cd android
chmod +x gradlew
./gradlew assembleDebug
cp app/build/outputs/apk/debug/app-debug.apk ../Shahnameh-CrownOfAshes-v${runState.version}-Android.apk
cd ..

echo "==============================================================================="
echo "  SUCCESS! Installable Android APK generated at:"
echo "  ./Shahnameh-CrownOfAshes-v${runState.version}-Android.apk"
echo "==============================================================================="
`;

  // 3. GitHub CLI One-Command Push & Multi-Platform Release Script
  const githubCliReleaseScript = `#!/usr/bin/env bash
set -euo pipefail
REPO="${githubRepo}"
TAG="${releaseTag}"

echo "=== Pushing Shahnameh v${runState.version} to GitHub & Triggering EXE + APK Builds ==="
git init
git add .
git commit -m "release: Shahnameh Crown of Ashes & Light ${releaseTag} (Multi-Platform EXE/APK/Web)" || true
git branch -M main

# Add remote if not already configured
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/\${REPO}.git"
git push -u origin main

# Tag and push to trigger .github/workflows/release-multiplatform.yml
git tag -f "\${TAG}"
git push -f origin "\${TAG}"

echo "Tag \${TAG} pushed! GitHub Actions is now compiling:"
echo "  - Windows .EXE (NSIS Setup + Portable .EXE)"
echo "  - Android .APK (Universal Landscape APK)"
echo "  - macOS .DMG & Linux .AppImage"
echo "  - Standalone Offline Web/PWA .ZIP"
`;

  const handlePublishToGitHubApi = async () => {
    const cleanRepo = githubRepo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
    if (!cleanRepo.includes('/')) {
      setPublishStatus({
        type: 'error',
        message: isFa
          ? 'نام مخزن گیت‌هاب را به صورت username/repository وارد کنید.'
          : 'Please enter a valid GitHub repository in owner/repo format.',
      });
      return;
    }
    if (!githubToken.trim()) {
      setPublishStatus({
        type: 'error',
        message: isFa
          ? 'برای انتشار مستقیم از مرورگر، توکن دسترسی گیت‌هاب (Personal Access Token با دسترسی repo) را وارد کنید یا از اسکریپت Git CLI استفاده نمایید.'
          : 'Please provide a GitHub Personal Access Token (with repo scope) for direct browser publishing, or use the Git CLI script below.',
      });
      return;
    }

    setPublishStatus({
      type: 'loading',
      message: isFa
        ? 'در حال ارتباط با GitHub API و ثبت انتشار نسخه جدید...'
        : 'Connecting to GitHub REST API and creating release...',
    });

    try {
      const releaseBody = `## شاهنامه: تاج خاکستر و نور — نسخه ${releaseTag}\n### Shahnameh: Crown of Ashes & Light (${releaseTag})\n\n- **Active Version**: \`${runState.version}\`\n- **Alignment Ledger**: \`${runState.alignment}\` | **Iranshahr Stability**: \`${Math.round(runState.iranshahrStability)}%\`\n- **Multi-Platform Targets**: Windows \`.exe\` (Installer & Portable), Android \`.apk\`, macOS \`.dmg\`, Linux \`.AppImage\`, Offline Web PWA \`.zip\`\n\n\`\`\`json\n${JSON.stringify(SHAHNAMEH_BUILD_MANIFEST, null, 2)}\n\`\`\``;

      const response = await fetch(`https://api.github.com/repos/${cleanRepo}/releases`, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${githubToken.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tag_name: releaseTag.trim(),
          name: releaseTitle.trim(),
          body: releaseBody,
          draft: false,
          prerelease: false,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      setPublishStatus({
        type: 'success',
        message: isFa
          ? `انتشار نسخه ${releaseTag} با موفقیت در گیت‌هاب ثبت شد و پایپ‌لاین ساخت EXE و APK فعال گردید!`
          : `Successfully published Release ${releaseTag} on GitHub!`,
        url: data.html_url,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPublishStatus({
        type: 'error',
        message: isFa ? `خطا در ارتباط با GitHub API: ${msg}` : `GitHub API Error: ${msg}`,
      });
    }
  };

  return (
    <div
      dir={isFa ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070504]/92 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="release-export-title"
    >
      <div className="parchment-panel miniature-border w-full max-w-5xl p-6 md:p-8 text-[#F5E6C8] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D97706]/35">
          <div>
            <div className="text-xs font-mono text-[#F59E0B] uppercase tracking-wider">
              MULTI-PLATFORM EXPORT &amp; GITHUB RELEASE PIPELINE · v{runState.version}
            </div>
            <h2
              id="release-export-title"
              className="font-display text-xl md:text-2xl font-bold text-[#FDE68A] mt-1"
            >
              {isFa
                ? 'مرکز خروجی چندپلتفرمی (Windows .EXE / Android .APK) و انتشار در گیت‌هاب'
                : 'Multi-Platform Exporter (Windows .EXE / Android .APK) & GitHub Release Center'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#991B1B] hover:bg-[#B91C1C] border border-[#F59E0B] text-xs font-bold text-[#FDE68A] cursor-pointer"
          >
            {isFa ? 'بستن پنجره [Esc]' : 'Close [Esc]'}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-4 flex flex-wrap gap-2 border-b border-[#D97706]/25 pb-3">
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-4 py-2 text-xs font-bold border flex items-center gap-2 cursor-pointer ${
              activeTab === 'packages'
                ? 'bg-[#D97706] text-[#0B0908] border-[#FDE68A]'
                : 'bg-[#120F0D] text-[#D6C7B2] border-[#D97706]/40 hover:border-[#F59E0B]'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>
              {isFa
                ? '۱. خروجی ویندوز (.EXE)، اندروید (.APK) و نسخه نصبی'
                : '1. Windows (.EXE), Android (.APK) & Portable Exports'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('github_release')}
            className={`px-4 py-2 text-xs font-bold border flex items-center gap-2 cursor-pointer ${
              activeTab === 'github_release'
                ? 'bg-[#D97706] text-[#0B0908] border-[#FDE68A]'
                : 'bg-[#120F0D] text-[#D6C7B2] border-[#D97706]/40 hover:border-[#F59E0B]'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>
              {isFa
                ? '۲. انتشار مستقیم در GitHub Releases'
                : '2. Direct GitHub Release Publisher'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ci_workflow')}
            className={`px-4 py-2 text-xs font-bold border flex items-center gap-2 cursor-pointer ${
              activeTab === 'ci_workflow'
                ? 'bg-[#D97706] text-[#0B0908] border-[#FDE68A]'
                : 'bg-[#120F0D] text-[#D6C7B2] border-[#D97706]/40 hover:border-[#F59E0B]'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>
              {isFa
                ? '۳. پایپ‌لاین خودکار GitHub Actions (ساخت ابری EXE و APK)'
                : '3. Automated GitHub Actions CI/CD Workflow'}
            </span>
          </button>
        </div>

        {copiedLabel && (
          <div className="mt-3 p-2.5 bg-[#065F46]/60 border border-[#34D399] text-xs text-[#A7F3D0] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {isFa ? `${copiedLabel} در حافظه کپی شد!` : `Copied ${copiedLabel} to clipboard!`}
            </span>
          </div>
        )}

        {/* =====================================================================
            TAB 1: WINDOWS .EXE, ANDROID .APK & PWA EXPORTS
            ===================================================================== */}
        {activeTab === 'packages' && (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Windows Desktop (.EXE Installer & Portable .EXE) */}
            <div className="bg-[#120F0D]/95 border border-[#D97706]/50 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-[#1E3A8A] border border-[#60A5FA] text-[11px] font-mono text-[#DBEAFE]">
                    WINDOWS 10 / 11 (x64)
                  </span>
                  <Monitor className="w-5 h-5 text-[#F59E0B]" />
                </div>

                <h3 className="font-display text-lg font-bold text-[#FDE68A] mt-3">
                  {isFa
                    ? 'نسخه اجرایی ویندوز (Windows .EXE Installer & Portable)'
                    : 'Windows Desktop Executable (.EXE Installer & Portable)'}
                </h3>
                <p className="text-xs text-[#D6C7B2] mt-2 leading-relaxed">
                  {isFa
                    ? 'فایل‌های پیکربندی Electron (`electron/main.cjs` و `electron-builder.yml`) در پروژه قرار داده شده‌اند. با اجرای دستور زیر یا دانلود اسکریپت خودکار `.bat`، هم فایل نصبی (`Setup.exe`) و هم نسخه پرتابل بدون نیاز به نصب (`Portable.exe`) با شتاب‌دهنده گرافیکی و حالت تمام‌صفحه (F11) ساخته می‌شوند.'
                    : 'Configured via Electron (`electron/main.cjs` & `electron-builder.yml`). Generates both an NSIS Windows Installer `.exe` and a zero-install `Portable-x64.exe` with hardware acceleration and F11 fullscreen.'}
                </p>

                <div className="mt-3 bg-[#080605] border border-[#D97706]/30 p-2.5 font-mono text-[11px] text-[#FDE68A] dir-ltr text-left">
                  npm run build:win-exe
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#D97706]/25 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    downloadFile(
                      `Build-Shahnameh-Windows-EXE-v${runState.version}.bat`,
                      windowsExeBuilderBatch
                    )
                  }
                  className="px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] border border-[#FDE68A] text-xs font-bold text-[#FDE68A] flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {isFa
                      ? 'دانلود اسکریپت خودکار ساخت EXE ویندوز (.bat)'
                      : 'Download One-Click EXE Builder (.bat)'}
                  </span>
                </button>

                <button
                  onClick={() => copyText('npm run build:win-exe', 'دستور ساخت EXE')}
                  className="px-3 py-2 bg-[#1C1612] hover:bg-[#D97706]/20 border border-[#D97706]/50 text-xs text-[#D6C7B2] flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isFa ? 'کپی دستور' : 'Copy Command'}</span>
                </button>
              </div>
            </div>

            {/* Card 2: Android Mobile & Tablet (.APK) */}
            <div className="bg-[#120F0D]/95 border border-[#D97706]/50 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-[#065F46] border border-[#34D399] text-[11px] font-mono text-[#D1FAE5]">
                    ANDROID 8.0+ (.APK / .AAB)
                  </span>
                  <Smartphone className="w-5 h-5 text-[#34D399]" />
                </div>

                <h3 className="font-display text-lg font-bold text-[#FDE68A] mt-3">
                  {isFa
                    ? 'پکیج نصبی اندروید (Android .APK + دسته لمسی مجازی)'
                    : 'Android Package (.APK + Virtual Touch Gamepad)'}
                </h3>
                <p className="text-xs text-[#D6C7B2] mt-2 leading-relaxed">
                  {isFa
                    ? 'پیکربندی کامل Capacitor (`capacitor.config.json`) با شناسه `com.ferdowsi.shahnameh.ashes`، چرخش افقی خودکار (Landscape) و دسته لمسی اختصاصی برای گوشی و تبلت‌های اندرویدی آماده است.'
                    : 'Configured via Capacitor (`capacitor.config.json`) with sensorLandscape fullscreen mode and an on-screen Persian Miniature virtual touch gamepad.'}
                </p>

                <div className="mt-3 bg-[#080605] border border-[#D97706]/30 p-2.5 font-mono text-[11px] text-[#34D399] dir-ltr text-left">
                  npm run build:android-apk
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#D97706]/25 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    downloadFile(
                      `Build-Shahnameh-Android-APK-v${runState.version}.sh`,
                      androidApkBuilderScript
                    )
                  }
                  className="px-3.5 py-2 bg-[#065F46] hover:bg-[#047857] border border-[#FDE68A] text-xs font-bold text-[#FDE68A] flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {isFa
                      ? 'دانلود اسکریپت ساخت APK اندروید (.sh)'
                      : 'Download Android APK Builder (.sh)'}
                  </span>
                </button>

                <button
                  onClick={() => onToggleTouchControls(!touchControlsEnabled)}
                  className={`px-3 py-2 border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    touchControlsEnabled
                      ? 'bg-[#D97706] text-[#0B0908] border-[#FDE68A]'
                      : 'bg-[#1C1612] text-[#FDE68A] border-[#D97706]/50'
                  }`}
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>
                    {touchControlsEnabled
                      ? isFa
                        ? 'دسته لمسی اندروید: فعال'
                        : 'Touch Gamepad: ON'
                      : isFa
                      ? 'تست دسته لمسی اندروید'
                      : 'Test Android Touch Pad'}
                  </span>
                </button>
              </div>
            </div>

            {/* Card 3: macOS (.DMG), Linux (.AppImage / .deb) & Offline PWA */}
            <div className="md:col-span-2 bg-[#120F0D]/95 border border-[#D97706]/50 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-mono text-[#F59E0B]">
                  <Globe className="w-4 h-4" />
                  <span>MACOS (.DMG) · LINUX (.APPIMAGE / .DEB) · STANDALONE PWA MANIFEST</span>
                </div>
                <h4 className="font-display text-base font-bold text-[#FDE68A] mt-1">
                  {isFa
                    ? 'خروجی مک، لینوکس و مانیفست کامل انتشار (Release Bundle JSON)'
                    : 'macOS, Linux & Complete Release Bundle Manifest'}
                </h4>
                <p className="text-xs text-[#D6C7B2] mt-1">
                  {isFa
                    ? 'تمام آیکون‌های استاندارد (192x192، 512x512، Maskable و Apple Touch Icon) به همراه Service Worker آفلاین (`public/sw.js`) در پروژه فعال هستند.'
                    : 'Includes all compliant PWA icons (192px, 512px, maskable) and an offline Service Worker (`public/sw.js`) alongside macOS & Linux desktop targets.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    downloadFile(
                      `shahnameh-release-manifest-v${runState.version}.json`,
                      JSON.stringify(
                        {
                          ...SHAHNAMEH_BUILD_MANIFEST,
                          exportedAt: new Date().toISOString(),
                          targets: [
                            'Windows-x64-NSIS.exe',
                            'Windows-x64-Portable.exe',
                            'Android-Universal.apk',
                            'macOS-Universal.dmg',
                            'Linux-x86_64.AppImage',
                            'Web-PWA-Offline.zip',
                          ],
                          savedChronicleState: runState,
                        },
                        null,
                        2
                      ),
                      'application/json'
                    )
                  }
                  className="px-4 py-2 bg-[#991B1B] hover:bg-[#B91C1C] border border-[#F59E0B] text-xs font-bold text-[#FDE68A] flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {isFa
                      ? 'دانلود مانیفست کامل انتشار + ذخیره بازی (.JSON)'
                      : 'Download Release Manifest & Save (.JSON)'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: DIRECT GITHUB RELEASE PUBLISHER (REST API + CLI)
            ===================================================================== */}
        {activeTab === 'github_release' && (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Direct API Form */}
            <div className="bg-[#120F0D]/95 border border-[#D97706]/50 p-5">
              <h3 className="font-display text-base font-bold text-[#FDE68A]">
                {isFa
                  ? 'انتشار مستقیم نسخه جدید در GitHub Releases (از داخل بازی)'
                  : 'Create GitHub Release Directly via GitHub REST API'}
              </h3>
              <p className="text-xs text-[#D6C7B2] mt-1 leading-relaxed">
                {isFa
                  ? 'مشخصات مخزن گیت‌هاب خود را وارد کنید تا تگ نسخه (`v1.1.0`) و یادداشت‌های انتشار مستقیماً در GitHub Releases ثبت شود و پایپ‌لاین ساخت خودکار `.exe` و `.apk` آغاز گردد.'
                  : 'Publish a tagged release directly to your GitHub repository to trigger the automated Windows .EXE and Android .APK build workflow.'}
              </p>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block text-[#FDE68A] mb-1 font-semibold">
                    {isFa ? 'نام مخزن گیت‌هاب (owner/repo):' : 'GitHub Repository (owner/repo):'}
                  </label>
                  <input
                    type="text"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="username/shahnameh-crown-of-ashes"
                    className="w-full px-3 py-2 bg-[#080605] border border-[#D97706]/50 text-[#F5E6C8] font-mono dir-ltr text-left"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#FDE68A] mb-1 font-semibold">
                      {isFa ? 'تگ نسخه (Tag):' : 'Release Tag:'}
                    </label>
                    <input
                      type="text"
                      value={releaseTag}
                      onChange={(e) => setReleaseTag(e.target.value)}
                      className="w-full px-3 py-2 bg-[#080605] border border-[#D97706]/50 text-[#F5E6C8] font-mono dir-ltr text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-[#FDE68A] mb-1 font-semibold">
                      {isFa ? 'عنوان انتشار:' : 'Release Title:'}
                    </label>
                    <input
                      type="text"
                      value={releaseTitle}
                      onChange={(e) => setReleaseTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#080605] border border-[#D97706]/50 text-[#F5E6C8] font-mono dir-ltr text-left"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#FDE68A] mb-1 font-semibold">
                    {isFa
                      ? 'توکن گیت‌هاب (GitHub Personal Access Token - اختیاری برای ارسال مستقیم):'
                      : 'GitHub Personal Access Token (repo scope):'}
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 bg-[#080605] border border-[#D97706]/50 text-[#F5E6C8] font-mono dir-ltr text-left"
                  />
                </div>

                <button
                  onClick={handlePublishToGitHubApi}
                  className="w-full py-2.5 bg-[#991B1B] hover:bg-[#B91C1C] border border-[#FDE68A] text-[#FDE68A] font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isFa
                      ? 'ثبت انتشار در GitHub و شروع ساخت EXE / APK'
                      : 'Publish Release to GitHub Now'}
                  </span>
                </button>

                {publishStatus.type !== 'idle' && (
                  <div
                    className={`p-3 border text-xs ${
                      publishStatus.type === 'success'
                        ? 'bg-[#065F46]/50 border-[#34D399] text-[#D1FAE5]'
                        : publishStatus.type === 'error'
                        ? 'bg-[#7F1D1D]/50 border-[#F87171] text-[#FECACA]'
                        : 'bg-[#1E3A8A]/50 border-[#60A5FA] text-[#DBEAFE]'
                    }`}
                  >
                    <div>{publishStatus.message}</div>
                    {publishStatus.url && (
                      <a
                        href={publishStatus.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-1.5 underline text-[#FDE68A] font-mono"
                      >
                        {publishStatus.url}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Git CLI Script */}
            <div className="bg-[#120F0D]/95 border border-[#D97706]/50 p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-[#FDE68A]">
                  {isFa
                    ? 'اسکریپت ارسال با Git CLI (بدون نیاز به وارد کردن توکن در مرورگر)'
                    : 'One-Command Git CLI Push & Release Script'}
                </h3>
                <p className="text-xs text-[#D6C7B2] mt-1">
                  {isFa
                    ? 'اگر ترجیح می‌دهید از ترمینال سیستم خود پروژه را به گیت‌هاب پوش کنید، این دستورات کد کامل بازی و پایپ‌لاین GitHub Actions را ارسال کرده و به صورت خودکار فایل‌های `.exe` و `.apk` را در بخش Releases مخزن شما منتشر می‌کنند:'
                    : 'Run these commands in your terminal to push the repository and trigger the GitHub Actions multi-platform release workflow:'}
                </p>

                <pre className="mt-3 p-3 bg-[#080605] border border-[#D97706]/35 font-mono text-[11px] text-[#FDE68A] overflow-x-auto dir-ltr text-left leading-relaxed">
                  {githubCliReleaseScript}
                </pre>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    copyText(githubCliReleaseScript, 'اسکریپت انتشار گیت‌هاب')
                  }
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] border border-[#FDE68A] text-xs font-bold text-[#FDE68A] flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isFa ? 'کپی دستورات Git' : 'Copy Git Commands'}</span>
                </button>

                <button
                  onClick={() =>
                    downloadFile('release-to-github.sh', githubCliReleaseScript)
                  }
                  className="px-4 py-2 bg-[#1C1612] hover:bg-[#D97706]/20 border border-[#D97706]/50 text-xs text-[#D6C7B2] flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isFa ? 'دانلود فایل release-to-github.sh' : 'Download .sh'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: GITHUB ACTIONS CI/CD WORKFLOW VIEWER
            ===================================================================== */}
        {activeTab === 'ci_workflow' && (
          <div className="mt-5 bg-[#120F0D]/95 border border-[#D97706]/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-display text-base font-bold text-[#FDE68A]">
                  {isFa
                    ? 'فایل پایپ‌لاین `.github/workflows/release-multiplatform.yml` (موجود در پروژه)'
                    : 'Active Repository Workflow: `.github/workflows/release-multiplatform.yml`'}
                </h3>
                <p className="text-xs text-[#D6C7B2]">
                  {isFa
                    ? 'این فایل در مسیر `.github/workflows/release-multiplatform.yml` پروژه ذخیره شده است و روی سرورهای گیت‌هاب به صورت موازی نسخه‌های Windows EXE، Android APK، macOS DMG، Linux AppImage و Web PWA را کامپایل و منتشر می‌کند.'
                    : 'Already saved in `.github/workflows/release-multiplatform.yml`. Automatically builds Windows EXE, Android APK, macOS DMG, Linux AppImage, and Web ZIP on GitHub-hosted runners.'}
                </p>
              </div>

              <button
                onClick={() =>
                  copyText(
                    `git tag -f v${runState.version} && git push -f origin v${runState.version}`,
                    'دستور فعال‌سازی GitHub Actions'
                  )
                }
                className="px-3.5 py-1.5 bg-[#065F46] border border-[#FDE68A] text-xs font-bold text-[#FDE68A] flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isFa ? 'کپی دستور تگ انتشار' : 'Copy Release Tag Cmd'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-[#080605] border border-[#D97706]/35 p-3">
                <div className="text-[#F59E0B] font-bold">JOB 1 · WEB / PWA</div>
                <div className="text-[#D6C7B2] mt-1">
                  Runs unit tests (`rules.test.ts`), builds Vite bundle (`--base=./`), and packages `Web-PWA-Offline.zip`.
                </div>
              </div>
              <div className="bg-[#080605] border border-[#60A5FA]/40 p-3">
                <div className="text-[#60A5FA] font-bold">JOB 2 · WINDOWS .EXE</div>
                <div className="text-[#D6C7B2] mt-1">
                  Runs on `windows-latest` with `electron-builder --win` to produce `NSIS Setup.exe` &amp; `Portable.exe`.
                </div>
              </div>
              <div className="bg-[#080605] border border-[#34D399]/40 p-3">
                <div className="text-[#34D399] font-bold">JOB 3 · ANDROID .APK</div>
                <div className="text-[#D6C7B2] mt-1">
                  Runs on `ubuntu-latest` with Java 21, Android SDK, Capacitor &amp; `./gradlew assembleDebug` to output `.apk`.
                </div>
              </div>
              <div className="bg-[#080605] border border-[#F87171]/40 p-3">
                <div className="text-[#F87171] font-bold">JOB 4 · GITHUB RELEASE</div>
                <div className="text-[#D6C7B2] mt-1">
                  Publishes all `.exe`, `.apk`, `.dmg`, `.AppImage`, `.deb`, and `.zip` files to GitHub Releases.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
