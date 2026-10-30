import { MoralChoiceOption } from '../data/storyDatabase';
import { SHAHNAMEH_BUILD_MANIFEST } from '../data/versionManifest';

export type AlignmentStance = 'RADIANT_ASHA' | 'TEMPERED_BALANCE' | 'ABYSSAL_AHRIMAN';

export type EnemyArchetype = 'gurg_swarmer' | 'jadu_kiter' | 'poulad_charger' | 'div_siah_boss';

export interface ChronicleDecisionRecord {
  crossroadsId: string;
  epochLabel: string;
  chosenPath: 'asha' | 'ahriman';
  choiceTitle: string;
  alignmentDelta: number;
  stabilityDelta: number;
}

export interface PlayerRunState {
  version: string;
  schemaVersion: number;
  epochIndex: number;
  maxEpochs: number;
  hp: number;
  maxHp: number;
  farrPips: number; // Discrete vitality vessels (e.g. 5 to 8)
  mythicEnergy: number; // 0 to 100
  alignment: number; // -100 (Pure Ahriman) to +100 (Pure Asha)
  iranshahrStability: number; // 0 to 100
  score: number;
  enemiesVanquished: number;
  divsBoundCount: number; // New v1.1 Div-Band counter
  braziersLit: number; // 0 to 4 Sadeh Braziers ignited in current arena
  attackMultiplier: number;
  lifestealOnKill: number;
  sacredFireGuard: boolean;
  activeBlessingName: string;
  decisions: ChronicleDecisionRecord[];
}

export interface HistoricalEnding {
  id: string;
  title: string;
  persianTitle: string;
  stance: AlignmentStance;
  epilogue: string;
  persianEpilogue: string;
  legacyVerdict: string;
  persianVerdict: string;
}

export function clampDt(rawDtSeconds: number): number {
  if (!Number.isFinite(rawDtSeconds) || rawDtSeconds < 0) return 0;
  return Math.min(rawDtSeconds, 0.05);
}

export function createInitialRunState(
  activeVersion = '1.1.0',
  startEpochOverride?: number
): PlayerRunState {
  const release =
    SHAHNAMEH_BUILD_MANIFEST.releases.find((r) => r.version === activeVersion) ||
    SHAHNAMEH_BUILD_MANIFEST.releases[1];

  const maxEpochs = release.chaptersIncluded.length;
  const epochIndex =
    typeof startEpochOverride === 'number'
      ? Math.max(0, Math.min(maxEpochs - 1, startEpochOverride))
      : 0;

  return {
    version: release.version,
    schemaVersion: release.schemaVersion,
    epochIndex,
    maxEpochs,
    hp: 100,
    maxHp: 100,
    farrPips: 5,
    mythicEnergy: 60,
    alignment: 0,
    iranshahrStability: 65,
    score: 0,
    enemiesVanquished: 0,
    divsBoundCount: 0,
    braziersLit: 0,
    attackMultiplier: 1.0,
    lifestealOnKill: 0,
    sacredFireGuard: false,
    activeBlessingName: 'فره کیومرث و هوشنگ (تراز آغازین)',
    decisions: [],
  };
}

export function calculateAlignmentStance(alignment: number): AlignmentStance {
  if (alignment >= 20) return 'RADIANT_ASHA';
  if (alignment <= -20) return 'ABYSSAL_AHRIMAN';
  return 'TEMPERED_BALANCE';
}

export function applyMoralChoice(
  state: PlayerRunState,
  crossroadsId: string,
  epochLabel: string,
  choice: MoralChoiceOption
): PlayerRunState {
  const nextAlignment = Math.max(-100, Math.min(100, state.alignment + choice.alignmentDelta));
  const nextStability = Math.max(0, Math.min(100, state.iranshahrStability + choice.stabilityDelta));
  const nextFarrPips = Math.max(3, Math.min(8, state.farrPips + choice.farrDelta));
  const nextMaxHp = nextFarrPips * 20;
  const nextHp = Math.min(nextMaxHp, state.hp + choice.farrDelta * 20 + 25);

  return {
    ...state,
    alignment: nextAlignment,
    iranshahrStability: nextStability,
    farrPips: nextFarrPips,
    maxHp: nextMaxHp,
    hp: nextHp,
    mythicEnergy: Math.min(100, state.mythicEnergy + 35),
    attackMultiplier: Number(choice.attackPowerMultiplier.toFixed(2)),
    lifestealOnKill: choice.lifestealOnKill,
    sacredFireGuard: choice.sacredFireGuard,
    activeBlessingName: choice.combatBlessingName,
    decisions: [
      ...state.decisions.filter((d) => d.crossroadsId !== crossroadsId),
      {
        crossroadsId,
        epochLabel,
        chosenPath: choice.path,
        choiceTitle: choice.title,
        alignmentDelta: choice.alignmentDelta,
        stabilityDelta: choice.stabilityDelta,
      },
    ],
  };
}

