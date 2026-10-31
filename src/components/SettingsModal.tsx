import React from 'react';
import {
  applyDifficultyPreset,
  applyQualityPreset,
  DEFAULT_GAME_SETTINGS,
  DifficultyTier,
  GameLanguage,
  GameSettings,
  QualityTier,
  UI_DICTIONARY,
} from '../data/i18nAndSettings';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (next: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const ui = UI_DICTIONARY[settings.language];
  const isFa = settings.language !== 'en';

  const handleQualityPreset = (tier: QualityTier) => {
    onUpdateSettings(applyQualityPreset(settings, tier));
  };

  const handleDifficultyPreset = (diff: DifficultyTier) => {
    onUpdateSettings(applyDifficultyPreset(settings, diff));
  };

  const handleLanguageChange = (lang: GameLanguage) => {
    onUpdateSettings({ ...settings, language: lang });
  };

  return (
    <div
      dir={ui.dir}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#070504]/90 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="parchment-panel miniature-border w-full max-w-4xl p-4 sm:p-6 md:p-7 text-[#F5E6C8] max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#D97706]/35">
          <div>
            <h2
              id="settings-modal-title"
              className="font-display text-lg sm:text-2xl font-bold text-[#FDE68A]"
            >
              {ui.settingsModalTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdateSettings(DEFAULT_GAME_SETTINGS)}
              className="px-3 py-1.5 text-xs font-semibold bg-[#1C1612] hover:bg-[#2E231C] text-[#E7D1A7] border border-[#D97706]/40 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isFa ? 'پیش‌فرض' : 'Reset'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-[#991B1B] hover:bg-[#B91C1C] text-[#FDE68A] border border-[#F59E0B] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isFa ? 'ذخیره و بستن' : 'Save & Close'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* 1. LANGUAGE & NARRATIVE REGISTER */}
          <div className="p-3.5 sm:p-4 bg-[#0D0A08]/90 border border-[#D97706]/35 space-y-3">
            <h3 className="font-display text-sm font-bold text-[#FDE68A]">
              {ui.languageSectionTitle}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'fa', label: 'فارسی سلیس' },
                  { id: 'fa_classical', label: 'پارسی کهن' },
                  { id: 'en', label: 'English' },
                ] as { id: GameLanguage; label: string }[]
              ).map((langOpt) => (
                <button
                  key={langOpt.id}
                  type="button"
                  onClick={() => handleLanguageChange(langOpt.id)}
                  className={`py-2 px-2 text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap truncate ${
                    settings.language === langOpt.id
                      ? 'bg-[#D97706] text-[#0B0908] border-[#FDE68A]'
                      : 'bg-[#1C1612] text-[#E7D1A7] border-[#D97706]/40 hover:border-[#D97706]'
                  }`}
                >
                  {langOpt.label}
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-[#E7D1A7]">
              <span>
                {isFa
                  ? 'باز شدن خودکار طومار در آغاز هر عصر'
                  : 'Auto-open Scroll on new Epoch'}
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    autoOpenDecreeOnEpoch: !settings.autoOpenDecreeOnEpoch,
                  })
                }
                className={`px-3 py-1 text-xs font-mono-tabular border cursor-pointer ${
                  settings.autoOpenDecreeOnEpoch
                    ? 'bg-[#1E3A8A] text-[#FDE68A] border-[#60A5FA]'
                    : 'bg-[#1C1612] text-[#E7D1A7] border-[#D97706]/40'
                }`}
              >
                {settings.autoOpenDecreeOnEpoch
                  ? isFa
                    ? 'فعال'
                    : 'Enabled'
                  : isFa
                  ? 'غیرفعال'
                  : 'Disabled'}
              </button>
            </div>
          </div>

          {/* 2. GRAPHICS & PERSIAN MINIATURE DETAIL (LOW TO MAXIMUM) */}
          <div className="p-3.5 sm:p-4 bg-[#0D0A08]/90 border border-[#D97706]/35 space-y-3">
            <h3 className="font-display text-sm font-bold text-[#FDE68A]">
              {ui.qualitySectionTitle}
            </h3>

            {/* Engine Mode */}
            <div className="grid grid-cols-2 gap-2 pb-1">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, renderDimension: '3d_gore' })}
                className={`py-2 px-2 text-xs font-bold border cursor-pointer ${
                  settings.renderDimension === '3d_gore'
                    ? 'bg-[#991B1B] text-[#FDE68A] border-[#FDE68A]'
                    : 'bg-[#1C1612] text-[#E7D1A7] border-[#D97706]/40'
                }`}
              >
                {isFa ? 'نمای سه‌بعدی' : '3D Arena'}
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, renderDimension: '2d_miniature' })}
                className={`py-2 px-2 text-xs font-bold border cursor-pointer ${
                  settings.renderDimension === '2d_miniature'
                    ? 'bg-[#1E3A8A] text-[#FDE68A] border-[#FDE68A]'
                    : 'bg-[#1C1612] text-[#E7D1A7] border-[#D97706]/40'
                }`}
              >
                {isFa ? 'نگارگری دوبعدی' : '2D Miniature'}
              </button>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'low', label: ui.presetLow },
                  { id: 'medium', label: ui.presetMedium },
                  { id: 'high', label: ui.presetHigh },
                  { id: 'ultra', label: ui.presetUltra },
                ] as { id: QualityTier; label: string }[]
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleQualityPreset(preset.id)}
                  className={`py-1.5 px-2 text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap truncate ${
                    settings.qualityTier === preset.id
                      ? 'bg-[#D97706] text-[#0B0908] border-[#FDE68A]'
                      : 'bg-[#1C1612] text-[#E7D1A7] border-[#D97706]/40 hover:border-[#D97706]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Granular Sliders */}
            <div className="space-y-2 pt-1 text-xs">
              <div>
                <div className="flex justify-between text-[#FECACA]">
                  <label htmlFor="slider-gore">
                    {isFa ? 'شدت پاشش خون و قطع عضو' : 'Gore & Blood Intensity'}
                  </label>
                  <span className="font-mono-tabular text-[#F87171]">
                    {Math.round(settings.goreIntensityMultiplier * 100)}%
                  </span>
                </div>
                <input
                  id="slider-gore"
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={settings.goreIntensityMultiplier}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      goreIntensityMultiplier: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[#DC2626] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#FECACA] pb-1">
                <span>{isFa ? 'قطع عضو در ضربات سنگین' : 'Limb Dismemberment'}</span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      dismembermentEnabled: !settings.dismembermentEnabled,
                    })
                  }
                  className={`px-3 py-0.5 text-xs font-mono-tabular border cursor-pointer ${
                    settings.dismembermentEnabled
                      ? 'bg-[#991B1B] text-[#FDE68A] border-[#F87171]'
                      : 'bg-[#1C1612] text-[#E7D1A7] border-[#D97706]/40'
                  }`}
                >
                  {settings.dismembermentEnabled
                    ? isFa
                      ? 'فعال'
                      : 'Active'
                    : isFa
                    ? 'غیرفعال'
                    : 'Off'}
                </button>
              </div>

              <div>
                <div className="flex justify-between text-[#E7D1A7]">
                  <label htmlFor="slider-ornament">
                    {isFa ? 'سطح جزئیات نگارگری و تذهیب' : 'Miniature Ornament Detail'}
                  </label>
                  <span className="font-mono-tabular text-[#FDE68A]">
                    {settings.miniatureOrnamentLevel} / 4
                  </span>
                </div>
                <input
                  id="slider-ornament"
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={settings.miniatureOrnamentLevel}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      miniatureOrnamentLevel: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[#D97706] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#E7D1A7]">
                  <label htmlFor="slider-particles">
                    {isFa ? 'تراکم ذرات و جرقه آتش' : 'Particle & Spark Density'}
                  </label>
                  <span className="font-mono-tabular text-[#FDE68A]">
                    {Math.round(settings.particleDensityMultiplier * 100)}%
                  </span>
                </div>
                <input
                  id="slider-particles"
                  type="range"
                  min={0.25}
                  max={2.0}
                  step={0.25}
                  value={settings.particleDensityMultiplier}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      particleDensityMultiplier: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[#D97706] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#E7D1A7]">
                  <label htmlFor="slider-shake">
                    {isFa ? 'شدت لرزش دوربین و مکث ضربه' : 'Camera Shake & Hitstop'}
                  </label>
                  <span className="font-mono-tabular text-[#FDE68A]">
                    {Math.round(settings.cameraShakeIntensity * 100)}%
                  </span>
                </div>
                <input
                  id="slider-shake"
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.25}
                  value={settings.cameraShakeIntensity}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateSettings({
                      ...settings,
                      cameraShakeIntensity: val,
                      hitstopScale: val,
                    });
                  }}
                  className="w-full accent-[#D97706] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 3. GAMEPLAY DIFFICULTY */}
          <div className="p-3.5 sm:p-4 bg-[#0D0A08]/90 border border-[#D97706]/35 space-y-3">
            <h3 className="font-display text-sm font-bold text-[#FDE68A]">
              {ui.gameplaySectionTitle}
            </h3>

            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'story', label: ui.diffStory },
                  { id: 'balanced', label: ui.diffBalanced },
                  { id: 'hard', label: ui.diffHard },
                  { id: 'maximum', label: ui.diffMax },
                ] as { id: DifficultyTier; label: string }[]
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleDifficultyPreset(d.id)}
                  className={`py-1.5 px-2 text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap truncate ${
                    settings.difficultyTier === d.id
                      ? 'bg-[#991B1B] text-[#FDE68A] border-[#F59E0B]'
                      : 'bg-[#1C1612] text-[#E7D1A7] border-[#D97706]/40 hover:border-[#D97706]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div>
                <div className="flex justify-between text-[#E7D1A7]">
                  <label htmlFor="slider-aggression">
                    {isFa ? 'ضریب سرعت و تهاجم دیوان' : 'Enemy Speed & Aggression'}
                  </label>
                  <span className="font-mono-tabular text-[#FDE68A]">
                    {Math.round(settings.enemyAggressionScale * 100)}%
                  </span>
                </div>
                <input
                  id="slider-aggression"
                  type="range"
                  min={0.7}
                  max={1.5}
                  step={0.1}
                  value={settings.enemyAggressionScale}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      enemyAggressionScale: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[#DC2626] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 4. AUDIO */}
          <div className="p-3.5 sm:p-4 bg-[#0D0A08]/90 border border-[#D97706]/35 space-y-3">
            <h3 className="font-display text-sm font-bold text-[#FDE68A]">
              {ui.audioSectionTitle}
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[#E7D1A7]">
                  <label htmlFor="slider-master-vol">
                    {isFa ? 'حجم صدای کل' : 'Master Volume'}
                  </label>
                  <span className="font-mono-tabular text-[#FDE68A]">{settings.masterVolume}%</span>
                </div>
                <input
                  id="slider-master-vol"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={settings.masterVolume}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, masterVolume: Number(e.target.value) })
                  }
                  className="w-full accent-[#D97706] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#E7D1A7]">
                  <label htmlFor="slider-sfx-vol">
                    {isFa ? 'صدای رزم و ضربه گرز' : 'Combat & Strike SFX'}
                  </label>
                  <span className="font-mono-tabular text-[#FDE68A]">{settings.sfxVolume}%</span>
                </div>
                <input
                  id="slider-sfx-vol"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={settings.sfxVolume}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, sfxVolume: Number(e.target.value) })
                  }
                  className="w-full accent-[#D97706] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#E7D1A7]">
                  <label htmlFor="slider-chime-vol">
                    {isFa ? 'نوای سنتور و موسیقی' : 'Music & Modal Chimes'}
                  </label>
                  <span className="font-mono-tabular text-[#FDE68A]">
                    {settings.musicChimeVolume}%
                  </span>
                </div>
                <input
                  id="slider-chime-vol"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={settings.musicChimeVolume}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, musicChimeVolume: Number(e.target.value) })
                  }
                  className="w-full accent-[#D97706] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
