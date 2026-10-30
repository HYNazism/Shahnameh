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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070504]/90 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="parchment-panel miniature-border w-full max-w-4xl p-6 md:p-8 text-[#F5E6C8] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D97706]/35">
          <div>
            <div className="text-xs text-[#D97706] font-mono-tabular">
              {isFa
                ? 'پیکربندی کامل موتور نگارگری و رزم · از کم تا حداکثر'
                : 'GRANULAR ENGINE & MINIATURE CONFIGURATION · LOW TO MAXIMUM'}
            </div>
            <h2
              id="settings-modal-title"
              className="font-display text-xl md:text-2xl font-bold text-[#FDE68A] mt-1"
            >
              {ui.settingsModalTitle}
            </h2>
            <p className="text-xs text-[#E7D1A7]/80 mt-0.5">{ui.settingsModalSubtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdateSettings(DEFAULT_GAME_SETTINGS)}
              className="px-3.5 py-2 text-xs font-semibold bg-[#1C1612] hover:bg-[#2E231C] text-[#E7D1A7] border border-[#D97706]/40 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isFa ? 'بازنشانی به پیش‌فرض' : 'Reset Defaults'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-[#991B1B] hover:bg-[#B91C1C] text-[#FDE68A] border border-[#F59E0B] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isFa ? 'ذخیره و بستن [O]' : 'Save & Close [O]'}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. LANGUAGE & NARRATIVE REGISTER */}
          <div className="p-4 bg-[#0D0A08]/90 border border-[#D97706]/35 space-y-3">
            <h3 className="font-display text-sm font-bold text-[#FDE68A]">
              {ui.languageSectionTitle}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'fa', label: 'فارسی سلیس (پیش‌فرض)' },
                  { id: 'fa_classical', label: 'پارسی کهن (نقالی)' },
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
                  ? 'باز شدن خودکار طومار روایت در آغاز هر عصر'
                  : 'Auto-open Shahnameh Scroll on new Epoch'}
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
          <div className="p-4 bg-[#0D0A08]/90 border border-[#D97706]/35 space-y-3">
            <h3 className="font-display text-sm font-bold text-[#FDE68A]">
              {ui.qualitySectionTitle}
            </h3>

            {/* Preset Buttons: Low -> Medium -> High -> Ultra (Maximum) */}
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
                <div className="flex justify-between text-[#E7D1A7]">
                  <label htmlFor="slider-ornament">
                    {isFa
                      ? 'سطح جزئیات نگارگری، ابرهای اسلیمی و تذهیب'
                      : 'Miniature Ornamentation & Sky Detail'}
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
                    {isFa
                      ? 'تراکم ذرات اخگر، طلاکوب و جرقه آتش سده'
                      : 'Particle & Gold-Leaf Spark Density'}
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
                    {isFa
                      ? 'شدت لرزش دوربین و مکث ضربه (Hitstop)'
                      : 'Camera Shake & Hitstop Intensity'}
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

          {/* 3. GAMEPLAY DIFFICULTY & DIV-WARFARE PARAMETERS */}
          <div className="p-4 bg-[#0D0A08]/90 border border-[#D97706]/35 space-y-3">
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
                    {isFa
                      ? 'ضریب سرعت، تهاجم و آسیب دیوان (کم تا حداکثر)'
                      : 'Div Speed & Aggression Scale (Low to Max)'}
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

          {/* 4. MODAL AUDIO & PERCUSSION SYNTHESIS */}
          <div className="p-4 bg-[#0D0A08]/90 border border-[#D97706]/35 space-y-3">
            <h3 className="font-display text-sm font-bold text-[#FDE68A]">
              {ui.audioSectionTitle}
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[#E7D1A7]">
                  <label htmlFor="slider-master-vol">
                    {isFa ? 'حجم صدای کل (Master Volume)' : 'Master Volume'}
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
                    {isFa
                      ? 'صدای رزم، سنگ آتشین سده و کوبش گرز'
                      : 'Combat, Sadeh Flint & Mace SFX'}
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
                    {isFa
                      ? 'نوای سنتور و زنگ‌های مقامی شاهنامه'
                      : 'Santur & Persian Modal Chimes'}
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