export function computeBrazierForgeMultiplier(braziersLit: number): number {
  const clamped = Math.max(0, Math.min(4, braziersLit));
  return Number((1 + clamped * 0.1).toFixed(2));
}

export function computePlayerDamageReceived(
  rawDamage: number,
  sacredFireGuard: boolean,
  iranshahrStability: number
): number {
  const guardFactor = sacredFireGuard ? 0.8 : 1.0;
  const stabilityFactor = iranshahrStability >= 75 ? 0.9 : iranshahrStability <= 30 ? 1.15 : 1.0;
  return Math.max(1, Math.round(rawDamage * guardFactor * stabilityFactor));
}

export function computePlayerAttackDamage(
  baseDamage: number,
  attackMultiplier: number,
  alignment: number,
  isHeavyMythic: boolean,
  braziersLit = 0
): number {
  const alignmentBonus = alignment <= -20 ? 1.12 : alignment >= 20 ? 1.06 : 1.0;
  const mythicFactor = isHeavyMythic ? 2.1 : 1.0;
  const forgeBonus = computeBrazierForgeMultiplier(braziersLit);
  return Math.max(
    1,
    Math.round(baseDamage * attackMultiplier * alignmentBonus * mythicFactor * forgeBonus)
  );
}

/**
 * New v1.1 Era of Hushang Mechanic: Sang-e Sadeh (Flint-Fire Parry & Posture Shatter)
 */
export function computeSadehFlintCounter(
  isEnemyTelegraphing: boolean,
  sacredFireGuard: boolean,
  braziersLit: number
): {
  damage: number;
  postureDamage: number;
  parrySuccess: boolean;
  energyGain: number;
} {
  const forgeMult = computeBrazierForgeMultiplier(braziersLit);
  const guardBonus = sacredFireGuard ? 1.35 : 1.0;
  if (isEnemyTelegraphing) {
    return {
      damage: Math.round(36 * forgeMult * guardBonus),
      postureDamage: Math.round(65 * guardBonus),
      parrySuccess: true,
      energyGain: 24,
    };
  }
  return {
    damage: Math.round(18 * forgeMult),
    postureDamage: Math.round(32 * guardBonus),
    parrySuccess: false,
    energyGain: 8,
  };
}

/**
 * New v1.1/v1.2 Mechanic: Div-Band Finisher on Staggered/Bound Demons
 */
export function resolveDivBandFinisher(state: PlayerRunState): {
  nextState: PlayerRunState;
  aoeExplosionDamage: number;
  healedAmount: number;
} {
  const isAsha = state.alignment >= 0;
  const heal = isAsha ? 14 : Math.max(10, state.lifestealOnKill);
  const stabilityBonus = isAsha ? 4 : 0;
  const aoeExplosionDamage = isAsha ? 24 : 52;

  return {
    nextState: {
      ...state,
      hp: Math.min(state.maxHp, state.hp + heal),
      mythicEnergy: Math.min(100, state.mythicEnergy + 22),
      iranshahrStability: Math.min(100, state.iranshahrStability + stabilityBonus),
      score: state.score + 180,
      enemiesVanquished: state.enemiesVanquished + 1,
      divsBoundCount: state.divsBoundCount + 1,
    },
    aoeExplosionDamage,
    healedAmount: heal,
  };
}

