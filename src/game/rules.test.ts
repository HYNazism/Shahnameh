import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampDt,
  createInitialRunState,
  calculateAlignmentStance,
  applyMoralChoice,
  computePlayerDamageReceived,
  computePlayerAttackDamage,
  computeSadehFlintCounter,
  resolveDivBandFinisher,
  computeBrazierForgeMultiplier,
  resolveHistoricalEnding,
  evaluateEnemyPolicy,
  migrateSaveStateToVersion,
} from './rules';
import { STORY_DATABASE } from '../data/storyDatabase';
import {
  DEFAULT_GAME_SETTINGS,
  applyQualityPreset,
  applyDifficultyPreset,
} from '../data/i18nAndSettings';

test('clampDt caps frame delta at 0.05s and handles negative/NaN values', () => {
  assert.equal(clampDt(0.016), 0.016);
  assert.equal(clampDt(0.25), 0.05);
  assert.equal(clampDt(-1), 0);
  assert.equal(clampDt(Number.NaN), 0);
});

test('applyMoralChoice shifts alignment, Iranshahr stability, and combat blessings for Asha vs Ahriman', () => {
  const initial = createInitialRunState('1.1.0');
  const firstNode = STORY_DATABASE[0];

  const afterAsha = applyMoralChoice(initial, firstNode.id, firstNode.epochLabel, firstNode.ashaOption);
  assert.equal(afterAsha.alignment, 25);
  assert.equal(afterAsha.iranshahrStability, 80);
  assert.equal(afterAsha.sacredFireGuard, true);
  assert.equal(afterAsha.farrPips, 6);
  assert.equal(calculateAlignmentStance(afterAsha.alignment), 'RADIANT_ASHA');

  const afterAhriman = applyMoralChoice(
    initial,
    firstNode.id,
    firstNode.epochLabel,
    firstNode.ahrimanOption
  );
  assert.equal(afterAhriman.alignment, -25);
  assert.equal(afterAhriman.iranshahrStability, 55);
  assert.equal(afterAhriman.lifestealOnKill, 8);
  assert.equal(calculateAlignmentStance(afterAhriman.alignment), 'ABYSSAL_AHRIMAN');
});

test('v1.1 Sang-e Sadeh Flint Parry and Div-Band Finisher mechanics compute posture shatter and rewards', () => {
  const normalFlint = computeSadehFlintCounter(false, false, 0);
  const parryFlintWithBraziers = computeSadehFlintCounter(true, true, 4);
  assert.equal(normalFlint.parrySuccess, false);
  assert.equal(parryFlintWithBraziers.parrySuccess, true);
  assert.ok(parryFlintWithBraziers.postureDamage > normalFlint.postureDamage * 2);
  assert.equal(computeBrazierForgeMultiplier(4), 1.4);

  const state = { ...createInitialRunState('1.1.0'), hp: 60, alignment: 30 };
  const finisher = resolveDivBandFinisher(state);
  assert.equal(finisher.nextState.divsBoundCount, 1);
  assert.ok(finisher.nextState.hp > 60);
  assert.ok(finisher.nextState.iranshahrStability > state.iranshahrStability);
});

test('resolveHistoricalEnding unlocks distinct Persian/English endings for Asha, Ahriman, Balance, and Defeat', () => {
  const base = createInitialRunState('1.1.0');

  const ashaEnd = resolveHistoricalEnding({ ...base, alignment: 60, iranshahrStability: 95 }, true);
  assert.equal(ashaEnd.id, 'ending-golden-asha');
  assert.ok(ashaEnd.persianTitle.includes('اَشَه'));

  const ahrimanEnd = resolveHistoricalEnding({ ...base, alignment: -65, iranshahrStability: 25 }, true);
  assert.equal(ahrimanEnd.id, 'ending-obsidian-ahriman');

  const balanceEnd = resolveHistoricalEnding({ ...base, alignment: 5, iranshahrStability: 65 }, true);
  assert.equal(balanceEnd.id, 'ending-twilight-covenant');

  const defeatEnd = resolveHistoricalEnding({ ...base, hp: 0 }, false);
  assert.equal(defeatEnd.id, 'ending-fall-of-alborz');
});

test('evaluateEnemyPolicy produces distinct movement policies across swarmer, kiter, and charger archetypes', () => {
  const kiterClose = evaluateEnemyPolicy('jadu_kiter', 100, 100, 200, 100, 100, true, true, 0);
  assert.ok(kiterClose.vx < 0, 'Kiter should retreat away from player when close');

  const swarmerClose = evaluateEnemyPolicy('gurg_swarmer', 100, 100, 200, 100, 100, true, true, 0);
  assert.ok(swarmerClose.vx > 0, 'Swarmer should advance toward player');

  const chargerWithToken = evaluateEnemyPolicy('poulad_charger', 100, 100, 250, 100, 100, true, true, 0);
  const chargerWithoutToken = evaluateEnemyPolicy(
    'poulad_charger',
    100,
    100,
    250,
    100,
    100,
    true,
    false,
    0
  );
  assert.equal(chargerWithToken.shouldStartTelegraph, true);
  assert.equal(chargerWithoutToken.shouldStartTelegraph, false);
});

test('migrateSaveStateToVersion and Low-to-Maximum settings presets work across v1.0 -> v1.1 -> v2.0', () => {
  const v1State = applyMoralChoice(
    createInitialRunState('1.0.0'),
    STORY_DATABASE[0].id,
    STORY_DATABASE[0].epochLabel,
    STORY_DATABASE[0].ashaOption
  );
  const { migrated: v11State } = migrateSaveStateToVersion(v1State, '1.1.0');
  assert.equal(v11State.version, '1.1.0');
  assert.equal(v11State.epochIndex, 2); // Enters Era of Hushang

  const { migrated: v20State } = migrateSaveStateToVersion(v11State, '2.0.0');
  assert.equal(v20State.version, '2.0.0');
  assert.equal(v20State.maxEpochs, 5);
  assert.equal(v20State.epochIndex, 4); // Enters Jamshid & Zahhak

  assert.equal(DEFAULT_GAME_SETTINGS.language, 'fa');
  const lowSettings = applyQualityPreset(DEFAULT_GAME_SETTINGS, 'low');
  const ultraSettings = applyQualityPreset(lowSettings, 'ultra');
  assert.equal(lowSettings.miniatureOrnamentLevel, 1);
  assert.equal(ultraSettings.miniatureOrnamentLevel, 4);

  const maxDiff = applyDifficultyPreset(DEFAULT_GAME_SETTINGS, 'maximum');
  assert.equal(maxDiff.enemyAggressionScale, 1.5);
});
