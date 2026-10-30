import React, { useCallback } from 'react';
import { GameLanguage } from '../data/i18nAndSettings';

interface MobileTouchControlsProps {
  language: GameLanguage;
  visible: boolean;
}

/**
 * Virtual Touch Gamepad for Android APK & Touchscreen Devices.
 * Dispatches synthetic KeyboardEvents ('keydown' / 'keyup') to window so
 * the 60fps Canvas2D engine responds identically on Android APK and Desktop EXE.
 */
export const MobileTouchControls: React.FC<MobileTouchControlsProps> = ({
  language,
  visible,
}) => {
  const isFa = language !== 'en';

  const triggerKey = useCallback((code: string, key: string, type: 'keydown' | 'keyup') => {
    window.dispatchEvent(
      new KeyboardEvent(type, {
        code,
        key,
        bubbles: true,
        cancelable: true,
      })
    );
  }, []);

  const tapKey = useCallback(
    (code: string, key: string) => {
      triggerKey(code, key, 'keydown');
      setTimeout(() => triggerKey(code, key, 'keyup'), 90);
    },
    [triggerKey]
  );

  if (!visible) return null;

  return (
    <div
      dir="ltr"
      className="fixed inset-x-0 bottom-12 z-25 pointer-events-none flex items-end justify-between px-4 md:px-8 select-none"
      aria-label="Android APK Touch Gamepad"
    >
      {/* Left Side: 4-Way Persian Miniature Directional Pad (WASD) */}
      <div className="pointer-events-auto grid grid-cols-3 gap-1.5 w-36 h-36 bg-[#14100D]/75 border border-[#D97706]/60 p-2 rounded-full shadow-[0_0_25px_rgba(0,0,0,0.85)]">
        <div />
        <button
          type="button"
          onPointerDown={() => triggerKey('KeyW', 'w', 'keydown')}
          onPointerUp={() => triggerKey('KeyW', 'w', 'keyup')}
          onPointerLeave={() => triggerKey('KeyW', 'w', 'keyup')}
          className="bg-[#1C1612] active:bg-[#D97706] border border-[#D97706]/60 text-[#FDE68A] active:text-[#0B0908] font-bold text-xs flex items-center justify-center cursor-pointer"
        >
          ▲
        </button>
        <div />

        <button
          type="button"
          onPointerDown={() => triggerKey('KeyA', 'a', 'keydown')}
          onPointerUp={() => triggerKey('KeyA', 'a', 'keyup')}
          onPointerLeave={() => triggerKey('KeyA', 'a', 'keyup')}
          className="bg-[#1C1612] active:bg-[#D97706] border border-[#D97706]/60 text-[#FDE68A] active:text-[#0B0908] font-bold text-xs flex items-center justify-center cursor-pointer"
        >
          ◀
        </button>
        <div className="flex items-center justify-center text-[9px] font-mono text-[#A89882]">
          APK
        </div>
        <button
          type="button"
          onPointerDown={() => triggerKey('KeyD', 'd', 'keydown')}
          onPointerUp={() => triggerKey('KeyD', 'd', 'keyup')}
          onPointerLeave={() => triggerKey('KeyD', 'd', 'keyup')}
          className="bg-[#1C1612] active:bg-[#D97706] border border-[#D97706]/60 text-[#FDE68A] active:text-[#0B0908] font-bold text-xs flex items-center justify-center cursor-pointer"
        >
          ▶
        </button>

        <div />
        <button
          type="button"
          onPointerDown={() => triggerKey('KeyS', 's', 'keydown')}
          onPointerUp={() => triggerKey('KeyS', 's', 'keyup')}
          onPointerLeave={() => triggerKey('KeyS', 's', 'keyup')}
          className="bg-[#1C1612] active:bg-[#D97706] border border-[#D97706]/60 text-[#FDE68A] active:text-[#0B0908] font-bold text-xs flex items-center justify-center cursor-pointer"
        >
          ▼
        </button>
        <div />
      </div>

      {/* Right Side: Combat & Div-Warfare Action Buttons */}
      <div className="pointer-events-auto grid grid-cols-3 gap-2 bg-[#14100D]/80 border border-[#D97706]/60 p-2.5 shadow-[0_0_25px_rgba(0,0,0,0.85)]">
        <button
          type="button"
          onClick={() => tapKey('KeyQ', 'q')}
          className="w-16 h-12 bg-[#D97706]/30 active:bg-[#D97706] border border-[#F59E0B] text-[#FDE68A] active:text-[#0B0908] text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer"
        >
          <span>[Q]</span>
          <span>{isFa ? 'سنگ سده' : 'Flint'}</span>
        </button>

        <button
          type="button"
          onClick={() => tapKey('KeyF', 'f')}
          className="w-16 h-12 bg-[#1E3A8A]/65 active:bg-[#3B82F6] border border-[#60A5FA] text-[#DBEAFE] text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer"
        >
          <span>[F]</span>
          <span>{isFa ? 'دیوبند' : 'Bind'}</span>
        </button>

        <button
          type="button"
          onClick={() => tapKey('KeyE', 'e')}
          className="w-16 h-12 bg-[#7F1D1D]/70 active:bg-[#EF4444] border border-[#F87171] text-[#FECACA] text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer"
        >
          <span>[E]</span>
          <span>{isFa ? 'اسطوره' : 'Mythic'}</span>
        </button>

        <button
          type="button"
          onClick={() => tapKey('ShiftLeft', 'Shift')}
          className="w-16 h-12 bg-[#1C1612] active:bg-[#D97706] border border-[#D97706]/60 text-[#D6C7B2] text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer"
        >
          <span>[Shift]</span>
          <span>{isFa ? 'جهش' : 'Dash'}</span>
        </button>

        <button
          type="button"
          onClick={() => tapKey('Space', ' ')}
          className="col-span-2 h-12 bg-[#991B1B] active:bg-[#EF4444] border-2 border-[#FDE68A] text-[#FDE68A] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>⚔</span>
          <span>{isFa ? 'ضربه گرز [Space]' : 'Mace Strike [Space]'}</span>
        </button>
      </div>
    </div>
  );
};
