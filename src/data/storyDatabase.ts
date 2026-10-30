export interface MoralChoiceOption {
  id: string;
  path: 'asha' | 'ahriman';
  title: string;
  persianTag: string;
  description: string;
  consequenceSummary: string;
  alignmentDelta: number; // + for Asha (Light/Order), - for Ahriman (Darkness/Power)
  stabilityDelta: number; // Iranshahr kingdom stability change
  farrDelta: number; // Max vitality / Royal glory change
  combatBlessingName: string;
  combatBlessingEffect: string;
  attackPowerMultiplier: number;
  lifestealOnKill: number;
  sacredFireGuard: boolean;
}

export interface AudioCueMetadata {
  scaleMode: 'Dastgah-e Shur (Minor Modal)' | 'Dastgah-e Chahargah (Heroic)' | 'Homayoun (Tragic)';
  primaryInstruments: string[];
  ambientBed: string;
  stingerFreqHz: number;
}

export interface StoryCrossroadsNode {
  id: string;
  epochIndex: number; // 0 = Keyumars, 1 = Siamak, 2 = Hushang, 3 = Tahmuras, 4 = Jamshid/Zahhak
  versionRequired: string;
  epochLabel: string;
  title: string;
  location: string;
  portraitId: 'keyumars' | 'siamak' | 'hushang' | 'div_siah' | 'soroush';
  ferdowsiCouplet: {
    english: [string, string];
    transliteration: string;
  };
  narrativeProse: string[];
  audioMetadata: AudioCueMetadata;
  ashaOption: MoralChoiceOption;
  ahrimanOption: MoralChoiceOption;
}

