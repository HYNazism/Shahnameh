import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas, LiveCombatTelemetry } from './components/GameCanvas';
import { ThreeGoreArena } from './components/ThreeGoreArena';
import { MoralCrossroadsModal } from './components/MoralCrossroadsModal';
import { SettingsModal } from './components/SettingsModal';
import { MobileTouchControls } from './components/MobileTouchControls';
import {
  TitleEmblemSvg,
  FarrVitalitySocketSvg,
  PortraitMiniatureSvg,
} from './components/PersianMiniatureArt';
import { STORY_DATABASE, MoralChoiceOption } from './data/storyDatabase';
import { SHAHNAMEH_BUILD_MANIFEST } from './data/versionManifest';
import {
  DEFAULT_GAME_SETTINGS,
  GameSettings,
  PERSIAN_STORY_CHAPTERS,
  UI_DICTIONARY,
} from './data/i18nAndSettings';
import {
  applyMoralChoice,
  createInitialRunState,
  PlayerRunState,
  resolveHistoricalEnding,
} from './game/rules';
import { soundEngine } from './game/soundEngine';
import {
  BookOpen,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  Zap,
  Link2,
  Skull,
  Swords,
} from 'lucide-react';

export type ShellState = 'title' | 'playing' | 'paused' | 'gameover';

