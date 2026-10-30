export interface ChapterManifestSpec {
  id: string;
  epochNumber: string;
  title: string;
  persianTitle: string;
  ruler: string;
  versionIntroduced: string;
  status: 'playable' | 'unlocked_in_update';
  newMechanics: string[];
  bossEncounter: string;
}

export interface VersionReleaseSpec {
  version: string;
  codename: string;
  persianCodename: string;
  releaseDate: string;
  schemaVersion: number;
  isCurrentActive: boolean;
  summary: string;
  persianSummary: string;
  chaptersIncluded: string[];
  newMechanicsAdded: string[];
  migrationRules: {
    preservesAlignment: boolean;
    preservesIranshahrStability: boolean;
    bonusFarrOnUpgrade: number;
    defaultStartEpochIndex: number;
  };
}

export interface AutomatedBuildManifest {
  gameId: string;
  title: string;
  persianTitle: string;
  activeVersion: string;
  schemaVersion: number;
  artDirection: {
    school: string;
    palette: Record<string, string>;
    typography: Record<string, string>;
  };
  releases: VersionReleaseSpec[];
  chapters: ChapterManifestSpec[];
  cliUpdateScriptTemplate: string;
}

export const SHAHNAMEH_BUILD_MANIFEST: AutomatedBuildManifest = {
  gameId: 'shahnameh-crown-of-ashes-and-light',
  title: 'SHAHNAMEH: CROWN OF ASHES & LIGHT (COMPLETE 12-EPOCH EDITION)',
  persianTitle: 'شاهنامه فردوسی: تاج خاکستر و نور (نسخه کامل ۱۲ عصر — از کیومرث تا پایان شاهنامه)',
  activeVersion: '5.0.0',
  schemaVersion: 8,
  artDirection: {
    school: 'Tabriz & Herat Royal Miniature Reimagined for Dark-Epic 3D Action',
    palette: {
      parchmentObsidian: '#0E0D0B',
      lapisLazuli: '#1E3A8A',
      persianCrimson: '#991B1B',
      imperialGoldLeaf: '#D97706',
      verdigrisTurquoise: '#0D9488',
    },
    typography: {
      display: 'Cinzel Decorative / Vazirmatn Display',
      narrative: 'Cormorant Garamond / Vazirmatn',
      ui: 'Plus Jakarta Sans / Vazirmatn',
      mono: 'JetBrains Mono',
    },
  },
  releases: [
    {
      version: '1.0.0',
      codename: 'The Foundation: Leopard-Throne of Keyumars',
      persianCodename: 'نسخه ۱.۰ — بنیاد: تخت پلنگینه کیومرث و سوگ سیامک',
      releaseDate: '2025-02-10',
      schemaVersion: 1,
      isCurrentActive: false,
      summary:
        'Initial release featuring Epoch I (Keyumars) and Epoch II (Siamak’s Martyrdom), moral binary choices (Asha vs. Ahriman), and foundational melee combat.',
      persianSummary:
        'انتشار نخست شامل عصر کیومرث و رزم سیامک با دیو سیاه، نظام اخلاقی اشه در برابر اهریمن و نبرد پایه.',
      chaptersIncluded: ['epoch-1-keyumars', 'epoch-2-siamak'],
      newMechanicsAdded: [
        'Asha vs. Ahriman Alignment Ledger (-100 to +100)',
        'Iranshahr Kingdom Stability Meter (0% to 100%)',
        'Royal Shamshir & Ox-Headed Mace 3-Hit Combo',
      ],
      migrationRules: {
        preservesAlignment: true,
        preservesIranshahrStability: true,
        bonusFarrOnUpgrade: 0,
        defaultStartEpochIndex: 0,
      },
    },
    {
      version: '1.1.0',
      codename: 'Era of Hushang: The Sadeh Spark & Div-Warfare',
      persianCodename: 'نسخه ۱.۱ — عصر هوشنگ، جشن سده و مکانیک جدید جنگ با دیوان',
      releaseDate: '2025-05-19',
      schemaVersion: 2,
      isCurrentActive: false,
      summary:
        'Adds Epoch III (Shah Hushang & Discovery of Sacred Fire), Sang-e Sadeh Flint-Fire Parry [Key Q], Div Posture/Talisman Bar, Kemend-e Divband Finisher [Key F], and 4 Interactive Sadeh Braziers.',
      persianSummary:
        'افزودن عصر سوم (پادشاهی هوشنگ، کشف آتش سده و استخراج آهن)، مکانیک پرتاب سنگ آتشین سده [Q] برای شکستن طلسم دیوان، کمند دیوبند [F] و ۴ آتشدان مقدس در میدان رزم.',
      chaptersIncluded: ['epoch-1-keyumars', 'epoch-2-siamak', 'epoch-3-hushang-sadeh'],
      newMechanicsAdded: [
        'Sang-e Sadeh Flint-Fire Parry [Key Q]',
        'Div Talisman & Posture Bar',
        'Kemend-e Divband Finisher [Key F]',
        '4 Arena Sadeh Fire Braziers (+40% Forge Bonus)',
      ],
      migrationRules: {
        preservesAlignment: true,
        preservesIranshahrStability: true,
        bonusFarrOnUpgrade: 1,
        defaultStartEpochIndex: 2,
      },
    },
    {
      version: '1.2.0',
      codename: 'Tahmuras the Demon-Binder (Divband)',
      persianCodename: 'نسخه ۱.۲ — عصر طهمورث دیوبند و راز سی خط',
      releaseDate: '2025-08-01',
      schemaVersion: 3,
      isCurrentActive: false,
      summary:
        'Expands the Pishdadian dynasty into the reign of Shah Tahmuras. Bound demons offer the secret of thirty scripts in exchange for mercy.',
      persianSummary:
        'گسترش سلسله پیشدادیان به پادشاهی طهمورث دیوبند؛ به بند کشیدن دیوان با کمند و آموختن سی خط و دبیری از دیوان اسیر.',
      chaptersIncluded: [
        'epoch-1-keyumars',
        'epoch-2-siamak',
        'epoch-3-hushang-sadeh',
        'epoch-4-tahmuras-divband',
      ],
      newMechanicsAdded: [
        'Chain-Bind Multi-Tether [F]',
        'Thirty Scripts Tome Buff',
      ],
      migrationRules: {
        preservesAlignment: true,
        preservesIranshahrStability: true,
        bonusFarrOnUpgrade: 1,
        defaultStartEpochIndex: 3,
      },
    },
    {
      version: '2.0.0',
      codename: 'Fall of Jamshid & The Serpent-Throne of Zahhak',
      persianCodename: 'نسخه ۲.۰ — فرجام جمشید، ضحاک ماردوش و درفش کاویانی',
      releaseDate: '2025-11-15',
      schemaVersion: 4,
      isCurrentActive: false,
      summary:
        'Major expansion covering Jamshid’s hubris, the thousand-year tyranny of Zahhak the Serpent-Shouldered, and Kaveh the Blacksmith raising the Derafsh Kaviani.',
      persianSummary:
        'گسترش بزرگ داستان به روزگار جمشید و نوروز، غرور جمشید، هزار سال بیداد ضحاک ماردوش و خیزش کاوه آهنگر با درفش کاویانی.',
      chaptersIncluded: [
        'epoch-1-keyumars',
        'epoch-2-siamak',
        'epoch-3-hushang-sadeh',
        'epoch-4-tahmuras-divband',
        'epoch-5-jamshid-zahhak',
      ],
      newMechanicsAdded: [
        'Derafsh Kaviani Rally Standard',
        'Twin-Serpent Boss Phase for Zahhak',
      ],
      migrationRules: {
        preservesAlignment: true,
        preservesIranshahrStability: true,
        bonusFarrOnUpgrade: 1,
        defaultStartEpochIndex: 4,
      },
    },
    {
      version: '2.5.0',
      codename: 'Fereydun, Zal & The Seven Labors of Rostam (Haft Khan)',
      persianCodename: 'نسخه ۲.۵ — فریدون، زال و سیمرغ و هفت‌خوان رستم (نبرد دیو سفید)',
      releaseDate: '2026-04-12',
      schemaVersion: 5,
      isCurrentActive: false,
      summary:
        'Introduces Epoch VI (Fereydun binding Zahhak in Mount Damavand) and Epoch VII (Rostam’s Seven Labors in Mazandaran and the brutal cave duel against Div-e Sepid).',
      persianSummary:
        'افزودن عصر ششم (دربند کردن ضحاک در کوه دماوند به دست فریدون) و عصر هفتم (پرورش زال نزد سیمرغ، هفت‌خوان رستم و دریدن جگر دیو سفید مازندران).',
      chaptersIncluded: [
        'epoch-1-keyumars',
        'epoch-2-siamak',
        'epoch-3-hushang-sadeh',
        'epoch-4-tahmuras-divband',
        'epoch-5-jamshid-zahhak',
        'epoch-6-fereydun-damavand',
        'epoch-7-rostam-haft-khan',
      ],
      newMechanicsAdded: [
        'Babr-e Bayan Armor & Rakhsh Charge Impact',
        'Feather of Simurgh Revival & Fire Wave',
        'Cave of Div-e Sepid Boss Encounter',
      ],
      migrationRules: {
        preservesAlignment: true,
        preservesIranshahrStability: true,
        bonusFarrOnUpgrade: 1,
        defaultStartEpochIndex: 6,
      },
    },
    {
      version: '3.0.0',
      codename: 'Tragedy of Rostam & Sohrab + Anatomical 3D Rig & Directional Blood Physics',
      persianCodename: 'نسخه ۳.۰ — تراژدی رستم و سهراب، طراحی منطقی کاراکترها و فیزیک واقعی پاشش خون',
      releaseDate: '2026-07-20',
      schemaVersion: 6,
      isCurrentActive: false,
      summary:
        'Adds Epoch VIII (The Tragedy of Rostam & Sohrab on the Turanian March), full bipedal articulated 3D character rigs, and directional arterial blood splatter physics.',
      persianSummary:
        'افزودن عصر هشتم (نبرد تراژیک رستم و سهراب و نوشداروی دیرهنگام)، آناتومی سه‌بعدی مفصل‌دار پهلوانان و دیوان، و فیزیک واقعی پاشش خون در جهت بردار ضربه.',
      chaptersIncluded: [
        'epoch-1-keyumars',
        'epoch-2-siamak',
        'epoch-3-hushang-sadeh',
        'epoch-4-tahmuras-divband',
        'epoch-5-jamshid-zahhak',
        'epoch-6-fereydun-damavand',
        'epoch-7-rostam-haft-khan',
        'epoch-8-rostam-sohrab',
      ],
      newMechanicsAdded: [
        'Anatomical Articulated 3D Character Rigs',
        'Directional Arterial Blood Cone Physics',
        'Epoch VIII: Tragedy of Rostam & Sohrab',
      ],
      migrationRules: {
        preservesAlignment: true,
        preservesIranshahrStability: true,
        bonusFarrOnUpgrade: 1,
        defaultStartEpochIndex: 7,
      },
    },
    {
      version: '4.0.0',
      codename: 'Fire-Ordeal of Siyavash, Kay Khosrow & Esfandiyar the Brazen-Bodied',
      persianCodename: 'نسخه ۴.۰ — گذر سیاوش از آتش، کین‌خواهی کیخسرو و رزم رستم و اسفندیار روئین‌تن',
      releaseDate: '2026-09-18',
      schemaVersion: 7,
      isCurrentActive: false,
      summary:
        'Adds Epoch IX (Siyavash riding through the Mountain of Fire & Kay Khosrow vanquishing Afrasiab) and Epoch X (Rostam vs. Esfandiyar the Brazen-Bodied & the Simurgh’s Tamarisk Arrow).',
      persianSummary:
        'افزودن عصر نهم (گذر سیاوش از کوه آتش، خون سیاوش و پیروزی کیخسرو بر افراسیاب) و عصر دهم (نبرد تراژیک رستم و اسفندیار روئین‌تن با چاره سیمرغ و تیر گز دوشاخه).',
      chaptersIncluded: [
        'epoch-1-keyumars',
        'epoch-2-siamak',
        'epoch-3-hushang-sadeh',
        'epoch-4-tahmuras-divband',
        'epoch-5-jamshid-zahhak',
        'epoch-6-fereydun-damavand',
        'epoch-7-rostam-haft-khan',
        'epoch-8-rostam-sohrab',
        'epoch-9-siyavash-kaykhosrow',
        'epoch-10-rostam-esfandiyar',
      ],
      newMechanicsAdded: [
        'Siyavash Sacred Fire Ordeal Ward & Jam-e Jam Vision',
        'Simurgh Double-Tipped Tamarisk Arrow (Tir-e Gaz) Armor-Piercing Strike',
        'Esfandiyar Brazen-Bodied (Ruin-Tan) Boss Encounter',
      ],
      migrationRules: {
        preservesAlignment: true,
        preservesIranshahrStability: true,
        bonusFarrOnUpgrade: 1,
        defaultStartEpochIndex: 9,
      },
    },
    {
      version: '5.0.0',
      codename: 'The Immortal Finale: Pit of Shaghad, Rostam Farrokhzad & Ferdowsi’s Eternal Verse',
      persianCodename: 'نسخه ۵.۰ (نسخه کامل و نهایی) — چاه شغاد، انوشیروان، رستم فرخزاد و جاودانگی شاهنامه فردوسی',
      releaseDate: '2026-10-30',
      schemaVersion: 8,
      isCurrentActive: true,
      summary:
        'Completes the entire Shahnameh epic across 12 playable epochs: adds Epoch XI (The Fall of Rostam in the Pit of Shaghad & his final arrow through the plane tree) and Epoch XII (Anushiravan the Just, Rostam Farrokhzad’s last stand, and Hakim Ferdowsi’s immortal palace of Persian verse).',
      persianSummary:
        'تکمیل کامل داستان شاهنامه از آغاز تا پایان در ۱۲ عصر: افزودن عصر یازدهم (توطئه چاه شغاد، تیر آخر رستم از دل درخت چنار و وداع جهان‌پهلوان) و عصر دوازدهم (دادگری انوشیروان، رزم واپسین رستم فرخزاد در پای درفش کاویانی و کاخ بلند نظم حکیم ابوالقاسم فردوسی).',
      chaptersIncluded: [
        'epoch-1-keyumars',
        'epoch-2-siamak',
        'epoch-3-hushang-sadeh',
        'epoch-4-tahmuras-divband',
        'epoch-5-jamshid-zahhak',
        'epoch-6-fereydun-damavand',
        'epoch-7-rostam-haft-khan',
        'epoch-8-rostam-sohrab',
        'epoch-9-siyavash-kaykhosrow',
        'epoch-10-rostam-esfandiyar',
        'epoch-11-rostam-shaghad',
        'epoch-12-ferdowsi-finale',
      ],
      newMechanicsAdded: [
        'Epoch XI: Last Arrow of Dastan (Planes-Piercing Vengeance against Shaghad)',
        'Epoch XII: Immortal Verse of Tus (Kaakh-e Boland-e Nazm) — Final Historical & Mythic Resolution',
        'Complete 12-Epoch Chronicle Selector & Grand Epilogue',
      ],
      migrationRules: {
        preservesAlignment: true,
        preservesIranshahrStability: true,
        bonusFarrOnUpgrade: 2,
        defaultStartEpochIndex: 11,
      },
    },
  ],
  chapters: [
    {
      id: 'epoch-1-keyumars',
      epochNumber: 'Epoch I',
      title: 'The Leopard-Throne of Mount Alborz',
      persianTitle: 'عصر اول: پادشاهی کیومرث بر کوه البرز',
      ruler: 'Shah Keyumars (کیومرث)',
      versionIntroduced: '1.0.0',
      status: 'playable',
      newMechanics: ['Royal Farr Vitality Vessels', 'Soroush Blessing Choice'],
      bossEncounter: 'Vanguard of Div-e Siah (طلایه دیو سیاه)',
    },
    {
      id: 'epoch-2-siamak',
      epochNumber: 'Epoch II',
      title: 'Siamak at the Obsidian Defile',
      persianTitle: 'عصر دوم: رزم سیامک با دیو سیاه',
      ruler: 'Prince Siamak (سیامک)',
      versionIntroduced: '1.0.0',
      status: 'playable',
      newMechanics: ['Shadow-Warlock Ambush', 'Blood Pact vs. Pure Honor'],
      bossEncounter: 'Div-e Siah the Black Demon (دیو سیاه اهریمن)',
    },
    {
      id: 'epoch-3-hushang-sadeh',
      epochNumber: 'Epoch III',
      title: 'Hushang, The Sadeh Spark & Iron Forge',
      persianTitle: 'عصر سوم: هوشنگ، کشف آتش سده و آهنگری',
      ruler: 'Shah Hushang (هوشنگ)',
      versionIntroduced: '1.1.0',
      status: 'playable',
      newMechanics: [
        'Sang-e Sadeh Flint-Fire Parry [Q]',
        'Kemend-e Divband Finisher [F]',
        '4 Interactive Sadeh Fire Braziers',
      ],
      bossEncounter: 'Div-e Siah Reborn in Obsidian Armor (دیو سیاه زره‌پوش)',
    },
    {
      id: 'epoch-4-tahmuras-divband',
      epochNumber: 'Epoch IV',
      title: 'Tahmuras the Demon-Binder & Thirty Scripts',
      persianTitle: 'عصر چهارم: طهمورث دیوبند و راز سی خط',
      ruler: 'Shah Tahmuras (طهمورث دیوبند)',
      versionIntroduced: '1.2.0',
      status: 'playable',
      newMechanics: ['Kemend-e Divband Multi-Bind', 'Secret of the Thirty Scripts'],
      bossEncounter: 'Council of Seven Mazandaran Divs (هفت دیو جادو)',
    },
    {
      id: 'epoch-5-jamshid-zahhak',
      epochNumber: 'Epoch V',
      title: 'Fall of Jamshid & Kaveh’s Derafsh Kaviani',
      persianTitle: 'عصر پنجم: جمشید، ضحاک ماردوش و قیام کاوه آهنگر',
      ruler: 'Jamshid & Kaveh Ahangar (جمشید و کاوه آهنگر)',
      versionIntroduced: '2.0.0',
      status: 'playable',
      newMechanics: ['Derafsh Kaviani Standard', 'Blacksmith Hammer Uprising'],
      bossEncounter: 'Zahhak the Serpent-Shouldered (ضحاک ماردوش)',
    },
    {
      id: 'epoch-6-fereydun-damavand',
      epochNumber: 'Epoch VI',
      title: 'Fereydun & The Chaining of Zahhak in Damavand',
      persianTitle: 'عصر ششم: فریدون فرخ و دربند کردن ضحاک در کوه دماوند',
      ruler: 'Shah Fereydun (فریدون فرخ)',
      versionIntroduced: '2.5.0',
      status: 'playable',
      newMechanics: ['Gorz-e Gavsar (Bull-Headed Royal Mace)', 'Damavand Iron Fetters'],
      bossEncounter: 'Biwarasp Zahhak Unbound (اژدهاک ماردوش در دماوند)',
    },
    {
      id: 'epoch-7-rostam-haft-khan',
      epochNumber: 'Epoch VII',
      title: 'Zal, Simurgh & The Seven Labors of Rostam (Haft Khan)',
      persianTitle: 'عصر هفتم: زال و سیمرغ و هفت‌خوان رستم (نبرد دیو سفید)',
      ruler: 'Jahan-Pahlavan Rostam (جهان‌پهلوان رستم دستان)',
      versionIntroduced: '2.5.0',
      status: 'playable',
      newMechanics: ['Babr-e Bayan Tiger Cuirass', 'Feather of Simurgh Aura', 'Rakhsh Trample'],
      bossEncounter: 'Div-e Sepid of Mazandaran (دیو سفید مازندران)',
    },
    {
      id: 'epoch-8-rostam-sohrab',
      epochNumber: 'Epoch VIII',
      title: 'The Tragedy of Rostam & Sohrab on the Turanian March',
      persianTitle: 'عصر هشتم: تراژدی رستم و سهراب و نوشداروی دیرهنگام',
      ruler: 'Rostam & Young Sohrab (رستم و سهراب یل)',
      versionIntroduced: '3.0.0',
      status: 'playable',
      newMechanics: ['Armlet of Tahmineh Recognition', 'Nushdaru Elixir vs. Royal Wrath'],
      bossEncounter: 'Champion Sohrab & Turanian Iron Vanguard (سهراب و طلایه توران)',
    },
    {
      id: 'epoch-9-siyavash-kaykhosrow',
      epochNumber: 'Epoch IX',
      title: 'The Fire-Ordeal of Siyavash & Kay Khosrow’s Reckoning',
      persianTitle: 'عصر نهم: گذر سیاوش از کوه آتش و کین‌خواهی کیخسرو از افراسیاب',
      ruler: 'Prince Siyavash & Shah Kay Khosrow (سیاوش و کیخسرو)',
      versionIntroduced: '4.0.0',
      status: 'playable',
      newMechanics: ['Shabrang Behzad Fire-Walk Ward', 'Cup of Jam (Jam-e Jam) Sight'],
      bossEncounter: 'Afrasiab, Tyrant of Turan (افراسیاب شاه توران)',
    },
    {
      id: 'epoch-10-rostam-esfandiyar',
      epochNumber: 'Epoch X',
      title: 'Rostam & Esfandiyar the Brazen-Bodied (Tir-e Gaz)',
      persianTitle: 'عصر دهم: رزم رستم و اسفندیار روئین‌تن و تیر گز سیمرغ',
      ruler: 'Rostam & Prince Esfandiyar (رستم و اسفندیار روئین‌تن)',
      versionIntroduced: '4.0.0',
      status: 'playable',
      newMechanics: ['Simurgh Healing Plume', 'Double-Pronged Tamarisk Arrow (تیر گز)'],
      bossEncounter: 'Esfandiyar the Brazen-Bodied (اسفندیار روئین‌تن)',
    },
    {
      id: 'epoch-11-rostam-shaghad',
      epochNumber: 'Epoch XI',
      title: 'The Pit of Shaghad & The Final Arrow of Rostam',
      persianTitle: 'عصر یازدهم: چاه شغاد، تیر آخر رستم از دل درخت چنار و وداع تهمتن',
      ruler: 'Rostam Dastan & Faramarz (رستم دستان و فرامرز)',
      versionIntroduced: '5.0.0',
      status: 'playable',
      newMechanics: ['Plane-Tree Piercing Final Bowshot', 'Vengeance of Zabulistan'],
      bossEncounter: 'Shaghad the Traitor & Kabul Ambushers (شغاد پیمان‌شکن و شاه کابل)',
    },
    {
      id: 'epoch-12-ferdowsi-finale',
      epochNumber: 'Epoch XII',
      title: 'Anushiravan, Rostam Farrokhzad & Ferdowsi’s Immortal Palace of Verse',
      persianTitle: 'عصر دوازدهم (پایان شاهنامه): از انوشیروان و رستم فرخزاد تا کاخ بلند نظم فردوسی',
      ruler: 'Rostam Farrokhzad & Hakim Ferdowsi (رستم فرخزاد و حکیم فردوسی)',
      versionIntroduced: '5.0.0',
      status: 'playable',
      newMechanics: ['Immortal Persian Verse Aura (کاخ بلند نظم)', 'Eternal Derafsh Kaviani Stand'],
      bossEncounter: 'Apocalyptic Host of Ahriman at Ctesiphon (واپسین لشگر اهریمن در تیسفون)',
    },
  ],
  cliUpdateScriptTemplate: `#!/usr/bin/env bash
# ==============================================================================
# SHAHNAMEH CHRONICLE — AUTOMATED SEQUENTIAL VERSION DEPLOYER (v1.0 -> v5.0.0)
# ==============================================================================
set -euo pipefail

TARGET_VERSION="\${1:-5.0.0}"
MANIFEST_FILE="./public/version-manifest.json"

echo ">>> [SHAHNAMEH CI/CD] Validating sequential build manifest for v\${TARGET_VERSION}..."
npx tsx --test src/game/rules.test.ts

echo ">>> [SHAHNAMEH CI/CD] Compiling modular bundle for v\${TARGET_VERSION}..."
npm run build

echo ">>> [SHAHNAMEH CI/CD] Build v\${TARGET_VERSION} ready. All 12 Shahnameh epochs unlocked."
`,
};