export function resolveHistoricalEnding(state: PlayerRunState, victorious: boolean): HistoricalEnding {
  const stance = calculateAlignmentStance(state.alignment);

  if (!victorious) {
    return {
      id: 'ending-fall-of-alborz',
      title: 'The Eclipse of Mount Alborz',
      persianTitle: 'خاموشی فروغ البرز و آتشدان سده',
      stance,
      epilogue:
        'The Black Div’s obsidian legions extinguished the watch-fires of Alborz. Yet in the mountain caves, the survivors whisper of Hushang’s spark waiting to be struck anew.',
      persianEpilogue:
        'سپاه دیو سیاه آتش‌های دیده‌بانی البرز را خاموش ساخت؛ اما در غارهای کوهستان، بازماندگان هنوز از جرقه سنگ آتشین هوشنگ و امید خیزش دوباره سخن می‌گویند.',
      legacyVerdict: `Iranshahr Stability fell at ${Math.round(state.iranshahrStability)}% · Royal Farr shattered in Epoch ${state.epochIndex + 1}`,
      persianVerdict: `ثبات ایران‌شهر: ${Math.round(state.iranshahrStability)}٪ · دیوان به بند کشیده شده: ${state.divsBoundCount}`,
    };
  }

  if (stance === 'RADIANT_ASHA') {
    return {
      id: 'ending-golden-asha',
      title: 'The Golden Dawn of Asha & Feast of Sadeh',
      persianTitle: 'طلوع زرین اَشَه، جشن سده و پیروزی درفش کاویانی',
      stance: 'RADIANT_ASHA',
      epilogue:
        'Through justice and the consecrated flame of Sadeh, Div-e Siah was cast down without corrupting the soul of Iranshahr. From the smelted iron came the plowshare, the canal, and three centuries of luminous peace.',
      persianEpilogue:
        'به نیروی داد و فروغ مقدس آتش سده، دیو سیاه و اهریمنان بی‌آنکه روان ایران‌شهر به ستم آلوده شود سرنگون گشتند. از آهن گداخته هوشنگ، گاوآهن و کاریز آب ساخته شد و سیصد سال صلح و روشنایی بر هفت کشور تابید.',
      legacyVerdict: `Path of Asha Ascendant (+${Math.round(state.alignment)}) · Iranshahr Stability ${Math.round(state.iranshahrStability)}%`,
      persianVerdict: `راه اَشَه پیروز (+${Math.round(state.alignment)}) · ثبات ایران‌شهر ${Math.round(state.iranshahrStability)}٪ · دیوان دربند: ${state.divsBoundCount}`,
    };
  }

  if (stance === 'ABYSSAL_AHRIMAN') {
    return {
      id: 'ending-obsidian-ahriman',
      title: 'The Obsidian Throne of Blood & Ash',
      persianTitle: 'تخت سیاه خون و خاکستر مازندران',
      stance: 'ABYSSAL_AHRIMAN',
      epilogue:
        'Div-e Siah lies slaughtered, yet the victor wears the demon’s own horned helm. The forests of Mazandaran burn as eternal tribute, and the seven climes tremble before an iron sovereignty born of Ahriman’s wrath.',
      persianEpilogue:
        'دیو سیاه در خون خود غلتید، اما فاتح نبرد خود کلاهخود شاخدار دیو را بر سر نهاد! بیشه‌های مازندران در آتش انتقام سوخت و هفت کشور در برابر پادشاهی آهنین و هراس‌انگیز شما به لرزه افتادند.',
      legacyVerdict: `Path of Ahriman Dominant (${Math.round(state.alignment)}) · Iranshahr Stability ${Math.round(state.iranshahrStability)}%`,
      persianVerdict: `سلطه راه اهریمن (${Math.round(state.alignment)}) · ثبات ایران‌شهر ${Math.round(state.iranshahrStability)}٪ · دیوان دربند: ${state.divsBoundCount}`,
    };
  }

  return {
    id: 'ending-twilight-covenant',
    title: 'The Twilight Covenant of Dual Flame',
    persianTitle: 'پیمان سپیده‌دم و تراز آتش و آهن',
    stance: 'TEMPERED_BALANCE',
    epilogue:
      'Walking the razor edge between Soroush’s mercy and the ruthless steel of war, the throne of Alborz endures. Both light and shadow remain bound beneath the royal seal.',
    persianEpilogue:
      'با گام برداشتن بر لبه تیغ میان مهر سروش و صلابت آهن، تخت البرز پایدار ماند. روشنایی و سایه هر دو در زیر نگین شاهی به تراز درآمدند.',
    legacyVerdict: `Balanced Sovereign (${Math.round(state.alignment)}) · Iranshahr Stability ${Math.round(state.iranshahrStability)}%`,
    persianVerdict: `شهریار متعادل (${Math.round(state.alignment)}) · ثبات ایران‌شهر ${Math.round(state.iranshahrStability)}٪ · دیوان دربند: ${state.divsBoundCount}`,
  };
}