function toFaDigits(val: number | string): string {
  return String(val).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export default function App() {
  const isAutoStart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const detectCompactOrTouchDevice = () =>
    typeof window !== 'undefined' &&
    ('ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth < 768);

  const [gameState, setGameState] = useState<ShellState>(isAutoStart ? 'playing' : 'title');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [runState, setRunState] = useState<PlayerRunState>(() =>
    createInitialRunState(SHAHNAMEH_BUILD_MANIFEST.activeVersion, 0)
  );
  const [victorious, setVictorious] = useState<boolean>(false);
  const [touchControlsEnabled, setTouchControlsEnabled] = useState<boolean>(
    detectCompactOrTouchDevice
  );
  const [isCrossroadsOpen, setIsCrossroadsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Sync audio volumes with settings
  useEffect(() => {
    soundEngine.setVolumes(
      settings.masterVolume,
      settings.sfxVolume,
      settings.musicChimeVolume
    );
  }, [settings.masterVolume, settings.sfxVolume, settings.musicChimeVolume]);

  // Automatically adapt touch controls & layout when device viewport resizes or rotates
  useEffect(() => {
    const handleViewportAdapt = () => {
      const isCompact = window.innerWidth < 768 || navigator.maxTouchPoints > 0;
      setTouchControlsEnabled(isCompact);
    };
    window.addEventListener('resize', handleViewportAdapt);
    return () => window.removeEventListener('resize', handleViewportAdapt);
  }, []);

  const [telemetry, setTelemetry] = useState<LiveCombatTelemetry>({
    hp: 100,
    maxHp: 100,
    trailingHp: 100,
    mythicEnergy: 60,
    waveProgress: 0,
    bossActive: false,
    bossName: '',
    bossHp: 0,
    bossMaxHp: 100,
    activeEnemyCount: 3,
    boundEnemiesCount: 0,
    braziersLit: 0,
    flintReady: true,
    isDuelBossFight: false,
    heroTitle: 'کیومرث پلنگینه‌پوش',
  });

  const handleSyncTelemetry = useCallback((next: LiveCombatTelemetry) => {
    setTelemetry((prev) => {
      if (
        prev.hp === next.hp &&
        prev.maxHp === next.maxHp &&
        prev.mythicEnergy === next.mythicEnergy &&
        prev.waveProgress === next.waveProgress &&
        prev.bossActive === next.bossActive &&
        prev.bossName === next.bossName &&
        prev.bossHp === next.bossHp &&
        prev.activeEnemyCount === next.activeEnemyCount &&
        prev.boundEnemiesCount === next.boundEnemiesCount &&
        prev.braziersLit === next.braziersLit &&
        prev.flintReady === next.flintReady &&
        prev.isDuelBossFight === next.isDuelBossFight &&
        prev.heroTitle === next.heroTitle
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const ui = UI_DICTIONARY[settings.language];
  const isFa = settings.language !== 'en';
  const isEvilFaction = runState.alignment < 0;

  const currentCrossroads =
    STORY_DATABASE[Math.min(runState.epochIndex, STORY_DATABASE.length - 1)] ||
    STORY_DATABASE[0];
  const currentChapterSpec =
    SHAHNAMEH_BUILD_MANIFEST.chapters[
      Math.min(runState.epochIndex, SHAHNAMEH_BUILD_MANIFEST.chapters.length - 1)
    ] || SHAHNAMEH_BUILD_MANIFEST.chapters[0];
  const faChapter =
    PERSIAN_STORY_CHAPTERS.fa[
      Math.min(runState.epochIndex, PERSIAN_STORY_CHAPTERS.fa.length - 1)
    ];

  // Reflect shell state and RTL/LTR direction on document
  useEffect(() => {
    document.body.dataset.state = gameState;
    document.documentElement.dir = ui.dir;
    document.documentElement.lang = isFa ? 'fa' : 'en';
  }, [gameState, ui.dir, isFa]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyC' && gameState === 'playing') {
        e.preventDefault();
        setIsCrossroadsOpen((prev) => !prev);
      } else if (e.code === 'Escape' && isCrossroadsOpen) {
        setIsCrossroadsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isCrossroadsOpen]);

  const handleSelectFactionAlignment = useCallback((path: 'asha' | 'ahriman') => {
    soundEngine.init();
    soundEngine.playMoralChoiceChime(path);
    setRunState((prev) => ({
      ...prev,
      alignment: path === 'ahriman' ? -45 : 45,
      iranshahrStability: path === 'ahriman' ? 35 : 80,
      attackMultiplier: path === 'ahriman' ? 1.28 : 1.12,
      sacredFireGuard: path === 'asha' ? 0.25 : 0.1,
    }));
  }, []);

  const handleStartChronicle = useCallback(
    (startEpochIdx = 0, chosenPath?: 'asha' | 'ahriman') => {
      const targetPath = chosenPath || (runState.alignment < 0 ? 'ahriman' : 'asha');
      soundEngine.init();
      soundEngine.playMoralChoiceChime(targetPath);
      setVictorious(false);
      const initial = createInitialRunState(runState.version, startEpochIdx);
      setRunState({
        ...initial,
        alignment: targetPath === 'ahriman' ? -45 : 45,
        iranshahrStability: targetPath === 'ahriman' ? 35 : 80,
        attackMultiplier: targetPath === 'ahriman' ? 1.28 : 1.12,
        sacredFireGuard: targetPath === 'asha' ? 0.25 : 0.1,
      });
      setGameState('playing');
    },
    [runState.version, runState.alignment]
  );

  const handleJumpToEpoch = useCallback((targetEpochIdx: number) => {
    const clamped = Math.max(0, Math.min(STORY_DATABASE.length - 1, targetEpochIdx));
    setRunState((prev) => ({
      ...prev,
      epochIndex: clamped,
      hp: prev.maxHp,
      braziersLit: 0,
    }));
  }, []);

  const handleSelectMoralChoice = useCallback(
    (choice: MoralChoiceOption) => {
      soundEngine.init();
      soundEngine.playMoralChoiceChime(choice.path);
      setRunState((prev) => {
        const next = applyMoralChoice(
          prev,
          currentCrossroads.id,
          currentCrossroads.epochLabel,
          choice
        );
        // Ensure alignment strictly reflects the chosen Good (asha) or Evil (ahriman) path
        return {
          ...next,
          alignment:
            choice.path === 'ahriman'
              ? Math.min(-35, next.alignment)
              : Math.max(35, next.alignment),
        };
      });
      setIsCrossroadsOpen(false);
      setGameState('playing');
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('shahnameh-enter-duel-boss-fight', {
            detail: { path: choice.path },
          })
        );
      }, 30);
    },
    [currentCrossroads]
  );

  const handleEpochWaveCleared = useCallback(() => {
    if (runState.epochIndex < runState.maxEpochs - 1) {
      const nextEpoch = runState.epochIndex + 1;
      setRunState((prev) => ({
        ...prev,
        epochIndex: nextEpoch,
        hp: Math.min(prev.maxHp, prev.hp + 30),
        braziersLit: 0,
      }));
      if (settings.autoOpenDecreeOnEpoch) {
        setIsCrossroadsOpen(true);
      }
    } else {
      setVictorious(true);
      setGameState('gameover');
    }
  }, [runState.epochIndex, runState.maxEpochs, settings.autoOpenDecreeOnEpoch]);

  const handlePlayerDefeated = useCallback(() => {
    setVictorious(false);
    setGameState('gameover');
  }, []);

  const handleQuickRestart = useCallback(() => {
    setVictorious(false);
    setIsCrossroadsOpen(false);
    setIsSettingsOpen(false);
    setRunState((prev) => {
      const reset = createInitialRunState(prev.version, prev.epochIndex);
      return {
        ...reset,
        alignment: prev.alignment,
      };
    });
    setGameState('playing');
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  const endingSummary = resolveHistoricalEnding(runState, victorious);
  const isModalOpen = isCrossroadsOpen || isSettingsOpen;

  // Compute discrete Farr vitality socket states
  const hpPerSocket = Math.max(1, runState.maxHp / runState.farrPips);
  const sockets: Array<'full' | 'cracked' | 'empty'> = Array.from(
    { length: runState.farrPips },
    (_, idx) => {
      const socketMin = idx * hpPerSocket;
      const socketMax = (idx + 1) * hpPerSocket;
      if (telemetry.hp >= socketMax - 2) return 'full';
      if (telemetry.hp > socketMin + 2) return 'cracked';
      return 'empty';
    }
  );

  return (
    <div
      dir={ui.dir}
      className="relative w-screen h-[100dvh] overflow-hidden bg-[#070504] select-none"
    >
      {/* Full-Viewport 3D Grimdark Arena */}
      {settings.renderDimension === '3d_gore' ? (
        <ThreeGoreArena
          gameState={gameState}
          isModalOpen={isModalOpen}
          runState={runState}
          settings={settings}
          onSyncRunState={setRunState}
          onSyncTelemetry={handleSyncTelemetry}
          onEpochWaveCleared={handleEpochWaveCleared}
          onPlayerDefeated={handlePlayerDefeated}
          onTriggerPause={() =>
            setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'))
          }
          onToggleMute={handleToggleMute}
          onOpenSettings={() => setIsSettingsOpen((prev) => !prev)}
          onQuickRestart={handleQuickRestart}
          onRequestGoodEvilCrossroads={() => setIsCrossroadsOpen(true)}
        />
      ) : (
        <GameCanvas
          gameState={gameState}
          isModalOpen={isModalOpen}
          runState={runState}
          settings={settings}
          onSyncRunState={setRunState}
          onSyncTelemetry={handleSyncTelemetry}
          onEpochWaveCleared={handleEpochWaveCleared}
          onPlayerDefeated={handlePlayerDefeated}
          onTriggerPause={() =>
            setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'))
          }
          onToggleMute={handleToggleMute}
          onOpenSettings={() => setIsSettingsOpen((prev) => !prev)}
          onQuickRestart={handleQuickRestart}
        />
      )}

      {/* Touch Virtual Gamepad (Auto-activated on Mobile/Tablet) */}
      {gameState === 'playing' && !isModalOpen && (
        <MobileTouchControls
          language={settings.language}
          visible={touchControlsEnabled}
        />
      )}

      {/* =====================================================================
          STATE 1: TITLE SCREEN OVERLAY (Dark-Epic Persian Aesthetics, Pure Game UI)
          ===================================================================== */}
      {gameState === 'title' && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-between p-2.5 sm:p-4 md:p-6 pointer-events-none">
          {/* Top Bar: Title Identity + Language Switch + Settings */}
          <div className="pointer-events-auto w-full max-w-5xl bg-[#0D0907]/94 border border-[#78350F] px-3.5 sm:px-5 py-2.5 shadow-[0_14px_40px_rgba(0,0,0,0.95)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <TitleEmblemSvg />
              </div>
              <h1 className="font-display text-base sm:text-xl md:text-2xl font-bold text-[#FDE68A] tracking-wide">
                {ui.gameTitle} — <span className="text-[#DC2626]">{ui.gameSubtitle}</span>
              </h1>
            </div>

            {/* Language Selector + Graphics/Audio Settings */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-[#140E0B] border border-[#78350F] p-0.5">
                {(['fa', 'fa_classical', 'en'] as const).map((langKey) => (
                  <button
                    key={langKey}
                    onClick={() => setSettings((s) => ({ ...s, language: langKey }))}
                    className={`px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                      settings.language === langKey
                        ? 'bg-[#B45309] text-[#090706]'
                        : 'text-[#C8B692] hover:text-[#FDE68A]'
                    }`}
                  >
                    {langKey === 'fa'
                      ? 'فارسی'
                      : langKey === 'fa_classical'
                      ? 'پارسی کهن'
                      : 'English'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#140E0B] hover:bg-[#78350F]/30 border border-[#78350F] text-xs font-bold text-[#FDE68A] cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{ui.settingsBtn}</span>
              </button>
            </div>
          </div>

          {/* Bottom Docked Command Deck: Choose Good vs. Evil Faction & Enter Battle */}
          <div className="pointer-events-auto w-full max-w-5xl bg-[#0D0907]/95 border border-[#92400E] px-4 sm:px-6 py-3.5 sm:py-4 shadow-[0_-16px_48px_rgba(0,0,0,0.96)] flex flex-col gap-3">
            {/* Row 1: Faction Choice (Good Asha vs. Evil Ahriman) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#78350F]/45">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#E7D8C1]">
                <Swords className="w-4 h-4 text-[#D97706]" />
                <span>
                  {isFa
                    ? isEvilFaction
                      ? 'جبهه انتخاب‌شده: راه شر (اهریمن) — دشمنان شما: سپاهیان و پهلوانان خیر ایران‌شهر'
                      : 'جبهه انتخاب‌شده: راه خیر (اشه) — دشمنان شما: سپاه دیوان و اهریمن'
                    : isEvilFaction
                    ? 'Selected Faction: Path of Evil (Ahriman) — Enemies: Forces & Heroes of Good'
                    : 'Selected Faction: Path of Good (Asha) — Enemies: Forces & Demons of Evil'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  data-testid="select-faction-asha"
                  onClick={() => handleSelectFactionAlignment('asha')}
                  className={`px-3 py-1.5 text-xs font-bold border cursor-pointer ${
                    !isEvilFaction
                      ? 'bg-[#1E3A8A] border-[#FDE68A] text-[#FDE68A] shadow-[0_0_16px_rgba(30,58,138,0.8)]'
                      : 'bg-[#140E0B] border-[#78350F]/60 text-[#A89882] hover:text-[#FDE68A]'
                  }`}
                >
                  {isFa ? '🛡️ جبهه خیر (فروغ اشه)' : '🛡️ Path of Good (Asha)'}
                </button>

                <button
                  data-testid="select-faction-ahriman"
                  onClick={() => handleSelectFactionAlignment('ahriman')}
                  className={`px-3 py-1.5 text-xs font-bold border cursor-pointer ${
                    isEvilFaction
                      ? 'bg-[#7F1D1D] border-[#FCA5A5] text-[#FEF2F2] shadow-[0_0_16px_rgba(185,28,28,0.85)]'
                      : 'bg-[#140E0B] border-[#78350F]/60 text-[#A89882] hover:text-[#FCA5A5]'
                  }`}
                >
                  {isFa ? '🔥 جبهه شر (خشم اهریمن)' : '🔥 Path of Evil (Ahriman)'}
                </button>
              </div>
            </div>

            {/* Row 2: Battle Launch & Story Scroll */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  data-start="true"
                  onClick={() => handleStartChronicle(0)}
                  className="px-4 py-2 bg-[#7F1D1D] hover:bg-[#991B1B] border border-[#F59E0B] text-[#FDE68A] font-bold text-xs sm:text-sm tracking-wide cursor-pointer"
                >
                  {ui.startChronicleBtn}
                </button>

                <button
                  data-start-hushang="true"
                  onClick={() => handleStartChronicle(6)}
                  className="px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#1D4ED8] border border-[#FDE68A]/80 text-[#F5E6C8] font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-[#FDE68A]" />
                  <span>{isFa ? 'نبرد رستم و مازندران' : 'Rostam & Mazandaran'}</span>
                </button>

                <button
                  data-start-finale="true"
                  onClick={() => handleStartChronicle(11)}
                  className="px-3.5 py-2 bg-[#3B0764] hover:bg-[#4C1D95] border border-[#FDE68A]/80 text-[#FDE68A] font-bold text-xs sm:text-sm cursor-pointer"
                >
                  <span>
                    {isFa ? 'عصر دوازدهم: پایان شاهنامه' : 'Epoch XII: Immortal Finale'}
                  </span>
                </button>
              </div>

              <button
                onClick={() => setIsCrossroadsOpen(true)}
                className="px-3.5 py-2 bg-[#18110D] hover:bg-[#78350F]/30 border border-[#B45309] text-[#FDE68A] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{ui.fullStoryReaderBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STATE 2: IN-GAME HUD OVERLAY (Clean, Grimdark, Auto-Responsive)
          ===================================================================== */}
      {gameState !== 'title' && (
        <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-1.5 sm:p-3 md:p-4">
          {/* TOP BAR */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-start justify-between gap-1.5 sm:gap-2 w-full">
            {/* TOP-START CLUSTER: Vitality + Active Faction Switcher + Combat Abilities */}
            <div className="pointer-events-auto bg-[#0D0907]/92 border border-[#78350F] px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-[0_8px_24px_rgba(0,0,0,0.9)] flex flex-col gap-1.5 w-full lg:w-auto lg:min-w-[300px] lg:max-w-[380px]">
              {/* Row 1: Discrete Farr Vitality Vessels + Stability */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#FDE68A]">
                    {ui.hudVitalityLabel}
                  </span>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {sockets.map((st, idx) => (
                      <FarrVitalitySocketSvg key={idx} state={st} />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] sm:text-[11px] text-[#6EE7B7] font-semibold">
                  {ui.hudStabilityLabel}:{' '}
                  {isFa
                    ? `${toFaDigits(Math.round(runState.iranshahrStability))}٪`
                    : `${Math.round(runState.iranshahrStability)}%`}
                </span>
              </div>

              {/* Row 2: Active Good/Evil Faction Switcher (Directly toggles Player & Enemy Factions) */}
              <div className="flex items-center justify-between gap-1.5 text-[10px] sm:text-[11px]">
                <div className="flex items-center gap-1">
                  <button
                    data-testid="hud-faction-asha"
                    onClick={() => handleSelectFactionAlignment('asha')}
                    className={`px-2 py-0.5 font-bold border cursor-pointer ${
                      !isEvilFaction
                        ? 'bg-[#1E3A8A] border-[#60A5FA] text-[#FDE68A]'
                        : 'bg-[#140E0B] border-[#78350F]/40 text-[#A89882]'
                    }`}
                  >
                    {isFa ? 'جبهه خیر (اشه)' : 'Good (Asha)'}
                  </button>
                  <button
                    data-testid="hud-faction-ahriman"
                    onClick={() => handleSelectFactionAlignment('ahriman')}
                    className={`px-2 py-0.5 font-bold border cursor-pointer ${
                      isEvilFaction
                        ? 'bg-[#7F1D1D] border-[#F87171] text-[#FEE2E2]'
                        : 'bg-[#140E0B] border-[#78350F]/40 text-[#A89882]'
                    }`}
                  >
                    {isFa ? 'جبهه شر (اهریمن)' : 'Evil (Ahriman)'}
                  </button>
                </div>

                <span className="text-[#D6C7B2] truncate">
                  {isFa
                    ? isEvilFaction
                      ? 'دشمن: سپاه خیر'
                      : 'دشمن: سپاه دیوان'
                    : isEvilFaction
                    ? 'Foe: Army of Light'
                    : 'Foe: Army of Divs'}
                </span>
              </div>

              {/* Row 3: Combat Tactical Strip (Visible on tablet/desktop) */}
              <div className="hidden sm:grid grid-cols-3 gap-1.5 pt-1 border-t border-[#78350F]/35 text-[10px]">
                <div
                  className={`px-2 py-0.5 border flex items-center justify-between ${
                    telemetry.flintReady
                      ? 'bg-[#78350F]/30 border-[#D97706] text-[#FDE68A]'
                      : 'bg-[#090706] border-[#78350F]/25 text-[#A89882]'
                  }`}
                >
                  <span className="flex items-center gap-1 truncate">
                    <Zap className="w-3 h-3 shrink-0" />
                    {ui.hudSadehFlintLabel}
                  </span>
                  <span className="font-bold">
                    {telemetry.flintReady ? (isFa ? 'آماده' : 'Ready') : '...'}
                  </span>
                </div>

                <div
                  className={`px-2 py-0.5 border flex items-center justify-between ${
                    telemetry.boundEnemiesCount > 0
                      ? 'bg-[#1E3A8A]/55 border-[#60A5FA] text-[#DBEAFE]'
                      : 'bg-[#090706] border-[#78350F]/25 text-[#A89882]'
                  }`}
                >
                  <span className="flex items-center gap-1 truncate">
                    <Link2 className="w-3 h-3 shrink-0" />
                    {ui.hudDivBandLabel}
                  </span>
                  <span className="font-bold">
                    {isFa
                      ? toFaDigits(telemetry.boundEnemiesCount)
                      : telemetry.boundEnemiesCount}
                  </span>
                </div>

                <div
                  className={`px-2 py-0.5 border flex items-center justify-between ${
                    telemetry.braziersLit > 0
                      ? 'bg-[#7F1D1D]/45 border-[#FDE68A] text-[#FDE68A]'
                      : 'bg-[#090706] border-[#78350F]/25 text-[#A89882]'
                  }`}
                >
                  <span className="truncate">{ui.hudBraziersLabel}</span>
                  <span className="font-bold">
                    {isFa
                      ? `${toFaDigits(telemetry.braziersLit)}/۴`
                      : `${telemetry.braziersLit}/4`}
                  </span>
                </div>
              </div>
            </div>

            {/* TOP-END CLUSTER: Current Epoch Banner, Core Game Actions & Epoch Switcher */}
            <div className="pointer-events-auto flex flex-col items-stretch lg:items-end gap-1 sm:gap-1.5 w-full lg:w-auto">
              <div className="bg-[#0D0907]/92 border border-[#78350F] px-2.5 sm:px-3.5 py-1 sm:py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.9)] flex flex-wrap items-center justify-between lg:justify-end gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-bold text-[#FDE68A] truncate">
                    {isFa ? faChapter.epochTitle : currentChapterSpec.title}
                  </div>
                  <div className="hidden sm:flex items-center gap-2.5 mt-0.5 text-[11px] text-[#D6C7B2]">
                    <span>
                      {ui.hudRenownLabel}:{' '}
                      <strong className="text-[#FDE68A]">
                        {isFa ? toFaDigits(runState.score) : runState.score}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      {isFa ? 'پیشروی نبرد:' : 'Wave:'}{' '}
                      <strong className="text-[#F5E6C8]">
                        {isFa
                          ? `${toFaDigits(telemetry.waveProgress)}٪`
                          : `${telemetry.waveProgress}%`}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Pure Game Action Triggers (Duel, Heavy Strike, Story Scroll, Pause) */}
                <div className="flex flex-wrap items-center gap-1 sm:border-s border-[#78350F]/40 sm:ps-2">
                  <button
                    data-testid="hud-duel-boss-btn"
                    onClick={() => {
                      soundEngine.init();
                      window.dispatchEvent(new CustomEvent('shahnameh-enter-duel-boss-fight'));
                    }}
                    className="px-2 py-1 bg-[#7C2D12] hover:bg-[#9A3412] border border-[#FDE68A] text-[#FDE68A] text-[10px] sm:text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isFa ? '⚔️ نبرد تن‌به‌تن' : '⚔️ 1v1 Duel'}</span>
                  </button>

                  <button
                    onClick={() => {
                      soundEngine.init();
                      window.dispatchEvent(new CustomEvent('shahnameh-trigger-gore-burst'));
                    }}
                    className="px-2 py-1 bg-[#7F1D1D] hover:bg-[#991B1B] border border-[#FCA5A5] text-[#FEF2F2] text-[10px] sm:text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Skull className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {isFa ? 'ضربه سنگین' : 'Cleave'}
                    </span>
                  </button>

                  <button
                    onClick={() => setIsCrossroadsOpen(true)}
                    className="px-2 py-1 bg-[#1E3A8A] hover:bg-[#1D4ED8] border border-[#F59E0B] text-[#FDE68A] text-[10px] sm:text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{ui.hudDecreeReadyBtn}</span>
                  </button>

                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    title={ui.settingsBtn}
                    className="p-1 sm:p-1.5 bg-[#140E0B] hover:bg-[#78350F]/30 border border-[#78350F] text-[#FDE68A] cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleToggleMute}
                    title={isFa ? 'صدا' : 'Audio'}
                    className="p-1 sm:p-1.5 bg-[#140E0B] hover:bg-[#78350F]/30 border border-[#78350F] text-[#D97706] cursor-pointer"
                  >
                    {isMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-[#A89882]" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() =>
                      setGameState((prev) => (prev === 'paused' ? 'playing' : 'paused'))
                    }
                    title={isFa ? 'توقف' : 'Pause'}
                    className="p-1 sm:p-1.5 bg-[#140E0B] hover:bg-[#78350F]/30 border border-[#78350F] text-[#D97706] cursor-pointer"
                  >
                    {gameState === 'paused' ? (
                      <Play className="w-3.5 h-3.5" />
                    ) : (
                      <Pause className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Epoch Jump Selector Strip (Epochs 1..12) */}
              <div className="bg-[#0D0907]/92 border border-[#78350F]/60 px-2 py-1 flex items-center gap-1 text-[10px] overflow-x-auto max-w-full">
                <span className="text-[#A89882] px-1 shrink-0">{ui.hudEpochSelectLabel}</span>
                {STORY_DATABASE.map((node, idx) => {
                  const faShortNames = [
                    'کیومرث',
                    'سیامک',
                    'هوشنگ',
                    'طهمورث',
                    'کاوه',
                    'فریدون',
                    'دیو سفید',
                    'سهراب',
                    'سیاوش',
                    'اسفندیار',
                    'شغاد',
                    'پایان شاهنامه',
                  ];
                  const enShortNames = [
                    'Keyumars',
                    'Siamak',
                    'Hushang',
                    'Tahmuras',
                    'Kaveh',
                    'Fereydun',
                    'Div-e Sepid',
                    'Sohrab',
                    'Siyavash',
                    'Esfandiyar',
                    'Shaghad',
                    'Finale',
                  ];
                  return (
                    <button
                      key={node.id}
                      onClick={() => handleJumpToEpoch(idx)}
                      className={`px-1.5 py-0.5 font-semibold cursor-pointer border shrink-0 ${
                        runState.epochIndex === idx
                          ? 'bg-[#B45309] text-[#090706] border-[#FDE68A]'
                          : 'bg-[#090706] text-[#D6C7B2] border-[#78350F]/40 hover:border-[#F59E0B]'
                      }`}
                    >
                      {isFa
                        ? `${toFaDigits(idx + 1)}. ${faShortNames[idx]}`
                        : `${idx + 1}. ${enShortNames[idx]}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BOTTOM DOCK: 1v1 TWO-PERSON GOOD VS. EVIL BOSS FIGHT BANNER */}
          <div
            className={`w-full flex flex-col items-center ${
              touchControlsEnabled ? 'mb-36 sm:mb-40' : ''
            }`}
          >
            {telemetry.bossActive && (
              <div
                data-testid="duel-boss-fight-banner"
                className="pointer-events-auto w-full max-w-2xl bg-[#0D0807]/95 border-2 border-[#991B1B] px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-[0_0_32px_rgba(0,0,0,0.95)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                  {/* Player Side */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 border text-[10px] font-bold ${
                        isEvilFaction
                          ? 'bg-[#7F1D1D] border-[#F87171] text-[#FEE2E2]'
                          : 'bg-[#1E3A8A] border-[#60A5FA] text-[#FDE68A]'
                      }`}
                    >
                      {isEvilFaction
                        ? isFa
                          ? 'جبهه شر (اهریمن)'
                          : 'EVIL (AHRIMAN)'
                        : isFa
                        ? 'جبهه خیر (اشه)'
                        : 'GOOD (ASHA)'}
                    </span>
                    <span className="font-bold text-[#FDE68A]">
                      {telemetry.heroTitle || (isFa ? 'پهلوان ایران‌شهر' : 'Champion of Iranshahr')}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 bg-[#7F1D1D] border border-[#D97706]/50 text-[#FEF2F2] text-[10px] font-bold tracking-wider">
                    {telemetry.isDuelBossFight
                      ? isFa
                        ? '⚔️ نبرد تن‌به‌تن (۱ در برابر ۱)'
                        : '⚔️ 1v1 BOSS DUEL'
                      : isFa
                      ? 'در برابر'
                      : 'VS'}
                  </span>

                  {/* Opposing Boss Side (Good Boss if Player is Evil; Evil Boss if Player is Good!) */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span
                      className={`px-1.5 py-0.5 border text-[10px] font-bold ${
                        isEvilFaction
                          ? 'bg-[#1E3A8A] border-[#FDE68A] text-[#FDE68A]'
                          : 'bg-[#450A0A] border-[#F87171] text-[#FCA5A5]'
                      }`}
                    >
                      {isEvilFaction
                        ? isFa
                          ? 'پهلوان خیر'
                          : 'HERO OF LIGHT'
                        : isFa
                        ? 'سردار شر'
                        : 'WARLORD OF DARK'}
                    </span>
                    <span className="font-bold text-[#FDE68A]">{telemetry.bossName}</span>
                    <span className="px-1.5 sm:px-2 py-0.5 bg-[#450A0A] border border-[#F87171] text-[#FEE2E2] text-[10px] font-bold">
                      {isFa
                        ? `${toFaDigits(Math.max(0, Math.round(telemetry.bossHp)))}/${toFaDigits(
                            Math.max(1, Math.round(telemetry.bossMaxHp))
                          )}`
                        : `${Math.max(0, Math.round(telemetry.bossHp))}/${Math.max(
                            1,
                            Math.round(telemetry.bossMaxHp)
                          )}`}
                    </span>
                  </div>
                </div>

                {/* Boss Health Bar */}
                <div className="mt-1 sm:mt-1.5 w-full h-1.5 sm:h-2 bg-[#070504] border border-[#78350F] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      isEvilFaction
                        ? 'bg-gradient-to-r from-[#1D4ED8] via-[#3B82F6] to-[#F59E0B]'
                        : 'bg-gradient-to-r from-[#7F1D1D] via-[#DC2626] to-[#D97706]'
                    }`}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, (telemetry.bossHp / Math.max(1, telemetry.bossMaxHp)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          STATE 3: PAUSE OVERLAY (Pure Game Options Only)
          ===================================================================== */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-4 pointer-events-auto">
          <div className="parchment-panel miniature-border max-w-md w-full p-6 text-center shadow-2xl">
            <h2 className="font-display text-2xl font-bold text-[#FDE68A]">
              {ui.pauseTitle}
            </h2>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={() => setGameState('playing')}
                className="w-full py-2.5 bg-[#1E3A8A] hover:bg-[#1D4ED8] border border-[#F59E0B] text-[#FDE68A] text-xs font-bold cursor-pointer"
              >
                {ui.resumeBtn}
              </button>
              <button
                onClick={() => {
                  setGameState('playing');
                  setIsCrossroadsOpen(true);
                }}
                className="w-full py-2.5 bg-[#120F0D] hover:bg-[#D97706]/20 border border-[#D97706]/60 text-[#FDE68A] text-xs font-bold cursor-pointer"
              >
                {ui.fullStoryReaderBtn}
              </button>
              <button
                onClick={() => {
                  setGameState('playing');
                  setIsSettingsOpen(true);
                }}
                className="w-full py-2.5 bg-[#120F0D] hover:bg-[#D97706]/20 border border-[#D97706]/60 text-[#D6C7B2] text-xs font-bold cursor-pointer"
              >
                {ui.settingsBtn}
              </button>
              <button
                onClick={handleQuickRestart}
                className="w-full py-2.5 bg-[#7F1D1D] hover:bg-[#991B1B] border border-[#F59E0B]/60 text-[#F5E6C8] text-xs font-bold cursor-pointer"
              >
                {ui.restartBtn}
              </button>
              <button
                onClick={() => setGameState('title')}
                className="w-full py-2 bg-[#090706] hover:bg-[#1C1917] border border-[#78350F] text-[#A89882] text-xs cursor-pointer"
              >
                {ui.returnTitleBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STATE 4: GAMEOVER / HISTORICAL-MYTHOLOGICAL ENDING RESOLUTION
          ===================================================================== */}
      {gameState === 'gameover' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-4 pointer-events-auto">
          <div className="parchment-panel miniature-border max-w-xl w-full p-7 text-center shadow-2xl">
            <div className="flex justify-center mb-3">
              <PortraitMiniatureSvg
                portraitId={
                  isEvilFaction
                    ? 'div_siah'
                    : runState.epochIndex >= 2
                    ? 'hushang'
                    : 'keyumars'
                }
                className="w-24 h-24"
              />
            </div>

            <h2 className="font-display text-2xl md:text-3xl font-bold text-[#FDE68A]">
              {isFa ? endingSummary.persianTitle : endingSummary.title}
            </h2>

            <p className="mt-4 text-sm text-[#F5E6C8] leading-relaxed bg-[#090706]/90 border border-[#78350F] p-4">
              {isFa ? endingSummary.persianEpilogue : endingSummary.epilogue}
            </p>

            <div className="mt-3 text-xs text-[#F59E0B]">
              {isFa ? endingSummary.persianVerdict : endingSummary.legacyVerdict}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleQuickRestart}
                className="px-6 py-2.5 bg-[#7F1D1D] hover:bg-[#991B1B] border border-[#F59E0B] text-[#FDE68A] text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{ui.restartBtn}</span>
              </button>
              <button
                onClick={() => setGameState('title')}
                className="px-4 py-2.5 bg-[#120F0D] border border-[#78350F] text-[#D6C7B2] text-xs cursor-pointer"
              >
                {ui.returnTitleBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SHAHNAMEH MORAL CROSSROADS & SETTINGS MODALS
          ===================================================================== */}
      {isCrossroadsOpen && (
        <MoralCrossroadsModal
          node={currentCrossroads}
          language={settings.language}
          currentAlignment={runState.alignment}
          iranshahrStability={runState.iranshahrStability}
          onSelectChoice={handleSelectMoralChoice}
          onJumpToEpoch={handleJumpToEpoch}
          onClose={() => setIsCrossroadsOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={setSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
