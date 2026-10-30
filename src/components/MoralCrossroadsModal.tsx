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

        {/* Moral Binary Choice Grid: Path of Asha vs Path of Ahriman */}
        <div className="mt-6 pt-5 border-t border-[#D97706]/30">
          <div className="text-xs text-[#D97706] mb-3 flex items-center justify-between">
            <span>
              {isFa
                ? 'دوراهی سرنوشت شاهنامه — فرمان شهریاری خود را مهر کنید'
                : 'ROYAL DECREE AT THE MORAL CROSSROADS — CHOOSE YOUR ETERNAL PATH'}
            </span>
            <span className="font-mono-tabular">
              {isFa
                ? `ثبات: ${Math.round(iranshahrStability)}٪ · تراز: ${currentAlignment} · کلید [1] یا [2]`
                : `Press [1] or [2] to Seal Decree`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Path of Asha Button */}
            <button
              type="button"
              onClick={() => onSelectChoice(node.ashaOption)}
              data-testid="choice-asha-btn"
              className="group text-start p-5 bg-[#0F1E36]/90 hover:bg-[#172B4D] border border-[#F59E0B]/60 hover:border-[#FDE68A] transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-[#FDE68A] flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-[#FDE68A] font-mono-tabular">
                  <span>
                    {isFa ? 'راه اَشَه · روشنایی، داد و خرد' : 'PATH OF ASHA · LIGHT & JUSTICE'}
                  </span>
                  <span>[KEY 1]</span>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-[#F5E6C8] group-hover:text-[#FDE68A]">
                  {ashaTitle}
                </h3>
                <p className="mt-2 text-xs md:text-sm text-[#E7D1A7] leading-relaxed">{ashaDesc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F59E0B]/30 space-y-1 text-xs">
                <div className="font-semibold text-[#FDE68A]">
                  {isFa ? `موهبت رزمی: ${ashaBlessing}` : `Blessing: ${ashaBlessing}`}
                </div>
                <div className="text-[#E7D1A7]/90">{ashaEffect}</div>
                <div className="font-mono-tabular text-[#60A5FA] pt-1">
                  {isFa
                    ? `+${node.ashaOption.alignmentDelta} اَشَه · +${node.ashaOption.stabilityDelta}٪ ثبات ایران‌شهر · +${node.ashaOption.farrDelta} ظرف فره`
                    : node.ashaOption.consequenceSummary}
                </div>
              </div>
            </button>

            {/* Path of Ahriman Button */}
            <button
              type="button"
              onClick={() => onSelectChoice(node.ahrimanOption)}
              data-testid="choice-ahriman-btn"
              className="group text-start p-5 bg-[#280B0B]/90 hover:bg-[#3B1010] border border-[#DC2626]/60 hover:border-[#F87171] transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-[#F87171] flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-[#FCA5A5] font-mono-tabular">
                  <span>
                    {isFa
                      ? 'راه اهریمن · سلطه، آتش و خون'
                      : 'PATH OF AHRIMAN · DARKNESS & MIGHT'}
                  </span>
                  <span>[KEY 2]</span>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-[#F5E6C8] group-hover:text-[#FCA5A5]">
                  {ahrimanTitle}
                </h3>
                <p className="mt-2 text-xs md:text-sm text-[#E7D1A7] leading-relaxed">
                  {ahrimanDesc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#DC2626]/30 space-y-1 text-xs">
                <div className="font-semibold text-[#FCA5A5]">
                  {isFa ? `موهبت رزمی: ${ahrimanBlessing}` : `Blessing: ${ahrimanBlessing}`}
                </div>
                <div className="text-[#E7D1A7]/90">{ahrimanEffect}</div>
                <div className="font-mono-tabular text-[#F87171] pt-1">
                  {isFa
                    ? `${node.ahrimanOption.alignmentDelta} اهریمن · ${node.ahrimanOption.stabilityDelta}٪ ثبات · +${node.ahrimanOption.lifestealOnKill} جذب جان در هر کشتن`
                    : node.ahrimanOption.consequenceSummary}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
