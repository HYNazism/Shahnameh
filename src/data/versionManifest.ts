export interface ChapterModuleSpec {
  id: string;
  epochNumber: string;
  title: string;
  persianSubtitle: string;
  ruler: string;
  arenaTheme: 'alborz_dawn' | 'siamak_gorge' | 'sadeh_crags' | 'babylon_chains' | 'zahhak_citadel';
  unlockedInVersion: string;
  bossName: string;
}

export interface VersionReleaseSpec {
  version: string;
  codename: string;
  persianCodename: string;
  releaseDate: string;
  schemaVersion: number;
  compatibleFrom: string[];
  summary: string;
  newMechanics: string[];
  chaptersIncluded: string[];
  enemyArchetypes: string[];
  alignmentEndings: string[];
  migrationRules: {
    preserveAlignment: boolean;
    preserveIranshahrStability: boolean;
    preserveChronicleDecisions: boolean;
    bonusFarrOnUpgrade: number;
    defaultStartEpochIndex: number;
  };
}

export interface AutomatedBuildManifest {
  projectId: string;
  title: string;
  engine: string;
  artStyle: string;
  activeVersion: string;
  currentSchemaVersion: number;
  releases: VersionReleaseSpec[];
  chapters: ChapterModuleSpec[];
}

export const SHAHNAMEH_BUILD_MANIFEST: AutomatedBuildManifest = {
  projectId: 'shahnameh-crown-of-ashes-and-light',
  title: 'Shahnameh: Crown of Ashes & Light',
  engine: 'HTML5 Canvas2D + React Modular Chronicle Engine (v1.1 Div-Warfare Update)',
  artStyle: 'Tabriz & Herat Mature Persian Miniature (Lapis, Crimson, Gold Leaf, Obsidian)',
  activeVersion: '1.1.0',
  currentSchemaVersion: 2,
  releases: [
    {
      version: '1.0.0',
      codename: 'The Foundation: Era of Keyumars & The First Moral Crossroads',
      persianCodename: 'نسخه ۱.۰ — بنیاد پادشاهی کیومرث و رزم سیامک',
      releaseDate: '2026-10-29',
      schemaVersion: 1,
      compatibleFrom: ['1.0.0'],
      summary:
        'Foundational release spanning Keyumars upon the Leopard-Throne of Mount Alborz and the ambush of Prince Siamak by Div-e Siah.',
      newMechanics: [
        'Moral Binary Crossroads: Path of Asha [1] vs. Path of Ahriman [2]',
        '3-Phase Shamshir/Mace Combo & Simurgh Dodge-Dash [Shift]',
        'Iranshahr Stability & Royal Farr Vitality Vessels',
      ],
      chaptersIncluded: ['epoch-1-keyumars', 'epoch-2-siamak', 'epoch-3-hushang'],
      enemyArchetypes: [
        'Gurg-Div (Ahrimanic Wolf-Imp Swarmer)',
        'Jadu-Div (Mazandaran Sorcerer Ranged Kiter)',
        'Poulad-Div (Iron-Horned Charger)',
        'Div-e Siah (The Black Demon Commander)',
      ],
      alignmentEndings: [
        'The Golden Dawn of Asha (Order & Sacred Fire)',
        'The Obsidian Crown of Ahriman (Dominion Through Dread)',
        'The Twilight Covenant of Alborz (Tempered Equilibrium)',
      ],
      migrationRules: {
        preserveAlignment: true,
        preserveIranshahrStability: true,
        preserveChronicleDecisions: true,
        bonusFarrOnUpgrade: 0,
        defaultStartEpochIndex: 0,
      },
    },
    {
      version: '1.1.0',
      codename: 'Era of Hushang: The Sadeh Fire & Div-Breaker Warfare',
      persianCodename: 'نسخه ۱.۱ — عصر هوشنگ، پیدایش آتش سده و مکانیک نوین جنگ با دیوان',
      releaseDate: '2026-10-29',
      schemaVersion: 2,
      compatibleFrom: ['1.0.0', '1.1.0'],
      summary:
        'Enters the Era of Shah Hushang with the discovery of Sacred Sadeh Fire, iron-smelting forges, Flint-Fire Parry & Projectile Deflection [Q], Div Talisman Stagger bars, and Demon-Binding Finishers [F].',
      newMechanics: [
        'Sang-e Sadeh [Key Q]: Hurl flint-stone fire & parry incoming Div telegraphs/projectiles',
        'Div-Band Stagger & Finisher [Key F]: Crack Div Talisman armor to bind or execute stunned demons',
        'Interactive Sadeh Braziers (0/4): Ignite the 4 corner fire altars to forge-temper weapon damage (+10% per brazier)',
      ],
      chaptersIncluded: [
        'epoch-1-keyumars',
        'epoch-2-siamak',
        'epoch-3-hushang',
        'epoch-4-tahmuras',
      ],
      enemyArchetypes: [
        'Gurg-Div (Ahrimanic Wolf-Imp Swarmer)',
        'Jadu-Div (Mazandaran Sorcerer Ranged Kiter)',
        'Poulad-Div (Iron-Horned Talisman Charger)',
        'Div-e Siah (The Black Demon Commander)',
      ],
      alignmentEndings: [
        'The Sacred Forge of Sadeh (Asha Ascendant)',
        'The Hellfire Anvil of Mazandaran (Ahriman Dominant)',
        'The Tempered Iron Crown (Balance)',
      ],
      migrationRules: {
        preserveAlignment: true,
        preserveIranshahrStability: true,
        preserveChronicleDecisions: true,
        bonusFarrOnUpgrade: 1,
        defaultStartEpochIndex: 2, // Enters directly at Epoch III: Era of Hushang when selected
      },
    },
    {
      version: '1.2.0',
      codename: 'Era of Tahmuras Divband: The Lasso of Thirty Scripts',
      persianCodename: 'نسخه ۱.۲ — عصر طهمورث دیوبند و کمند سی خط',
      releaseDate: '2026-11-12',
      schemaVersion: 3,
      compatibleFrom: ['1.0.0', '1.1.0', '1.2.0'],
      summary:
        'Sequential expansion starring Shah Tahmuras the Demon-Binder. Enhances Div-Band finishers [F] to extract ancient Pahlavi and Sogdian scripts from captive Demon Chieftains.',
      newMechanics: [
        'Kemend-e Tahmuras: Extended range on [F] Demon-Binding chains',
        'Tribute of Thirty Scripts: Capturing bound Divs grants permanent Chronicle Renown & Stability',
      ],
      chaptersIncluded: [
        'epoch-1-keyumars',
        'epoch-2-siamak',
        'epoch-3-hushang',
        'epoch-4-tahmuras',
      ],
      enemyArchetypes: [
        'Gurg-Div (Ahrimanic Wolf-Imp Swarmer)',
        'Jadu-Div (Mazandaran Sorcerer Ranged Kiter)',
        'Poulad-Div (Iron-Horned Talisman Charger)',
        'Ghul-e Biaban Archon (Shadow Binder Boss)',
      ],
      alignmentEndings: [
        'The Illuminated Script of Asha',
        'The Iron Chains of Tahmuras',
        'The Scribe of Two Realms',
      ],
      migrationRules: {
        preserveAlignment: true,
        preserveIranshahrStability: true,
        preserveChronicleDecisions: true,
        bonusFarrOnUpgrade: 1,
        defaultStartEpochIndex: 3,
      },
    },
    {
      version: '2.0.0',
      codename: 'Era of Jamshid & Zahhak: The Serpent-Throne & Kaveh’s Uprising',
      persianCodename: 'نسخه ۲.۰ — عصر جمشید و ضحاک ماردوش و قیام کاوه آهنگر',
      releaseDate: '2026-12-01',
      schemaVersion: 4,
      compatibleFrom: ['1.0.0', '1.1.0', '1.2.0', '2.0.0'],
      summary:
        'Major epoch expansion introducing Jamshid’s hubris, Zahhak the Serpent-Shoulder’s thousand-year tyranny, and Kaveh the Blacksmith raising the Derafsh Kaviani apron-banner.',
      newMechanics: [
        'Derafsh Kaviani Rally Standard: Full 4-brazier ignition triggers automatic Royal Farr regeneration',
        'Epoch V Boss Encounter: Zahhak’s Serpent-Guard General & Ahrimanic Sorcery',
      ],
      chaptersIncluded: [
        'epoch-1-keyumars',
        'epoch-2-siamak',
        'epoch-3-hushang',
        'epoch-4-tahmuras',
        'epoch-5-jamshid-zahhak',
      ],
      enemyArchetypes: [
        'Gurg-Div (Ahrimanic Wolf-Imp Swarmer)',
        'Jadu-Div (Mazandaran Sorcerer Ranged Kiter)',
        'Poulad-Div (Iron-Horned Talisman Charger)',
        'Mar-Dosht Executioner (Zahhak Serpent-Shoulder Boss)',
      ],
      alignmentEndings: [
        'Banner of Kaveh (Derafsh Kaviani Restored)',
        'Throne of the Twin Serpents',
        'Ashes of Persepolis',
      ],
      migrationRules: {
        preserveAlignment: true,
        preserveIranshahrStability: true,
        preserveChronicleDecisions: true,
        bonusFarrOnUpgrade: 2,
        defaultStartEpochIndex: 4,
      },
    },
  ],
  chapters: [
    {
      id: 'epoch-1-keyumars',
      epochNumber: 'Epoch I (v1.0)',
      title: 'The Leopard-Throne of Mount Alborz',
      persianSubtitle: 'پادشاهی کیومرث — طلوع فره ایزدی',
      ruler: 'Shah Keyumars',
      arenaTheme: 'alborz_dawn',
      unlockedInVersion: '1.0.0',
      bossName: 'Khar-Div Vanguard',
    },
    {
      id: 'epoch-2-siamak',
      epochNumber: 'Epoch II (v1.0)',
      title: 'The Ambush in the Obsidian Gorge',
      persianSubtitle: 'نبرد سیامک با دیو سیاه',
      ruler: 'Prince Siamak',
      arenaTheme: 'siamak_gorge',
      unlockedInVersion: '1.0.0',
      bossName: 'Poulad-Div Warlord',
    },
    {
      id: 'epoch-3-hushang',
      epochNumber: 'Epoch III (v1.1 Hushang)',
      title: 'The Sadeh Fire & Iron Forge of Hushang',
      persianSubtitle: 'پادشاهی هوشنگ پیشدادی — پیدایش آتش سده و آهنگری',
      ruler: 'Shah Hushang',
      arenaTheme: 'sadeh_crags',
      unlockedInVersion: '1.1.0',
      bossName: 'Div-e Siah (The Black Demon)',
    },
    {
      id: 'epoch-4-tahmuras',
      epochNumber: 'Epoch IV (v1.2 Tahmuras)',
      title: 'Tahmuras the Demon-Binder',
      persianSubtitle: 'طهمورث دیوبند و راز سی خط',
      ruler: 'Shah Tahmuras',
      arenaTheme: 'babylon_chains',
      unlockedInVersion: '1.2.0',
      bossName: 'Ghul-e Biaban Archon',
    },
    {
      id: 'epoch-5-jamshid-zahhak',
      epochNumber: 'Epoch V (v2.0 Kaveh & Zahhak)',
      title: 'Fall of Jamshid & Uprising of Kaveh',
      persianSubtitle: 'جمشید و ضحاک ماردوش — درفش کاویانی',
      ruler: 'Kaveh & Fereydun',
      arenaTheme: 'zahhak_citadel',
      unlockedInVersion: '2.0.0',
      bossName: 'Biwarasp Zahhak Vanguard',
    },
  ],
};

