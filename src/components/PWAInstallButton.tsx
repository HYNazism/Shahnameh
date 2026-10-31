import React, { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { GameLanguage } from '../data/i18nAndSettings';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export const PWAInstallButton: React.FC<{
  language: GameLanguage;
  onFallbackOpenExportModal: () => void;
}> = ({ language, onFallbackOpenExportModal }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isFa = language !== 'en';

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#065F46] hover:bg-[#047857] border border-[#FDE68A] text-xs font-bold text-[#FDE68A] cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{isFa ? 'نصب بازی' : 'Install App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#181310] border border-[#D97706]/50 text-xs text-[#FDE68A] hover:bg-[#D97706]/20 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{isFa ? 'نصب روی گوشی' : 'Install on iOS'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto">
            <div className="parchment-panel miniature-border max-w-sm w-full p-6 text-center">
              <h3 className="font-display text-lg font-bold text-[#FDE68A]">
                {isFa ? 'راهنمای نصب روی گوشی' : 'Install on iPhone / iPad'}
              </h3>
              <p className="mt-3 text-xs text-[#F5E6C8] leading-relaxed">
                {isFa ? (
                  <>
                    ۱. دکمه اشتراک‌گذاری مرورگر را بزنید.
                    <br />
                    ۲. گزینه افزودن به صفحه اصلی را انتخاب کنید.
                  </>
                ) : (
                  <>
                    1. Tap the <strong>Share</strong> button in Safari toolbar.
                    <br />
                    2. Scroll down and tap <strong>Add to Home Screen</strong>.
                  </>
                )}
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2 bg-[#991B1B] border border-[#F59E0B] text-xs font-bold text-[#FDE68A] cursor-pointer"
              >
                {isFa ? 'بستن' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      onClick={onFallbackOpenExportModal}
      data-open-export="true"
      className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#065F46]/85 hover:bg-[#047857] border border-[#FDE68A]/80 text-xs font-bold text-[#FDE68A] cursor-pointer"
    >
      <Download className="w-3.5 h-3.5" />
      <span>{isFa ? 'دریافت و خروجی بازی' : 'Download & Export'}</span>
    </button>
  );
};