export const STORY_DATABASE: StoryCrossroadsNode[] = [
  {
    id: 'crossroads-1-keyumars-throne',
    epochIndex: 0,
    versionRequired: '1.0.0',
    epochLabel: 'Epoch I · The Dawn of Sovereignty',
    title: 'The Leopard-Throne of Mount Alborz',
    location: 'Summit Sanctuary of Alborz, beneath the Lapis Firmament',
    portraitId: 'keyumars',
    ferdowsiCouplet: {
      english: [
        'First among mortals to bind the crown of gold,',
        'Clad in leopard pelt where mountain tempests rolled.',
      ],
      transliteration: 'چو آمد به برج حمل آفتاب / جهان گشت با فر و آیین و آب',
    },
    narrativeProse: [
      'For thirty winters Shah Keyumars has ruled from the sun-lit crags of Mount Alborz. Wild beasts and mountain clans kneel alike before his radiant Farr—the divine glory of kingship.',
      'Yet the angel Soroush descends wrapped in emerald flame with a dire warning: in the sunless chasms of Mazandaran, Ahriman has spawned Div-e Siah, the Black Demon, whose vanguard already scales the lower terraces. How shall the First King prepare Iranshahr for the coming war?',
    ],
    audioMetadata: {
      scaleMode: 'Dastgah-e Chahargah (Heroic)',
      primaryInstruments: ['Santur (Dulcimer)', 'Tanbur', 'Daf Frame Drum'],
      ambientBed: 'High Alborz wind & crackling sacred brazier',
      stingerFreqHz: 293.66,
    },
    ashaOption: {
      id: 'choice-keyumars-asha',
      path: 'asha',
      title: 'Covenant of Soroush & Sacred Order',
      persianTag: 'راه اَشَه — پیمان سروش',
      description:
        'Sanctify the mountain passes with watch-fires of justice. Arm the guardians without enslaving the wild beasts, preserving the harmony of creation.',
      consequenceSummary: '+25 Asha Alignment · +15 Iranshahr Stability · Unlocks Sun-Lotus Parry Aura',
      alignmentDelta: 25,
      stabilityDelta: 15,
      farrDelta: 1,
      combatBlessingName: 'Farr-e Soroush (Aegis of Light)',
      combatBlessingEffect: 'Reduces incoming Div damage by 20% and empowers [Q] Flint-Parry counter-waves.',
      attackPowerMultiplier: 1.15,
      lifestealOnKill: 0,
      sacredFireGuard: true,
    },
    ahrimanOption: {
      id: 'choice-keyumars-ahriman',
      path: 'ahriman',
      title: 'Edict of Blood & Iron Fang',
      persianTag: 'راه اهریمن — فرمان خون و آهن',
      description:
        'Bind the mountain predators in iron chains and sacrifice captive scouts upon the black crags to drink their ferocity before the Divs strike.',
      consequenceSummary: '-25 Ahriman Alignment · -10 Iranshahr Stability · +35% Strike Lethality & Lifesteal',
      alignmentDelta: -25,
      stabilityDelta: -10,
      farrDelta: 0,
      combatBlessingName: 'Khashm-e Alborz (Fang of Dread)',
      combatBlessingEffect: 'Increases melee & mythic strike damage by 35% and drains vitality on every kill.',
      attackPowerMultiplier: 1.35,
      lifestealOnKill: 8,
      sacredFireGuard: false,
    },
  },
  {
    id: 'crossroads-2-siamak-gorge',
    epochIndex: 1,
    versionRequired: '1.0.0',
    epochLabel: 'Epoch II · The First Martyrdom',
    title: 'Siamak at the Obsidian Defile',
    location: 'The Gorge of Cloven Stone, Border of Mazandaran',
    portraitId: 'siamak',
    ferdowsiCouplet: {
      english: [
        'Young Siamak rode forth without mail of steel,',
        'To test what dark venom the Black Div’s claws conceal.',
      ],
      transliteration: 'سیامک بیامد برهنه تنا / بیاویخت با پور اهریمنا',
    },
    narrativeProse: [
      'The vanguard has fallen, but Div-e Siah himself stalks the Obsidian Defile with a host of iron-horned Poulad-Divs and sorcerers. Prince Siamak, beloved heir of Keyumars, leads the royal host to the narrow pass.',
      'Captured Mazandaran warlocks offer a forbidden pact: they will betray the Black Div’s ambush positions if Siamak spares their dark altars and permits blood-tribute in the border villages.',
    ],
    audioMetadata: {
      scaleMode: 'Homayoun (Tragic)',
      primaryInstruments: ['Kamancheh (Bowed Spike Fiddle)', 'Deep Naghara Kettle Drum'],
      ambientBed: 'Echoing ravine thunder & distant war-horns',
      stingerFreqHz: 220.0,
    },
    ashaOption: {
      id: 'choice-siamak-asha',
      path: 'asha',
      title: 'Shatter the Dark Altars & Stand in Truth',
      persianTag: 'راه اَشَه — شکستن محراب جادو',
      description:
        'Refuse the sorcerers’ tainted bargain. Cast down their idols and face the Black Div’s ambush with unblemished honor to shield the border folk.',
      consequenceSummary: '+30 Asha Alignment · +15 Iranshahr Stability · +1 Max Farr Vessel',
      alignmentDelta: 30,
      stabilityDelta: 15,
      farrDelta: 1,
      combatBlessingName: 'Oath of Pure Blood',
      combatBlessingEffect: 'Grants +1 Max Farr Vitality Vessel and rapid Mythic Energy regeneration.',
      attackPowerMultiplier: 1.2,
      lifestealOnKill: 0,
      sacredFireGuard: true,
    },
    ahrimanOption: {
      id: 'choice-siamak-ahriman',
      path: 'ahriman',
      title: 'Accept the Warlocks’ Blood Pact',
      persianTag: 'راه اهریمن — پیمان جادوگران مازندران',
      description:
        'Surrender the border hamlets to the sorcerers’ tribute and infuse your shamshir with Mazandaran shadow-venom to slaughter the demon host.',
      consequenceSummary: '-30 Ahriman Alignment · -15 Iranshahr Stability · +45% Venomous Cleave & Life Drain',
      alignmentDelta: -30,
      stabilityDelta: -15,
      farrDelta: 0,
      combatBlessingName: 'Venom of Mazandaran',
      combatBlessingEffect: 'Inflicts massive shadow-cleave damage (+45%) and restores 12 HP per vanquished foe.',
      attackPowerMultiplier: 1.45,
      lifestealOnKill: 12,
      sacredFireGuard: false,
    },
  },
  {
    id: 'crossroads-3-hushang-sadeh',
    epochIndex: 2,
    versionRequired: '1.1.0',
    epochLabel: 'Epoch III (v1.1 Hushang) · Discovery of Sacred Fire & Iron',
    title: 'Hushang, The Sadeh Spark & The Forge of War',
    location: 'The Crags of Sadeh, Before the Citadel of Div-e Siah',
    portraitId: 'hushang',
    ferdowsiCouplet: {
      english: [
        'Flint struck upon flint where the dark serpent fled,',
        'And from the cold mountain the Sacred Fire spread.',
      ],
      transliteration: 'بشد سنگ با سنگ و آتش بجست / فروغی پدید آمد از هر دو دست',
    },
    narrativeProse: [
      'Version 1.1 enters the reign of Shah Hushang, son of Siamak. Hurling a mountain flint stone [Key Q] at a smoking black rock-serpent, Hushang strikes the first terrestrial spark—founding the Feast of Sadeh and extracting molten iron from raw stone (`آهنگری هوشنگ`).',
      'Now the Div legions wear obsidian talismans that resist ordinary bronze. Only by shattering their posture with Flint-Fire Counters [Q] and binding them with Div-Band Finishers [F] can Div-e Siah be overthrown. How shall Hushang consecrate the Sadeh Forge?',
    ],
    audioMetadata: {
      scaleMode: 'Dastgah-e Shur (Minor Modal)',
      primaryInstruments: ['Santur', 'Sororna Horn', 'Daf & Blacksmith Anvil Chime'],
      ambientBed: 'Roaring Sadeh bonfire, anvil hammer strikes & clashing blades',
      stingerFreqHz: 329.63,
    },
    ashaOption: {
      id: 'choice-hushang-asha',
      path: 'asha',
      title: 'Consecrate the Flame of Sadeh (Light & Iron Plows)',
      persianTag: 'راه اَشَه — جشن سده، آهنگری و دادگری',
      description:
        'Dedicate the divine spark to Ahura’s order. Temper righteous steel to shatter Div talismans [Q] while channeling the mountain rivers to nourish the seven climes.',
      consequenceSummary: '+35 Asha Alignment · +20 Stability · Empowers [Q] Sadeh Flint Parry & [F] Purification',
      alignmentDelta: 35,
      stabilityDelta: 20,
      farrDelta: 1,
      combatBlessingName: 'Atash-e Sadeh (Sacred Forge of Hushang)',
      combatBlessingEffect: 'Doubles [Q] Flint-Fire posture shatter and heals +12 HP on every [F] Div-Band Finisher.',
      attackPowerMultiplier: 1.32,
      lifestealOnKill: 5,
      sacredFireGuard: true,
    },
    ahrimanOption: {
      id: 'choice-hushang-ahriman',
      path: 'ahriman',
      title: 'Forge the Hellfire Anvil of Vengeance (Dominion)',
      persianTag: 'راه اهریمن — کوره دوزخ و انتقام خون سیامک',
      description:
        'Feed the Sadeh furnaces with the bones of captive Divs. Smelt black-iron executioner blades that detonate bound demons in a storm of ash and terror.',
      consequenceSummary: '-35 Ahriman Alignment · -20 Stability · +60% Strike Might & Explosive [F] Blood Finisher',
      alignmentDelta: -35,
      stabilityDelta: -20,
      farrDelta: 0,
      combatBlessingName: 'Kureh-ye Duzakh (Hellfire Anvil)',
      combatBlessingEffect: 'Unlocks +60% weapon lethality and causes [F] Div-Band Finishers to detonate nearby foes.',
      attackPowerMultiplier: 1.6,
      lifestealOnKill: 16,
      sacredFireGuard: false,
    },
  },
  {
    id: 'crossroads-4-tahmuras-divband',
    epochIndex: 3,
    versionRequired: '1.2.0',
    epochLabel: 'Epoch IV (v1.2 Expansion) · Tahmuras the Demon-Binder',
    title: 'Tahmuras & The Secret of Thirty Scripts',
    location: 'The Chained Court of Alborz & Babylon',
    portraitId: 'soroush',
    ferdowsiCouplet: {
      english: [
        'Two-thirds of the demons by clubs he laid low,',
        'And bound the remainder with lassos of woe.',
      ],
      transliteration: 'وزیشان دو بهره به افسون ببست / دگرشان به گرز گران کرد پست',
    },
    narrativeProse: [
      'In Version 1.2, Shah Tahmuras (Divband) rides into battle wielding the enchanted lasso (`کمند دیوبند`) and the heavy ox-headed mace. When the Seven Demon Chieftains are staggered and bound [Key F], they plead for mercy, offering to teach humanity the art of writing in thirty scripts—Pahlavi, Sogdian, Persian, and Greek.',
    ],
    audioMetadata: {
      scaleMode: 'Dastgah-e Chahargah (Heroic)',
      primaryInstruments: ['Santur', 'Barbat Lute', 'Daf'],
      ambientBed: 'Clinking bronze chains & rustling parchment scrolls',
      stingerFreqHz: 349.23,
    },
    ashaOption: {
      id: 'choice-tahmuras-asha',
      path: 'asha',
      title: 'Spare the Bound Divs & Illuminate Mankind',
      persianTag: 'راه اَشَه — بخشایش و آموزش سی خط',
      description:
        'Accept their covenant under the gaze of Asha. Spare the bound captives so scribes may record law, medicine, and poetry for all generations.',
      consequenceSummary: '+30 Asha Alignment · +25 Iranshahr Stability · +1 Max Farr Vessel',
      alignmentDelta: 30,
      stabilityDelta: 25,
      farrDelta: 1,
      combatBlessingName: 'Decree of the Thirty Scripts',
      combatBlessingEffect: 'Empowers [F] Div-Band chains with golden runes (+40% damage & sacred barrier).',
      attackPowerMultiplier: 1.4,
      lifestealOnKill: 6,
      sacredFireGuard: true,
    },
    ahrimanOption: {
      id: 'choice-tahmuras-ahriman',
      path: 'ahriman',
      title: 'Extract the Sorcery & Crush Their Skulls',
      persianTag: 'راه اهریمن — طلسم سیاه و مرگ دیوان',
      description:
        'Tear the grimoires of dark sorcery from their minds, then break your royal word and execute every bound captive with the iron mace.',
      consequenceSummary: '-30 Ahriman Alignment · -15 Iranshahr Stability · +70% Executioner Might',
      alignmentDelta: -30,
      stabilityDelta: -15,
      farrDelta: 0,
      combatBlessingName: 'Mace of the Oathbreaker',
      combatBlessingEffect: 'Devastating +70% weapon damage and 20 HP siphon per kill.',
      attackPowerMultiplier: 1.7,
      lifestealOnKill: 20,
      sacredFireGuard: false,
    },
  },
  {
    id: 'crossroads-5-jamshid-zahhak',
    epochIndex: 4,
    versionRequired: '2.0.0',
    epochLabel: 'Epoch V (v2.0 Expansion) · The Serpent-Throne & Derafsh Kaviani',
    title: 'Fall of Jamshid & Uprising of Kaveh the Blacksmith',
    location: 'The Serpent Citadel of Biwarasp Zahhak',
    portraitId: 'div_siah',
    ferdowsiCouplet: {
      english: [
        'From his leather apron a banner he made,',
        'And called forth the righteous with hammer and blade.',
      ],
      transliteration: 'فریدون فرخ فرشته نبود / ز مشک و ز عنبر سرشته نبود',
    },
    narrativeProse: [
      'In Version 2.0, after Shah Jamshid’s pride cost him the Royal Farr, the tyrant Zahhak—bearing twin black serpents upon his shoulders from the kiss of Iblis—has ruled for a thousand dark years, feeding his serpents the brains of Iranian youths.',
      'Now Kaveh the Blacksmith raises his leather smithing apron upon a spear as the Derafsh Kaviani, marching alongside young Prince Fereydun to storm Zahhak’s citadel!',
    ],
    audioMetadata: {
      scaleMode: 'Dastgah-e Chahargah (Heroic)',
      primaryInstruments: ['Karnay War-Horn', 'Santur', 'Heavy Naghara Drums'],
      ambientBed: 'Roaring crowd uprising, blacksmith hammers & hissing serpents',
      stingerFreqHz: 392.0,
    },
    ashaOption: {
      id: 'choice-kaveh-asha',
      path: 'asha',
      title: 'Raise the Derafsh Kaviani & Chain Zahhak in Damavand',
      persianTag: 'راه اَشَه — درفش کاویانی و داد فریدون',
      description:
        'Heed the angel Soroush’s command: strike Zahhak down with the ox-headed mace (`گرز گاوسار`) and bind him alive within Mount Damavand so his blood does not poison the earth.',
      consequenceSummary: '+40 Asha Alignment · +30 Iranshahr Stability · +1 Max Farr Vessel',
      alignmentDelta: 40,
      stabilityDelta: 30,
      farrDelta: 1,
      combatBlessingName: 'Derafsh Kaviani (Banner of Liberation)',
      combatBlessingEffect: 'Grants +45% righteous strike power, 20% damage reduction, and continuous Farr recovery.',
      attackPowerMultiplier: 1.45,
      lifestealOnKill: 8,
      sacredFireGuard: true,
    },
    ahrimanOption: {
      id: 'choice-kaveh-ahriman',
      path: 'ahriman',
      title: 'Claim the Serpent Crown & Spill the Tyrant’s Venom',
      persianTag: 'راه اهریمن — تاج ماردوش و انتقام خونین',
      description:
        'Slaughter Zahhak upon his own marble altar, bathe the palace in serpent-venom, and rule the seven climes through the dread of the twin serpents.',
      consequenceSummary: '-40 Ahriman Alignment · -25 Iranshahr Stability · +80% Serpent-Venom Might',
      alignmentDelta: -40,
      stabilityDelta: -25,
      farrDelta: 0,
      combatBlessingName: 'Crown of Biwarasp (Venom Sovereignty)',
      combatBlessingEffect: 'Unlocks +80% strike lethality and 24 HP blood-siphon on every kill.',
      attackPowerMultiplier: 1.8,
      lifestealOnKill: 24,
      sacredFireGuard: false,
    },
  },
];