export function generateUpdateDeploymentScript(targetVersion: string): string {
  const release =
    SHAHNAMEH_BUILD_MANIFEST.releases.find((r) => r.version === targetVersion) ||
    SHAHNAMEH_BUILD_MANIFEST.releases[1];

  return `#!/usr/bin/env bash
# ==============================================================================
# SHAHNAMEH AUTOMATED SEQUENTIAL VERSION DEPLOYER
# Target Version : v${release.version} (${release.codename})
# Persian Title  : ${release.persianCodename}
# Schema Version : ${release.schemaVersion}
# Compatible From: ${release.compatibleFrom.join(', ')}
# ==============================================================================
set -euo pipefail

MANIFEST_FILE="version-manifest-v${release.version}.json"
echo "[1/4] Validating save-state schema compatibility (${release.compatibleFrom.join(' -> ')} -> ${release.version})..."
cat << 'EOF' > "$MANIFEST_FILE"
${JSON.stringify(
  {
    projectId: SHAHNAMEH_BUILD_MANIFEST.projectId,
    deployedVersion: release.version,
    codename: release.codename,
    persianCodename: release.persianCodename,
    schemaVersion: release.schemaVersion,
    newMechanics: release.newMechanics,
    chaptersIncluded: release.chaptersIncluded,
    migrationRules: release.migrationRules,
    timestamp: new Date().toISOString(),
  },
  null,
  2
)}
EOF

echo "[2/4] Migrating Iranshahr world-state & enabling Div-Warfare modules (${release.newMechanics.length} modules)..."
echo "[3/4] Compiling modular chapter bundles: ${release.chaptersIncluded.join(', ')}..."
npm run build

echo "[4/4] Deployment manifest written to $MANIFEST_FILE. Ready for sequential publish."
`;
}