export function generateUpdateDeploymentScript(targetVersion = '5.0.0'): string {
  const release =
    SHAHNAMEH_BUILD_MANIFEST.releases.find((r) => r.version === targetVersion) ||
    SHAHNAMEH_BUILD_MANIFEST.releases[SHAHNAMEH_BUILD_MANIFEST.releases.length - 1];

  return `#!/usr/bin/env bash
# ==============================================================================
# SHAHNAMEH: CROWN OF ASHES & LIGHT — SEQUENTIAL RELEASE & UPDATE DEPLOYER
# Target Release: v${release.version} (${release.codename})
# Schema Version: ${release.schemaVersion} | Chapters Included: ${release.chaptersIncluded.length}
# ==============================================================================
set -euo pipefail

echo ">>> [1/4] Validating Shahnameh Build Manifest for v${release.version}..."
npx tsx --test src/game/rules.test.ts

echo ">>> [2/4] Updating public/version-manifest.json to v${release.version}..."
cat << 'EOF' > ./public/version-manifest.json
${JSON.stringify(
  {
    gameId: SHAHNAMEH_BUILD_MANIFEST.gameId,
    activeVersion: release.version,
    schemaVersion: release.schemaVersion,
    chaptersIncluded: release.chaptersIncluded,
  },
  null,
  2
)}
EOF

echo ">>> [3/4] Building production bundle..."
npm run build

echo ">>> [4/4] Release v${release.version} (${release.persianCodename}) ready for deployment!"
`;
}
