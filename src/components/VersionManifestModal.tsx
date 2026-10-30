import React, { useState } from 'react';
import {
  SHAHNAMEH_BUILD_MANIFEST,
  generateUpdateDeploymentScript,
} from '../data/versionManifest';
import { GameLanguage, UI_DICTIONARY } from '../data/i18nAndSettings';
import { PlayerRunState } from '../game/rules';

interface VersionManifestModalProps {
  runState: PlayerRunState;
  language: GameLanguage;
  onApplyVersionUpdate: (targetVersion: string) => void;
  onClose: () => void;
}

export const VersionManifestModal: React.FC<VersionManifestModalProps> = ({
  runState,
  language,
  onApplyVersionUpdate,
  onClose,
}) => {
  const [selectedTab, setSelectedTab] = useState<'releases' | 'manifest_json' | 'deploy_script'>(
    'releases'
  );
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);
  const [migrationBanner, setMigrationBanner] = useState<string | null>(null);

  const ui = UI_DICTIONARY[language];
  const isFa = language !== 'en';

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedFeedback(isFa ? `${label} در حافظه کپی شد` : `Copied ${label} to clipboard`);
    setTimeout(() => setCopiedFeedback(null), 2500);
  };

  const handleSelectVersion = (ver: string) => {
    onApplyVersionUpdate(ver);
    setMigrationBanner(
      isFa
        ? `ذخیره بازی با موفقیت به نسخه v${ver} ارتقا یافت و وارد عصر جدید شدید (بدون از دست رفتن تراز اخلاقی ${runState.alignment} و ثبات ایران‌شهر ${Math.round(runState.iranshahrStability)}٪).`
        : `Sequentially migrated chronicle save state to v${ver} without losing Asha/Ahriman alignment (${runState.alignment}) or Iranshahr Stability (${Math.round(runState.iranshahrStability)}%).`
    );
  };

  const manifestJsonString = JSON.stringify(
    {
      ...SHAHNAMEH_BUILD_MANIFEST,
      activeVersion: runState.version,
      liveSaveLedger: {
        schemaVersion: runState.schemaVersion,
        epochIndex: runState.epochIndex,
        alignment: runState.alignment,
        iranshahrStability: runState.iranshahrStability,
        divsBoundCount: runState.divsBoundCount,
        decisionsCount: runState.decisions.length,
      },
    },
    null,
    2
  );

  const deployScriptString = generateUpdateDeploymentScript(runState.version);

  return (
    <div
      dir={ui.dir}
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#070504]/90 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manifest-modal-title"
    >
      <div className="parchment-panel miniature-border w-full max-w-4xl p-6 md:p-8 text-[#F5E6C8] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#D97706]/35">
          <div>
            <div className="text-xs text-[#D97706] font-mono-tabular">
              {isFa
                ? `معماری ماژولار و خودکار نسخه‌ها · نسخه فعال v${runState.version}`
                : `MODULAR & AUTOMATED VERSIONING ARCHITECTURE · ACTIVE BUILD v${runState.version}`}
            </div>
            <h2
              id="manifest-modal-title"
              className="font-display text-xl md:text-2xl font-bold text-[#FDE68A] mt-1"
            >
              {isFa
                ? 'کنسول ارتقای ترتیبی نسخه‌ها (v1.0 ← v1.1 هوشنگ ← v1.2 طهمورث ← v2.0 کاوه)'
                : 'Shahnameh Sequential Release & Save Migration Console'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-[#292524] hover:bg-[#44403C] text-[#F5E6C8] border border-[#D97706]/50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isFa ? 'بستن کنسول [V]' : 'Close Console [V]'}
          </button>
        </div>

        {/* Interactive Tab Selector */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedTab('releases')}
              className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedTab === 'releases'
                  ? 'bg-[#D97706] text-[#0B0908] border-[#FDE68A]'
                  : 'bg-[#1C1917] text-[#E7D1A7] border-[#D97706]/40 hover:border-[#D97706]'
              }`}
            >
              {isFa ? 'نسخه‌های ترتیبی (v1.0 تا v2.0)' : 'Sequential Epochs (v1.0 → v2.0)'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('manifest_json')}
              className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedTab === 'manifest_json'
                  ? 'bg-[#D97706] text-[#0B0908] border-[#FDE68A]'
                  : 'bg-[#1C1917] text-[#E7D1A7] border-[#D97706]/40 hover:border-[#D97706]'
              }`}
            >
              {isFa ? 'فایل مانیفست JSON' : 'Build Manifest JSON'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('deploy_script')}
              className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedTab === 'deploy_script'
                  ? 'bg-[#D97706] text-[#0B0908] border-[#FDE68A]'
                  : 'bg-[#1C1917] text-[#E7D1A7] border-[#D97706]/40 hover:border-[#D97706]'
              }`}
            >
              {isFa ? 'اسکریپت خودکار انتشار' : 'Automated Update Script'}
            </button>
          </div>

          {copiedFeedback && (
            <span className="text-xs font-mono-tabular text-[#FDE68A]">{copiedFeedback}</span>
          )}
        </div>

        {migrationBanner && (
          <div className="mt-3 p-3 bg-[#0F1E36] border border-[#F59E0B] text-xs text-[#FDE68A]">
            {migrationBanner}
          </div>
        )}

        {/* Tab Body */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4">
          {selectedTab === 'releases' && (
            <div className="space-y-4">
              {SHAHNAMEH_BUILD_MANIFEST.releases.map((rel) => {
                const isActive = runState.version === rel.version;
                return (
                  <div
                    key={rel.version}
                    className={`p-4 border ${
                      isActive
                        ? 'bg-[#1C150D] border-[#FDE68A]'
                        : 'bg-[#0F0C0A] border-[#D97706]/35'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-[#D97706] font-mono-tabular">
                          VERSION v{rel.version} · SCHEMA v{rel.schemaVersion} · RELEASE{' '}
                          {rel.releaseDate}
                        </div>
                        <h3 className="font-display text-lg font-bold text-[#FDE68A] mt-0.5">
                          {isFa ? rel.persianCodename : rel.codename}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectVersion(rel.version)}
                        disabled={isActive}
                        className={`px-4 py-2 text-xs font-semibold border whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-[#1E3A8A] text-[#FDE68A] border-[#60A5FA] cursor-default'
                            : 'bg-[#991B1B] hover:bg-[#B91C1C] text-[#F5E6C8] border-[#F59E0B]'
                        }`}
                      >
                        {isActive
                          ? isFa
                            ? `نسخه فعال (v${rel.version})`
                            : `Active Build (v${rel.version})`
                          : isFa
                          ? `ارتقا و ورود به نسخه v${rel.version}`
                          : `Migrate & Load v${rel.version}`}
                      </button>
                    </div>

                    <p className="mt-2 text-xs md:text-sm text-[#E7D1A7] leading-relaxed">
                      {rel.summary}
                    </p>

                    {rel.newMechanics && rel.newMechanics.length > 0 && (
                      <div className="mt-2 space-y-1 text-xs text-[#FDE68A]/90">
                        {rel.newMechanics.map((m, idx) => (
                          <div key={idx}>• {m}</div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 pt-2 border-t border-[#D97706]/25 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#D97706] font-mono-tabular">
                      <span>
                        {isFa
                          ? `تعداد فصول فعال: ${rel.chaptersIncluded.length}`
                          : `Chapters: ${rel.chaptersIncluded.length}`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Compatible From: v{rel.compatibleFrom.join(', v')}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {isFa
                          ? `پاداش فره در ارتقا: +${rel.migrationRules.bonusFarrOnUpgrade}`
                          : `Bonus Farr on Upgrade: +${rel.migrationRules.bonusFarrOnUpgrade}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedTab === 'manifest_json' && (
            <div dir="ltr">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#D97706]">
                  version-manifest-v{runState.version}.json
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(manifestJsonString, 'Manifest JSON')}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#D97706] text-[#0B0908] hover:bg-[#F59E0B] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isFa ? 'کپی فایل مانیفست JSON' : 'Copy Manifest JSON'}
                </button>
              </div>
              <pre className="p-4 bg-[#080605] border border-[#D97706]/40 text-xs font-mono-tabular text-[#E7D1A7] overflow-x-auto text-left">
                {manifestJsonString}
              </pre>
            </div>
          )}

          {selectedTab === 'deploy_script' && (
            <div dir="ltr">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#D97706]">
                  deploy-shahnameh-v{runState.version}.sh
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(deployScriptString, 'Deployment Script')}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#D97706] text-[#0B0908] hover:bg-[#F59E0B] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isFa ? 'کپی اسکریپت انتشار' : 'Copy Deployment Script'}
                </button>
              </div>
              <pre className="p-4 bg-[#080605] border border-[#D97706]/40 text-xs font-mono-tabular text-[#E7D1A7] overflow-x-auto text-left">
                {deployScriptString}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
