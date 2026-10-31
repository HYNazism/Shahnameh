import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas, LiveCombatTelemetry } from './components/GameCanvas';
import { ThreeGoreArena } from './components/ThreeGoreArena';
import { MoralCrossroadsModal } from './components/MoralCrossroadsModal';
import { VersionManifestModal } from './components/VersionManifestModal';
import { SettingsModal } from './components/SettingsModal';
import { ReleaseExportModal } from './components/ReleaseExportModal';
import { MusicStudioModal } from './components/MusicStudioModal';
import { PWAInstallButton } from './components/PWAInstallButton';
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
  calculateAlignmentStance,
  createInitialRunState,
  migrateSaveStateToVersion,
  PlayerRunState,
  resolveHistoricalEnding,
} from './game/rules';
import { soundEngine } from './game/soundEngine';
import {
  BookOpen,
  Flame,
  Shield,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Terminal,
  Settings,
  Zap,
  Link2,
  Download,
  Gamepad2,
  Music,
  Box,
  Skull,
} from 'lucide-react';

export type ShellState = 'title' | 'playing' | 'paused' | 'gameover';

export default function App() {
  const isAutoStart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const [gameState, setGameState] = useState<ShellState>(isAutoStart ? 'playing' : 'title');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [runState, setRunState] = useState<PlayerRunState>(() =>
    createInitialRunState(SHAHNAMEH_BUILD_MANIFEST.activeVersion, 0)
  );
  const [victorious, setVictorious] = useState<boolean>(false);
  const [touchControlsEnabled, setTouchControlsEnabled] = useState<boolean>(isTouchDevice);

  // Modals
  const [isCrossroadsOpen, setIsCrossroadsOpen] = useState<boolean>(false);
  const [isManifestOpen, setIsManifestOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isMusicOpen, setIsMusicOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

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
    heroTitle: 'کیومرث (پلنگینه‌پوش)',
  });

  const handleSyncTelemetry = useCallback((next: LiveCombatTelemetry) => {
    setTelemetry((prev) => {
      if (
        prev.hp === next.hp &&
        prev.maxHp === next.maxHp &&
        prev.mythicEnergy === next.mythicEnergy &&
        prev.waveProgress === next.waveProgress &&
        prev.bossActive === next.bossActive &&
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
  const stance = calculateAlignmentStance(runState.alignment);
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

  // Sync audio volumes with settings
  useEffect(() => {
    soundEngine.setVolumes(
      settings.masterVolume,
      settings.sfxVolume,
      settings.musicChimeVolume
    );
  }, [settings.masterVolume, settings.sfxVolume, settings.musicChimeVolume]);

  // Reflect shell state and RTL/LTR direction on document
  useEffect(() => {
    document.body.dataset.state = gameState;
    document.documentElement.dir = ui.dir;
    document.documentElement.lang = isFa ? 'fa' : 'en';
  }, [gameState, ui.dir, isFa]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'KeyC' &&
        gameState === 'playing' &&
        !isSettingsOpen &&
        !isManifestOpen &&
        !isExportOpen &&
        !isMusicOpen
      ) {
        e.preventDefault();
        setIsCrossroadsOpen((prev) => !prev);
      } else if (
        e.code === 'KeyX' &&
        !isSettingsOpen &&
        !isManifestOpen &&
        !isCrossroadsOpen &&
        !isMusicOpen
      ) {
        e.preventDefault();
        setIsExportOpen((prev) => !prev);
      } else if (e.code === 'Escape') {
        if (isMusicOpen) {
          setIsMusicOpen(false);
        } else if (isExportOpen) {
          setIsExportOpen(false);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isCrossroadsOpen) {
          setIsCrossroadsOpen(false);
        } else if (isManifestOpen) {
          setIsManifestOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isCrossroadsOpen, isManifestOpen, isSettingsOpen, isExportOpen, isMusicOpen]);

  const handleStartChronicle = useCallback(
    (startEpochIdx = 0) => {
      soundEngine.playMoralChoiceChime('asha');
      if (!soundEngine.isMusicPlaying()) {
        soundEngine.startSymphonicSoundtrack('chahargah_war');
      }
      setVictorious(false);
      setRunState(createInitialRunState(runState.version, startEpochIdx));
      setGameState('playing');
    },
    [runState.version]
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
      if (choice.path === 'ahriman') {
        soundEngine.setSymphonicMode('ahriman_doom');
      } else {
        soundEngine.setSymphonicMode('chahargah_war');
      }
      setRunState((prev) =>
        applyMoralChoice(
          prev,
          currentCrossroads.id,
          currentCrossroads.epochLabel,
          choice
        )
      );
      setIsCrossroadsOpen(false);
      setGameState('playing');
      // Transition directly from the Moral Crossroads screen into the 1v1 Good vs. Evil Boss Duel!
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
    setIsManifestOpen(false);
    setIsSettingsOpen(false);
    setIsExportOpen(false);
    setIsMusicOpen(false);
    setRunState((prev) => createInitialRunState(prev.version, prev.epochIndex));
    setGameState('playing');
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleApplyVersionUpdate = useCallback((targetVersion: string) => {
    setRunState((prev) => {
      const { migrated } = migrateSaveStateToVersion(prev, targetVersion);
      return migrated;
    });
  }, []);

  const endingSummary = resolveHistoricalEnding(runState, victorious);
  const isModalOpen =
    isCrossroadsOpen ||
    isManifestOpen ||
    isSettingsOpen ||
    isExportOpen ||
    isMusicOpen;

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

  const stanceLabel =
    stance === 'RADIANT_ASHA'
      ? ui.stanceAsha
      : stance === 'ABYSSAL_AHRIMAN'
      ? ui.stanceAhriman
      : ui.stanceBalance;

  return (
    <div
      dir={ui.dir}
      className="relative w-screen h-screen overflow-hidden bg-[#0E0D0B] select-none"
    >
      {/* Full-Viewport 3D Three.js Extreme Gore Arena OR 2D Persian Miniature Canvas */}
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

      {/* Android APK & Touch Virtual Gamepad */}
      {gameState === 'playing' && !isModalOpen && (
        <MobileTouchControls
          language={settings.language}
          visible={touchControlsEnabled}
        />
      )}

      {/* =====================================================================
          STATE 1: TITLE SCREEN OVERLAY (Open-Center Live 3D Gore Showcase + Bottom Command Dock)
          ===================================================================== */}
      {gameState === 'title' && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-between p-3 md:p-5 pointer-events-none">
          {/* Top Bar: Title Identity + Language + Symphonic Music + Settings */}
          <div className="pointer-events-auto w-full max-w-6xl bg-[#120C0A]/92 border-2 border-[#DC2626]/80 px-4 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.9)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <TitleEmblemSvg />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#DC2626] text-[#FEF2F2] text-[10px] font-mono font-bold uppercase tracking-wider">
                    COMPLETE 12-EPOCH EDITION · v5.0
                  </span>
                  <span className="font-mono text-[11px] text-[#FDE68A]">
                    FROM KEYUMARS TO ROSTAM, ESFANDIYAR, SHAGHAD & FERDOWSI’S FINALE
                  </span>
                </div>
                <h1 className="font-display text-lg md:text-2xl font-bold text-[#FDE68A] tracking-wide mt-0.5">
                  {ui.gameTitle} — <span className="text-[#F87171]">{ui.gameSubtitle}</span>
                </h1>
              </div>
            </div>

            {/* Right Controls: Language + Music Studio + PWA/EXE/APK + Settings */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-[#181310] border border-[#D97706]/50 p-0.5">
                {(['fa', 'fa_classical', 'en'] as const).map((langKey) => (
                  <button
                    key={langKey}
                    onClick={() => setSettings((s) => ({ ...s, language: langKey }))}
                    className={`px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                      settings.language === langKey
                        ? 'bg-[#D97706] text-[#0B0908]'
                        : 'text-[#C8B692] hover:text-[#FDE68A]'
                    }`}
                  >
                    {langKey === 'fa'
                      ? 'فارسی سلیس'
                      : langKey === 'fa_classical'
                      ? 'پارسی کهن'
                      : 'EN'}
                  </button>
                ))}
              </div>

              <button
                data-open-music="true"
                onClick={() => {
                  soundEngine.init();
                  soundEngine.startSymphonicSoundtrack('chahargah_epic');
                  setIsMusicOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#991B1B] hover:bg-[#B91C1C] border border-[#FDE68A] text-xs font-bold text-[#FDE68A] cursor-pointer"
              >
                <Music className="w-3.5 h-3.5" />
                <span>{isFa ? '🎵 موسیقی سمفونیک و Lyria 3' : '🎵 Symphonic & Lyria 3'}</span>
              </button>

              <PWAInstallButton
                language={settings.language}
                onFallbackOpenExportModal={() => setIsExportOpen(true)}
              />

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181310] border border-[#D97706]/50 text-xs text-[#FDE68A] hover:bg-[#D97706]/20 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{ui.settingsBtn}</span>
              </button>
            </div>
          </div>

          {/* Bottom Docked Command Deck (Leaves Center 75% Completely Unobstructed for 3D Gore Combat) */}
          <div className="pointer-events-auto w-full max-w-6xl bg-[#120C0A]/94 border-2 border-[#D97706] px-5 py-4 shadow-[0_-12px_48px_rgba(0,0,0,0.95)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Primary 3D Combat & Gore Triggers */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  data-start="true"
                  onClick={() => handleStartChronicle(0)}
                  className="px-4 py-2.5 bg-[#991B1B] hover:bg-[#B91C1C] border-2 border-[#F59E0B] text-[#FDE68A] font-bold text-xs md:text-sm tracking-wide shadow-[0_0_20px_rgba(220,38,38,0.65)] cursor-pointer"
                >
                  {ui.startChronicleBtn}
                </button>

                <button
                  data-start-hushang="true"
                  onClick={() => handleStartChronicle(9)}
                  className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1D4ED8] border-2 border-[#FDE68A] text-[#F5E6C8] font-bold text-xs md:text-sm tracking-wide shadow-[0_0_20px_rgba(30,58,138,0.65)] flex items-center gap-1.5 cursor-pointer"
                >
                  <Flame className="w-4 h-4 text-[#FDE68A]" />
                  <span>{ui.jumpToHushangBtn}</span>
                </button>

                <button
                  data-start-finale="true"
                  onClick={() => handleStartChronicle(11)}
                  className="px-3.5 py-2.5 bg-[#4C1D95] hover:bg-[#5B21B6] border-2 border-[#FDE68A] text-[#FDE68A] font-bold text-xs md:text-sm tracking-wide flex items-center gap-1.5 cursor-pointer"
                >
                  <span>
                    {isFa
                      ? '🏛️ عصر ۱۲: پایان شاهنامه و کاخ نظم فردوسی (v5.0)'
                      : '🏛️ Epoch XII: Ferdowsi’s Immortal Finale'}
                  </span>
                </button>

                <button
                  data-gore-burst="true"
                  onClick={() => {
                    soundEngine.init();
                    soundEngine.startSymphonicSoundtrack('chahargah_epic');
                    window.dispatchEvent(new CustomEvent('shahnameh-trigger-gore-burst'));
                  }}
                  className="px-3.5 py-2.5 bg-[#DC2626] hover:bg-[#EF4444] border-2 border-[#FECACA] text-[#FEF2F2] font-bold text-xs md:text-sm flex items-center gap-1.5 shadow-[0_0_24px_rgba(220,38,38,0.85)] cursor-pointer"
                >
                  <Skull className="w-4 h-4" />
                  <span>
                    {isFa
                      ? '🩸 ضربه گرز و پاشش خون [F]'
                      : '🩸 Cleave & Arterial Spray [F]'}
                  </span>
                </button>
              </div>

              {/* Secondary Tools: Music, Story Scroll, EXE/APK Release, Version Manifest */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsCrossroadsOpen(true)}
                  className="px-3 py-2 bg-[#1A120E] hover:bg-[#D97706]/20 border border-[#D97706]/60 text-[#FDE68A] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{ui.fullStoryReaderBtn}</span>
                </button>

                <button
                  data-open-release-center="true"
                  onClick={() => setIsExportOpen(true)}
                  className="px-3 py-2 bg-[#065F46] hover:bg-[#047857] border border-[#FDE68A]/75 text-[#FDE68A] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {isFa ? 'خروجی EXE / APK [X]' : 'Export EXE / APK [X]'}
                  </span>
                </button>

                <button
                  onClick={() => setIsManifestOpen(true)}
                  className="px-2.5 py-2 bg-[#1A120E] hover:bg-[#D97706]/20 border border-[#D97706]/60 text-[#C8B692] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>v{runState.version}</span>
                </button>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-[#D97706]/25 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#D6C7B2]">
              <span>{ui.controlHintLine}</span>
              <span className="text-[#FCA5A5] font-bold">
                GORE: {Math.round(settings.goreIntensityMultiplier * 100)}% · MODE:{' '}
                {settings.renderDimension === '3d_gore' ? '3D THREE.JS GORE' : '2D MINIATURE'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STATE 2: IN-GAME HUD OVERLAY (<= 12% Footprint, Pointer-Events-None)
          ===================================================================== */}
      {gameState !== 'title' && (
        <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 md:p-4">
          {/* TOP BAR */}
          <div className="flex items-start justify-between gap-3 w-full">
            {/* TOP-START CLUSTER: Royal Farr Vitality + Alignment + v1.1 Div-Warfare Strip */}
            <div className="pointer-events-auto bg-[#14100D]/90 border border-[#D97706]/65 px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.8)] flex flex-col gap-2 min-w-[295px] max-w-[390px]">
              {/* Row 1: Discrete Farr Vitality Vessels */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#FDE68A]">
                  {ui.hudVitalityLabel}
                </span>
                <div className="flex items-center gap-1">
                  {sockets.map((st, idx) => (
                    <FarrVitalitySocketSvg key={idx} state={st} />
                  ))}
                </div>
              </div>

              {/* Row 2: Asha vs Ahriman Alignment & Iranshahr Stability */}
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#93C5FD] flex items-center gap-1 font-semibold">
                  <Shield className="w-3 h-3" /> {stanceLabel} (
                  {runState.alignment > 0
                    ? `+${runState.alignment}`
                    : runState.alignment}
                  )
                </span>
                <span className="text-[#6EE7B7] font-semibold">
                  {ui.hudStabilityLabel}: {Math.round(runState.iranshahrStability)}%
                </span>
              </div>

              {/* Row 3: v1.1 Era of Hushang Div-Warfare Tactical Strip */}
              <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-[#D97706]/25 text-[10px] font-mono">
                <div
                  className={`px-2 py-1 border flex items-center justify-between ${
                    telemetry.flintReady
                      ? 'bg-[#D97706]/25 border-[#F59E0B] text-[#FDE68A]'
                      : 'bg-[#0B0908] border-[#D97706]/25 text-[#A89882]'
                  }`}
                >
                  <span className="flex items-center gap-1 truncate">
                    <Zap className="w-3 h-3 shrink-0" />
                    {ui.hudSadehFlintLabel}
                  </span>
                  <span className="font-bold">{telemetry.flintReady ? 'آماده' : '...'}</span>
                </div>

                <div
                  className={`px-2 py-1 border flex items-center justify-between ${
                    telemetry.boundEnemiesCount > 0
                      ? 'bg-[#1E3A8A]/55 border-[#60A5FA] text-[#DBEAFE]'
                      : 'bg-[#0B0908] border-[#D97706]/25 text-[#A89882]'
                  }`}
                >
                  <span className="flex items-center gap-1 truncate">
                    <Link2 className="w-3 h-3 shrink-0" />
                    {ui.hudDivBandLabel}
                  </span>
                  <span className="font-bold">{telemetry.boundEnemiesCount}</span>
                </div>

                <div
                  className={`px-2 py-1 border flex items-center justify-between ${
                    telemetry.braziersLit > 0
                      ? 'bg-[#991B1B]/45 border-[#FDE68A] text-[#FDE68A]'
                      : 'bg-[#0B0908] border-[#D97706]/25 text-[#A89882]'
                  }`}
                >
                  <span className="truncate">{ui.hudBraziersLabel}</span>
                  <span className="font-bold">{telemetry.braziersLit}/4</span>
                </div>
              </div>
            </div>

            {/* TOP-END CLUSTER: Current Epoch Banner, 3D/2D Switch, Music Studio & Epoch Switcher */}
            <div className="pointer-events-auto flex flex-col items-end gap-1.5">
              <div className="bg-[#14100D]/90 border border-[#D97706]/65 px-3.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.8)] flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#F59E0B]">
                      {currentChapterSpec.epochNumber} · v{runState.version}
                    </span>
                    <span className="text-[#D97706]/40">|</span>
                    <span className="text-xs font-bold text-[#FDE68A]">
                      {isFa ? faChapter.epochTitle : currentChapterSpec.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] font-mono text-[#D6C7B2]">
                    <span>
                      {ui.hudRenownLabel}:{' '}
                      <strong className="text-[#FDE68A]">{runState.score}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      موج نبرد:{' '}
                      <strong className="text-[#F5E6C8]">{telemetry.waveProgress}%</strong>
                    </span>
                  </div>
                </div>

                {/* Action Triggers */}
                <div className="flex items-center gap-1.5 border-s border-[#D97706]/30 ps-2.5">
                  <button
                    data-testid="hud-duel-boss-btn"
                    onClick={() => {
                      soundEngine.init();
                      window.dispatchEvent(new CustomEvent('shahnameh-enter-duel-boss-fight'));
                    }}
                    title={isFa ? 'ورود فوری به باس‌فایت دو نفره خیر و شر (1v1 Duel)' : 'Enter 1v1 Good vs. Evil Boss Duel'}
                    className="px-2 py-1.5 bg-[#7C2D12] hover:bg-[#9A3412] border border-[#FDE68A] text-[#FDE68A] text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isFa ? '⚔️ باس‌فایت ۲ نفره' : '⚔️ 1v1 DUEL'}</span>
                  </button>

                  <button
                    onClick={() => {
                      soundEngine.init();
                      window.dispatchEvent(new CustomEvent('shahnameh-trigger-gore-burst'));
                    }}
                    title={isFa ? 'اجرای فوری قطع عضو و فوران خون [F]' : 'Instant Gore & Dismemberment [F]'}
                    className="px-2 py-1.5 bg-[#DC2626] hover:bg-[#EF4444] border border-[#FECACA] text-[#FEF2F2] text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Skull className="w-3.5 h-3.5" />
                    <span>{isFa ? 'قطع عضو [F]' : 'GORE [F]'}</span>
                  </button>

                  <button
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        renderDimension:
                          s.renderDimension === '3d_gore' ? '2d_miniature' : '3d_gore',
                      }))
                    }
                    title={isFa ? 'تغییر حالت 3D Gore / 2D Miniature' : 'Toggle 3D Gore / 2D Mode'}
                    className="px-2 py-1.5 bg-[#1E3A8A] hover:bg-[#1D4ED8] border border-[#60A5FA] text-[#FDE68A] text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>{settings.renderDimension === '3d_gore' ? '3D GORE' : '2D MINI'}</span>
                  </button>

                  <button
                    onClick={() => setIsCrossroadsOpen(true)}
                    className="px-2.5 py-1.5 bg-[#991B1B] hover:bg-[#B91C1C] border border-[#F59E0B] text-[#FDE68A] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{ui.hudDecreeReadyBtn}</span>
                  </button>

                  <button
                    data-open-music="true"
                    onClick={() => setIsMusicOpen(true)}
                    title={isFa ? 'تالار موسیقی سمفونیک و Lyria 3' : 'Symphonic & Lyria 3 Music'}
                    className="p-1.5 bg-[#7F1D1D] hover:bg-[#991B1B] border border-[#FDE68A]/80 text-[#FDE68A] cursor-pointer"
                  >
                    <Music className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsExportOpen(true)}
                    title={
                      isFa
                        ? 'خروجی EXE / APK و انتشار گیت‌هاب [X]'
                        : 'Export EXE / APK & GitHub [X]'
                    }
                    className="p-1.5 bg-[#065F46] hover:bg-[#047857] border border-[#FDE68A]/70 text-[#FDE68A] cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setTouchControlsEnabled((prev) => !prev)}
                    title={
                      isFa
                        ? 'فعال/غیرفعال کردن دسته لمسی موبایل و اندروید (APK)'
                        : 'Toggle Mobile Touch Gamepad'
                    }
                    className={`p-1.5 border cursor-pointer ${
                      touchControlsEnabled
                        ? 'bg-[#D97706] text-[#0B0908] border-[#FDE68A]'
                        : 'bg-[#0B0908] text-[#D97706] border-[#D97706]/45 hover:bg-[#D97706]/25'
                    }`}
                  >
                    <Gamepad2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    title={ui.settingsBtn}
                    className="p-1.5 bg-[#0B0908] hover:bg-[#D97706]/25 border border-[#D97706]/45 text-[#FDE68A] cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleToggleMute}
                    title="Mute / Unmute"
                    className="p-1.5 bg-[#0B0908] hover:bg-[#D97706]/25 border border-[#D97706]/45 text-[#D97706] cursor-pointer"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-[#A89882]" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() =>
                      setGameState((prev) => (prev === 'paused' ? 'playing' : 'paused'))
                    }
                    title="Pause"
                    className="p-1.5 bg-[#0B0908] hover:bg-[#D97706]/25 border border-[#D97706]/45 text-[#D97706] cursor-pointer"
                  >
                    {gameState === 'paused' ? (
                      <Play className="w-4 h-4" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Epoch Jump Selector Strip (Epochs 1..12) */}
              <div className="bg-[#14100D]/90 border border-[#D97706]/45 px-2 py-1 flex flex-wrap items-center gap-1 text-[10px]">
                <span className="text-[#A89882] px-1 font-mono">{ui.hudEpochSelectLabel}</span>
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
                      className={`px-1.5 py-0.5 font-semibold cursor-pointer border ${
                        runState.epochIndex === idx
                          ? 'bg-[#D97706] text-[#0B0908] border-[#FDE68A]'
                          : 'bg-[#0B0908] text-[#D6C7B2] border-[#D97706]/30 hover:border-[#F59E0B]'
                      }`}
                    >
                      {idx + 1}. {isFa ? faShortNames[idx] : enShortNames[idx]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BOTTOM DOCK: 1v1 TWO-PERSON GOOD VS. EVIL BOSS FIGHT BANNER + RIBBON */}
          <div className="w-full flex flex-col items-center gap-2">
            {telemetry.bossActive && (
              <div
                data-testid="duel-boss-fight-banner"
                className="pointer-events-auto w-full max-w-2xl bg-[#120A0A]/94 border-2 border-[#DC2626] px-4 py-2 shadow-[0_0_32px_rgba(220,38,38,0.65)]"
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#1E3A8A] border border-[#60A5FA] text-[#FDE68A] font-mono text-[10px] font-bold">
                      {runState.alignment < 0
                        ? isFa
                          ? 'خشم اهریمن (شر)'
                          : 'AHRIMAN WRATH'
                        : isFa
                        ? 'فروغ اشه (خیر)'
                        : 'ASHA LIGHT'}
                    </span>
                    <span className="font-bold text-[#FDE68A]">
                      {telemetry.heroTitle || 'پهلوان ایران‌شهر'}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 bg-[#DC2626] text-[#FEF2F2] font-mono text-[10px] font-bold tracking-wider">
                    {telemetry.isDuelBossFight
                      ? isFa
                        ? '⚔️ باس‌فایت دو نفره (۱ در برابر ۱)'
                        : '⚔️ 1v1 BOSS DUEL'
                      : 'VS'}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#FCA5A5]">{telemetry.bossName}</span>
                    <span className="px-2 py-0.5 bg-[#7F1D1D] border border-[#F87171] text-[#FEE2E2] font-mono text-[10px] font-bold">
                      {Math.max(0, Math.round(telemetry.bossHp))}/
                      {Math.max(1, Math.round(telemetry.bossMaxHp))}
                    </span>
                  </div>
                </div>

                {/* Boss Health Bar */}
                <div className="mt-1.5 w-full h-2 bg-[#0B0908] border border-[#DC2626]/60 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#F59E0B] transition-all duration-150"
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

            {/* BOTTOM RIBBON: Compact Control & Active Blessing Strip */}
            <div className="w-full flex items-center justify-between gap-4 bg-[#14100D]/90 border border-[#D97706]/50 px-3.5 py-1.5 text-xs">
              <div className="flex items-center gap-2 text-[#FDE68A] truncate">
                <Flame className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span className="font-bold truncate">{runState.activeBlessingName}</span>
              </div>
              <div className="hidden lg:block font-mono text-[11px] text-[#A89882] truncate">
                {ui.controlHintLine} · X خروجی EXE/APK
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          STATE 3: PAUSE OVERLAY
          ===================================================================== */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 pointer-events-auto">
          <div className="parchment-panel miniature-border max-w-md w-full p-6 text-center shadow-2xl">
            <h2 className="font-display text-2xl font-bold text-[#FDE68A]">
              {ui.pauseTitle}
            </h2>
            <p className="text-xs text-[#D6C7B2] mt-1.5 italic">{ui.pauseSubtitle}</p>

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
                  setIsMusicOpen(true);
                }}
                className="w-full py-2.5 bg-[#7F1D1D] hover:bg-[#991B1B] border border-[#FDE68A] text-[#FDE68A] text-xs font-bold cursor-pointer"
              >
                {isFa
                  ? 'تالار موسیقی سمفونیک و Lyria 3'
                  : 'Symphonic & Lyria 3 Music Studio'}
              </button>
              <button
                onClick={() => {
                  setGameState('playing');
                  setIsExportOpen(true);
                }}
                className="w-full py-2.5 bg-[#065F46] hover:bg-[#047857] border border-[#FDE68A] text-[#FDE68A] text-xs font-bold cursor-pointer"
              >
                {isFa
                  ? 'خروجی EXE ویندوز / APK اندروید و انتشار گیت‌هاب [X]'
                  : 'Export Windows .EXE / Android .APK & GitHub [X]'}
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
                className="w-full py-2.5 bg-[#991B1B] hover:bg-[#B91C1C] border border-[#F59E0B]/60 text-[#F5E6C8] text-xs font-bold cursor-pointer"
              >
                {ui.restartBtn}
              </button>
              <button
                onClick={() => setGameState('title')}
                className="w-full py-2 bg-[#0B0908] hover:bg-[#1C1917] border border-[#D97706]/35 text-[#A89882] text-xs cursor-pointer"
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
                  stance === 'ABYSSAL_AHRIMAN'
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

            <p className="mt-4 text-sm text-[#F5E6C8] leading-relaxed bg-[#0B0908]/85 border border-[#D97706]/35 p-4">
              {isFa ? endingSummary.persianEpilogue : endingSummary.epilogue}
            </p>

            <div className="mt-3 text-xs font-mono text-[#F59E0B]">
              {isFa ? endingSummary.persianVerdict : endingSummary.legacyVerdict}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleQuickRestart}
                className="px-6 py-2.5 bg-[#991B1B] hover:bg-[#B91C1C] border border-[#F59E0B] text-[#FDE68A] text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{ui.restartBtn}</span>
              </button>
              <button
                onClick={() => handleStartChronicle(2)}
                className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#1D4ED8] border border-[#FDE68A] text-[#F5E6C8] text-xs font-bold cursor-pointer"
              >
                {ui.jumpToHushangBtn}
              </button>
              <button
                onClick={() => setGameState('title')}
                className="px-4 py-2.5 bg-[#120F0D] border border-[#D97706]/50 text-[#D6C7B2] text-xs cursor-pointer"
              >
                {ui.returnTitleBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODALS: SHAHNAMEH SCROLL, MANIFEST, SETTINGS, EXPORT, MUSIC STUDIO
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

      {isManifestOpen && (
        <VersionManifestModal
          runState={runState}
          language={settings.language}
          onApplyVersionUpdate={handleApplyVersionUpdate}
          onClose={() => setIsManifestOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={setSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isExportOpen && (
        <ReleaseExportModal
          language={settings.language}
          runState={runState}
          touchControlsEnabled={touchControlsEnabled}
          onToggleTouchControls={setTouchControlsEnabled}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {isMusicOpen && (
        <MusicStudioModal
          language={settings.language}
          onClose={() => setIsMusicOpen(false)}
        />
      )}
    </div>
  );
}
