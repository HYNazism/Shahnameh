import React, { useEffect } from 'react';
import { StoryCrossroadsNode, MoralChoiceOption, STORY_DATABASE } from '../data/storyDatabase';
import {
  GameLanguage,
  PERSIAN_STORY_CHAPTERS,
  UI_DICTIONARY,
} from '../data/i18nAndSettings';
import { PortraitMiniatureSvg } from './PersianMiniatureArt';

interface MoralCrossroadsModalProps {
  node: StoryCrossroadsNode;
  language: GameLanguage;
  currentAlignment: number;
  iranshahrStability: number;
  onSelectChoice: (choice: MoralChoiceOption) => void;
  onJumpToEpoch: (epochIdx: number) => void;
  onClose: () => void;
}

export const MoralCrossroadsModal: React.FC<MoralCrossroadsModalProps> = ({
  node,
  language,
  currentAlignment,
  iranshahrStability,
  onSelectChoice,
  onJumpToEpoch,
  onClose,
}) => {
  const ui = UI_DICTIONARY[language];
  const isFa = language !== 'en';
  const faChapter =
    PERSIAN_STORY_CHAPTERS.fa[
      Math.min(node.epochIndex, PERSIAN_STORY_CHAPTERS.fa.length - 1)
    ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') {
        e.preventDefault();
        onSelectChoice(node.ashaOption);
      } else if (e.key === '2') {
        e.preventDefault();
        onSelectChoice(node.ahrimanOption);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [node, onSelectChoice]);

  const title = isFa ? faChapter.epochTitle : node.title;
  const location = isFa ? faChapter.location : node.location;
  const proseParagraphs = isFa ? faChapter.fullShahnamehChronicle : node.narrativeProse;

  const ashaTitle = isFa ? faChapter.ashaChoiceTitle : node.ashaOption.title;
  const ashaDesc = isFa ? faChapter.ashaChoiceDesc : node.ashaOption.description;
  const ashaBlessing = isFa ? faChapter.ashaBlessingName : node.ashaOption.combatBlessingName;
  const ashaEffect = isFa ? faChapter.ashaBlessingEffect : node.ashaOption.combatBlessingEffect;

  const ahrimanTitle = isFa ? faChapter.ahrimanChoiceTitle : node.ahrimanOption.title;
  const ahrimanDesc = isFa ? faChapter.ahrimanChoiceDesc : node.ahrimanOption.description;
  const ahrimanBlessing = isFa
    ? faChapter.ahrimanBlessingName
    : node.ahrimanOption.combatBlessingName;
  const ahrimanEffect = isFa
    ? faChapter.ahrimanBlessingEffect
    : node.ahrimanOption.combatBlessingEffect;

  return (
    <div
      dir={ui.dir}
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#070504]/88 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crossroads-title"
    >
      <div className="parchment-panel miniature-border w-full max-w-4xl p-6 md:p-8 text-[#F5E6C8] max-h-[92vh] overflow-y-auto">
        {/* Top Metadata & Epoch Selector Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#D97706] pb-3 border-b border-[#D97706]/30">
          <div className="flex items-center gap-2">
            <span>{isFa ? faChapter.rulerName : node.epochLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{location}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#E7D1A7]">{ui.hudEpochSelectLabel}</span>
            {STORY_DATABASE.map((ch, idx) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => onJumpToEpoch(idx)}
                className={`px-2 py-0.5 text-[11px] font-mono-tabular border cursor-pointer ${
                  node.epochIndex === idx
                    ? 'bg-[#D97706] text-[#0B0908] border-[#FDE68A] font-bold'
                    : 'bg-[#1C1612] text-[#E7D1A7] border-[#D97706]/40 hover:border-[#D97706]'
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-0.5 text-[11px] bg-[#292524] hover:bg-[#44403C] text-[#FDE68A] border border-[#D97706]/50 cursor-pointer"
            >
              {isFa ? 'بستن طومار [C]' : 'Close [C]'}
            </button>
          </div>
        </div>

        {/* Header & Illuminated Portrait */}
        <div className="mt-5 flex flex-col md:flex-row items-start gap-6">
          <PortraitMiniatureSvg portraitId={node.portraitId} className="w-28 h-28 md:w-32 md:h-32" />

          <div className="flex-1 min-w-0">
            <h2
              id="crossroads-title"
              className="font-display text-2xl md:text-3xl font-bold text-[#FDE68A] tracking-wide"
            >
              {title}
            </h2>

            {/* Ferdowsi Couplet Block */}
            <div className="mt-3 py-2.5 px-4 bg-[#0B0908]/85 border border-[#D97706]/40">
              <p className="font-Persian text-base md:text-lg text-[#FDE68A] font-semibold">
                «{faChapter.ferdowsiVerse[0]}»
              </p>
              <p className="mt-1 font-Persian text-base md:text-lg text-[#F59E0B]">
                «{faChapter.ferdowsiVerse[1]}»
              </p>
              {!isFa && (
                <p className="mt-1.5 text-xs italic text-[#E7D1A7]/85">
                  “{node.ferdowsiCouplet.english[0]} / {node.ferdowsiCouplet.english[1]}”
                </p>
              )}
            </div>

            {/* Full Shahnameh Narrative Prose */}
            <div className="mt-3 space-y-2.5 text-sm md:text-[15px] leading-relaxed text-[#E7D1A7]">
              {proseParagraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Moral Binary Choice Grid: Path of Asha vs Path of Ahriman -> Launches 1v1 Boss Fight */}
        <div className="mt-6 pt-5 border-t border-[#D97706]/30">
          <div className="text-xs text-[#FDE68A] mb-3 flex flex-wrap items-center justify-between gap-2 bg-[#1A110B] border border-[#D97706]/50 px-3.5 py-2">
            <span className="font-bold">
              {isFa
                ? '⚔️ دوراهی خیر و شر — با انتخاب هر راه، مستقیماً وارد «باس‌فایت دو نفره (1v1)» آخر این مرحله می‌شوید!'
                : '⚔️ GOOD VS. EVIL CROSSROADS — Selecting a path launches the 1v1 Two-Person Boss Duel!'}
            </span>
            <span className="font-mono-tabular text-[#F59E0B]">
              {isFa
                ? `ثبات: ${Math.round(iranshahrStability)}٪ · تراز: ${currentAlignment} · کلید [1] خیر یا [2] شر`
                : `Press [1] Good (Asha) or [2] Evil (Ahriman)`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Path of Asha (Good) Button */}
            <button
              type="button"
              onClick={() => onSelectChoice(node.ashaOption)}
              data-testid="choice-asha-btn"
              className="group text-start p-5 bg-[#0F1E36]/95 hover:bg-[#172B4D] border-2 border-[#F59E0B]/75 hover:border-[#FDE68A] transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-[#FDE68A] flex flex-col justify-between cursor-pointer shadow-[0_0_24px_rgba(30,58,138,0.5)]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-[#FDE68A] font-mono-tabular">
                  <span className="font-bold">
                    {isFa ? '✨ جبهه خیر · راه اَشَه (روشنایی و داد)' : '✨ PATH OF GOOD · ASHA (LIGHT & JUSTICE)'}
                  </span>
                  <span className="px-2 py-0.5 bg-[#D97706] text-[#0B0908] font-bold">[KEY 1]</span>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-[#F5E6C8] group-hover:text-[#FDE68A]">
                  {ashaTitle}
                </h3>
                <p className="mt-2 text-xs md:text-sm text-[#E7D1A7] leading-relaxed">{ashaDesc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F59E0B]/30 space-y-1.5 text-xs">
                <div className="font-semibold text-[#FDE68A]">
                  {isFa ? `موهبت رزمی: ${ashaBlessing}` : `Blessing: ${ashaBlessing}`}
                </div>
                <div className="text-[#E7D1A7]/90">{ashaEffect}</div>
                <div className="font-mono-tabular text-[#60A5FA] pt-0.5">
                  {isFa
                    ? `+${node.ashaOption.alignmentDelta} خیر (اَشَه) · +${node.ashaOption.stabilityDelta}٪ ثبات ایران‌شهر · +${node.ashaOption.farrDelta} ظرف فره`
                    : node.ashaOption.consequenceSummary}
                </div>
                <div className="mt-2 py-1.5 px-3 bg-[#1E3A8A] border border-[#FDE68A] text-[#FDE68A] font-bold text-center">
                  {isFa
                    ? '⚔️ انتخاب راه خیر و ورود به باس‌فایت دو نفره [1]'
                    : '⚔️ Choose Good & Enter 1v1 Boss Fight [1]'}
                </div>
              </div>
            </button>

            {/* Path of Ahriman (Evil) Button */}
            <button
              type="button"
              onClick={() => onSelectChoice(node.ahrimanOption)}
              data-testid="choice-ahriman-btn"
              className="group text-start p-5 bg-[#280B0B]/95 hover:bg-[#3B1010] border-2 border-[#DC2626]/75 hover:border-[#F87171] transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-[#F87171] flex flex-col justify-between cursor-pointer shadow-[0_0_24px_rgba(220,38,38,0.45)]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-[#FCA5A5] font-mono-tabular">
                  <span className="font-bold">
                    {isFa
                      ? '🔥 جبهه شر · راه اهریمن (سلطه، آتش و خون)'
                      : '🔥 PATH OF EVIL · AHRIMAN (DARKNESS & MIGHT)'}
                  </span>
                  <span className="px-2 py-0.5 bg-[#DC2626] text-[#FEF2F2] font-bold">[KEY 2]</span>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-[#F5E6C8] group-hover:text-[#FCA5A5]">
                  {ahrimanTitle}
                </h3>
                <p className="mt-2 text-xs md:text-sm text-[#E7D1A7] leading-relaxed">
                  {ahrimanDesc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#DC2626]/30 space-y-1.5 text-xs">
                <div className="font-semibold text-[#FCA5A5]">
                  {isFa ? `موهبت رزمی: ${ahrimanBlessing}` : `Blessing: ${ahrimanBlessing}`}
                </div>
                <div className="text-[#E7D1A7]/90">{ahrimanEffect}</div>
                <div className="font-mono-tabular text-[#F87171] pt-0.5">
                  {isFa
                    ? `${node.ahrimanOption.alignmentDelta} شر (اهریمن) · ${node.ahrimanOption.stabilityDelta}٪ ثبات · +${node.ahrimanOption.lifestealOnKill} جذب جان`
                    : node.ahrimanOption.consequenceSummary}
                </div>
                <div className="mt-2 py-1.5 px-3 bg-[#991B1B] border border-[#FECACA] text-[#FEF2F2] font-bold text-center">
                  {isFa
                    ? '🔥 انتخاب راه شر و ورود به باس‌فایت دو نفره [2]'
                    : '🔥 Choose Evil & Enter 1v1 Boss Fight [2]'}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