export interface EnemyIntentVector {
  vx: number;
  vy: number;
  shouldStartTelegraph: boolean;
}

export function evaluateEnemyPolicy(
  archetype: EnemyArchetype,
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
  speed: number,
  cooldownReady: boolean,
  hasAttackToken: boolean,
  phaseTimer: number
): EnemyIntentVector {
  const dx = playerX - enemyX;
  const dy = playerY - enemyY;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;

  if (archetype === 'gurg_swarmer') {
    const perpX = -ny * Math.sin(phaseTimer * 5) * 0.45;
    const perpY = nx * Math.sin(phaseTimer * 5) * 0.45;
    return {
      vx: (nx + perpX) * speed,
      vy: (ny + perpY) * speed,
      shouldStartTelegraph: dist <= 62 && cooldownReady && hasAttackToken,
    };
  }

  if (archetype === 'jadu_kiter') {
    if (dist < 175) {
      return {
        vx: -nx * speed * 0.95,
        vy: -ny * speed * 0.95,
        shouldStartTelegraph: cooldownReady && hasAttackToken,
      };
    }
    if (dist > 310) {
      return {
        vx: nx * speed * 0.85,
        vy: ny * speed * 0.85,
        shouldStartTelegraph: false,
      };
    }
    return {
      vx: -ny * speed * 0.65,
      vy: nx * speed * 0.65,
      shouldStartTelegraph: cooldownReady && hasAttackToken,
    };
  }

  if (archetype === 'poulad_charger') {
    const inChargeWindow = dist >= 75 && dist <= 260;
    return {
      vx: nx * speed * 0.75,
      vy: ny * speed * 0.75,
      shouldStartTelegraph: inChargeWindow && cooldownReady && hasAttackToken,
    };
  }

  return {
    vx: nx * speed * 0.82,
    vy: ny * speed * 0.82,
    shouldStartTelegraph: dist <= 290 && cooldownReady && hasAttackToken,
  };
}

export function migrateSaveStateToVersion(
  savedState: PlayerRunState,
  targetVersion: string
): { migrated: PlayerRunState; migrationNotes: string[] } {
  const release = SHAHNAMEH_BUILD_MANIFEST.releases.find((r) => r.version === targetVersion);
  if (!release) {
    throw new Error(`Unknown target version in manifest: ${targetVersion}`);
  }

  const notes: string[] = [];
  const bonusFarr =
    savedState.version !== targetVersion ? release.migrationRules.bonusFarrOnUpgrade : 0;
  const nextFarrPips = Math.min(8, savedState.farrPips + bonusFarr);
  const nextEpochIndex = Math.min(
    release.chaptersIncluded.length - 1,
    release.migrationRules.defaultStartEpochIndex
  );

  notes.push(
    `ارتقای خودکار ساختار ذخیره از نسخه ${savedState.version} به نسخه ${release.version} (${release.persianCodename}).`
  );
  notes.push(
    `حفظ کامل تراز اخلاقی (${savedState.alignment}) و ثبات ایران‌شهر (${savedState.iranshahrStability}٪).`
  );
  if (bonusFarr > 0) {
    notes.push(`اهدای +${bonusFarr} ظرف فره ایزدی برای ورود به عصر جدید.`);
  }

  return {
    migrated: {
      ...savedState,
      version: release.version,
      schemaVersion: release.schemaVersion,
      epochIndex: nextEpochIndex,
      maxEpochs: release.chaptersIncluded.length,
      farrPips: nextFarrPips,
      maxHp: nextFarrPips * 20,
      hp: Math.min(nextFarrPips * 20, savedState.hp + bonusFarr * 20),
    },
    migrationNotes: notes,
  };
}
