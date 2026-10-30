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
  epochIndex: number; // 0..11 (12 Complete Shahnameh Epochs from Keyumars to Ferdowsi's Finale)
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
      title: 'Raise the Derafsh Kaviani & Liberate the Captives',
      persianTag: 'راه اَشَه — درفش کاویانی و داد فریدون',
      description:
        'Adorn Kaveh’s leather apron with gold and jewels as the national banner of justice, freeing the imprisoned youths before marching on the palace.',
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
        'Burn the royal quarters to ash, bathe the marble halls in serpent-venom, and rule the seven climes through the dread of the twin serpents.',
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
  {
    id: 'crossroads-6-fereydun-damavand',
    epochIndex: 5,
    versionRequired: '2.5.0',
    epochLabel: 'Epoch VI (v2.5 Expansion) · Fereydun & The Binding of Zahhak in Damavand',
    title: 'The Bull-Headed Mace & The Chasm of Mount Damavand',
    location: 'Volcanic Cavern of Mount Damavand, Above the Clouds',
    portraitId: 'hushang',
    ferdowsiCouplet: {
      english: [
        'Bring down the ox-mace and shatter his crown,',
        'Yet spill not his blood lest the world should drown.',
      ],
      transliteration: 'بیاورد ضحاک را چون نوند / به کوه دماوند کردش ببند',
    },
    narrativeProse: [
      'Shah Fereydun stands victorious over Biwarasp Zahhak, raising the Gorz-e Gavsar (Bull-Headed Mace) forged in memory of the sacred cow Barmayeh to crush the Serpent-King’s skull.',
      'At that moment, the angel Soroush stays Fereydun’s hand: if Zahhak’s black blood is spilled upon the earth, a plague of venomous scorpions and dark serpents will overrun Iranshahr; instead, he must be bound alive with heavy iron spikes deep inside Mount Damavand.',
    ],
    audioMetadata: {
      scaleMode: 'Dastgah-e Chahargah (Heroic)',
      primaryInstruments: ['Heavy Naghara', 'Santur', 'Sororna Brass Horn'],
      ambientBed: 'Volcanic sulfur vents of Damavand & echoing iron chains',
      stingerFreqHz: 415.3,
    },
    ashaOption: {
      id: 'choice-fereydun-asha',
      path: 'asha',
      title: 'Heed Soroush & Chain Zahhak Alive in Mount Damavand',
      persianTag: 'راه اَشَه — دربند کردن ضحاک در کوه دماوند',
      description:
        'Drive iron spikes through Zahhak’s fetters in the sunless abyss of Damavand, containing Ahriman’s curse and inaugurating the golden feast of Mehregan.',
      consequenceSummary: '+40 Asha Alignment · +25 Iranshahr Stability · +1 Max Farr Vessel',
      alignmentDelta: 40,
      stabilityDelta: 25,
      farrDelta: 1,
      combatBlessingName: 'Gorz-e Gavsar & Mehregan Seal',
      combatBlessingEffect: 'Increases mace cleave damage by 55%, reinforces armor by 20%, and empowers [F] chains.',
      attackPowerMultiplier: 1.55,
      lifestealOnKill: 10,
      sacredFireGuard: true,
    },
    ahrimanOption: {
      id: 'choice-fereydun-ahriman',
      path: 'ahriman',
      title: 'Defy Soroush & Decapitate Zahhak upon the Altar',
      persianTag: 'راه اهریمن — سر بریدن ضحاک و جذب زهر اژدهاک',
      description:
        'Shatter Zahhak’s skull and sever his twin serpents to temper your mace in dragon-blood, even as venomous ash rains over the valleys below.',
      consequenceSummary: '-45 Ahriman Alignment · -25 Iranshahr Stability · +90% Dragon-Blood Cleave',
      alignmentDelta: -45,
      stabilityDelta: -25,
      farrDelta: 0,
      combatBlessingName: 'Blood of Azhi Dahaka (Serpent Executioner)',
      combatBlessingEffect: 'Grants +90% brutal cleave damage and 26 HP arterial lifesteal on every kill.',
      attackPowerMultiplier: 1.9,
      lifestealOnKill: 26,
      sacredFireGuard: false,
    },
  },
  {
    id: 'crossroads-7-rostam-divesepid',
    epochIndex: 6,
    versionRequired: '2.5.0',
    epochLabel: 'Epoch VII (v2.5 Expansion) · Zal, Simurgh & Rostam’s Seven Labors (Haft Khan)',
    title: 'The Seventh Labor: Rostam in the Cavern of Div-e Sepid',
    location: 'The Pitch-Black Abyss of Haft-Kuh, Mazandaran',
    portraitId: 'keyumars',
    ferdowsiCouplet: {
      english: [
        'Like a mountain of snow with a millstone in hand,',
        'The White Demon roared through the darkened land.',
      ],
      transliteration: 'به تاریکی اندر یکی کوه دید / سراسر شده تیره و ناپدید',
    },
    narrativeProse: [
      'Born of white-haired Zal—who was raised in the nest of the sacred Simurgh—and Rudabeh of Kabul, Jahan-Pahlavan Rostam rides his immortal stallion Rakhsh across the Seven Labors (`هفت‌خوان رستم`) to rescue the blinded Shah Kay Kavus from Mazandaran.',
      'After slaying the Dragon, the Witch, and Arzhang Div, Rostam descends into the sunless cavern of Div-e Sepid (The White Demon). Only the fresh blood of Div-e Sepid’s heart can cure the blindness of the Iranian host, yet the demon’s sorcerers offer the whole treasury of Mazandaran if Rostam claims the throne for himself.',
    ],
    audioMetadata: {
      scaleMode: 'Dastgah-e Shur (Minor Modal)',
      primaryInstruments: ['Kamancheh', 'Karnay War-Horn', 'Thunderous Zarb & Daf'],
      ambientBed: 'Rakhsh war-neigh, Simurgh wing-gust & cavern roar',
      stingerFreqHz: 440.0,
    },
    ashaOption: {
      id: 'choice-rostam-asha',
      path: 'asha',
      title: 'Slay Div-e Sepid & Restore the Sight of Iran’s Host',
      persianTag: 'راه اَشَه — دریدن جگر دیو سفید و شفای چشم ایرانیان',
      description:
        'Wrestle Div-e Sepid in the dark cavern, sever his leg and tear out his heart-blood solely to heal Kay Kavus and the blinded champions of Iran.',
      consequenceSummary: '+45 Asha Alignment · +30 Iranshahr Stability · +1 Max Farr Vessel',
      alignmentDelta: 45,
      stabilityDelta: 30,
      farrDelta: 1,
      combatBlessingName: 'Babr-e Bayan & Feather of Simurgh',
      combatBlessingEffect: 'Grants +65% Pahlavan mace & blade might, 20% fire/poison ward, and +14 HP on [F] executions.',
      attackPowerMultiplier: 1.65,
      lifestealOnKill: 14,
      sacredFireGuard: true,
    },
    ahrimanOption: {
      id: 'choice-rostam-ahriman',
      path: 'ahriman',
      title: 'Wear the White Demon’s Skull-Helm & Usurp Mazandaran',
      persianTag: 'راه اهریمن — کلاهخود دیو سفید و سلطه بر مازندران',
      description:
        'Slaughter Div-e Sepid, bind his surviving demon legions to your personal banner, and leave Kay Kavus in chains while you rule as Warlord of the East.',
      consequenceSummary: '-45 Ahriman Alignment · -25 Iranshahr Stability · +105% Titan Cleave Might',
      alignmentDelta: -45,
      stabilityDelta: -25,
      farrDelta: 0,
      combatBlessingName: 'Wrath of Div-e Sepid (Warlord of Mazandaran)',
      combatBlessingEffect: 'Doubles weapon cleave lethality (+105%) and siphons 30 HP on every dismemberment kill.',
      attackPowerMultiplier: 2.05,
      lifestealOnKill: 30,
      sacredFireGuard: false,
    },
  },
  {
    id: 'crossroads-8-rostam-sohrab',
    epochIndex: 7,
    versionRequired: '3.0.0',
    epochLabel: 'Epoch VIII (v3.0) · The Tragedy of Rostam & Sohrab',
    title: 'Blood on the Oxus: The Armlet of Tahmineh & The Nushdaru',
    location: 'The Crimson Plain Between Iran and Turan',
    portraitId: 'siamak',
    ferdowsiCouplet: {
      english: [
        'When he opened his mail and beheld the bright stone,',
        'He tore at his armor and wept all alone.',
      ],
      transliteration: 'چو بگشاد خفتان و آن مهره دید / همه جامه بر خویشتن بردرید',
    },
    narrativeProse: [
      'In Version 3.0, young Sohrab—born of Rostam and Princess Tahmineh of Samangan—marches at the head of Turan’s host searching for his father, while crafty Afrasiab plots that father and son should slay each other unrecognized.',
      'After three days of earth-shaking single combat, Rostam drives his dagger into Sohrab’s chest, only to behold the onyx armlet (`مهره بازوبند`) bound beneath the youth’s mail! As Sohrab’s lifeblood ebbs on the dust, Kay Kavus withholds the royal Nushdaru elixir out of fear of father and son uniting.',
    ],
    audioMetadata: {
      scaleMode: 'Homayoun (Tragic)',
      primaryInstruments: ['Weeping Kamancheh', 'Ney Flute', 'Solemn Naghara Heartbeat'],
      ambientBed: 'Wind across the Oxus battlefield & mourning cries of Rakhsh',
      stingerFreqHz: 261.63,
    },
    ashaOption: {
      id: 'choice-sohrab-asha',
      path: 'asha',
      title: 'Honor Sohrab’s Dying Plea: Spare the Armies & Uphold Peace',
      persianTag: 'راه اَشَه — وصیت سهراب، بخشایش سپاهیان و صلح مرزها',
      description:
        'Fulfill Sohrab’s final words: forbid vengeance against the Turanian soldiers who trusted him, invoke the Simurgh’s grace, and preserve Iranshahr from civil war.',
      consequenceSummary: '+50 Asha Alignment · +35 Iranshahr Stability · Ultimate Pahlavan Redemption',
      alignmentDelta: 50,
      stabilityDelta: 35,
      farrDelta: 1,
      combatBlessingName: 'Oath of Tahmineh’s Armlet (Immortal Farr)',
      combatBlessingEffect: 'Grants +75% righteous strike power, sacred fire ward, and +18 HP restoration on [F] finishers.',
      attackPowerMultiplier: 1.75,
      lifestealOnKill: 18,
      sacredFireGuard: true,
    },
    ahrimanOption: {
      id: 'choice-sohrab-ahriman',
      path: 'ahriman',
      title: 'Storm Kavus’s Pavilion in Grief & Drown the Plain in Blood',
      persianTag: 'راه اهریمن — خشم رستم، تاراج پرده‌سرای کاووس و کشتار توران',
      description:
        'Unleash grief-stricken fury upon both Kay Kavus’s court and the Turanian host, seizing the Nushdaru by the sword and turning the Oxus river red.',
      consequenceSummary: '-50 Ahriman Alignment · -30 Iranshahr Stability · +125% Apocalypse Cleave',
      alignmentDelta: -50,
      stabilityDelta: -30,
      farrDelta: 0,
      combatBlessingName: 'Mourning Rage of Dastan (Apocalypse Mace)',
      combatBlessingEffect: 'Unlocks +125% devastating cleave damage and 35 HP blood-drain per kill.',
      attackPowerMultiplier: 2.25,
      lifestealOnKill: 35,
      sacredFireGuard: false,
    },
  },
  {
    id: 'crossroads-9-siyavash-kaykhosrow',
    epochIndex: 8,
    versionRequired: '4.0.0',
    epochLabel: 'Epoch IX (v4.0) · The Fire-Ordeal of Siyavash & Kay Khosrow’s Vengeance',
    title: 'Prince Siyavash in the Mountain of Fire & The Cup of Jam',
    location: 'The Twin Mountains of Golden Fire & Kang-Dezh in Turan',
    portraitId: 'soroush',
    ferdowsiCouplet: {
      english: [
        'On Shabrang he rode through the mountain of flame,',
        'Unscathed in white linen, untarnished in name.',
      ],
      transliteration: 'یکی کوه آتش به فرمان شاه / برافروختند از برِ چرخ و ماه',
    },
    narrativeProse: [
      'Falsely accused by Queen Sudabeh, noble Prince Siyavash wears a white tunic, mounts his black stallion Shabrang Behzad, and rides through two towering mountains of roaring fire—emerging untouched through the purity of his soul.',
      'Yet when Siyavash seeks refuge in Turan and builds Siyavashgard, treacherous Garsivaz and King Afrasiab shed his innocent blood in a golden basin, from which the plant Par-e Siyavashan springs. Now his son Shah Kay Khosrow marches with Rostam and Goudarz to overthrow Afrasiab!',
    ],
    audioMetadata: {
      scaleMode: 'Dastgah-e Chahargah (Heroic)',
      primaryInstruments: ['Santur', 'Ney', 'Imperial Karnay & Naghara'],
      ambientBed: 'Roaring sacred fire ordeal & galloping hooves of Shabrang',
      stingerFreqHz: 392.0,
    },
    ashaOption: {
      id: 'choice-siyavash-asha',
      path: 'asha',
      title: 'Judge Afrasiab Only & Spare the Innocent Folk of Turan',
      persianTag: 'راه اَشَه — دادگری کیخسرو، جام جم و پرهیز از ستم بر بی‌گناهان',
      description:
        'Follow Kay Khosrow’s sacred oath: gaze into the Cup of Jam, execute only Afrasiab and Garsivaz for Siyavash’s murder, and crown Piran’s kinsmen in peace.',
      consequenceSummary: '+50 Asha Alignment · +30 Iranshahr Stability · +1 Max Farr Vessel',
      alignmentDelta: 50,
      stabilityDelta: 30,
      farrDelta: 1,
      combatBlessingName: 'Purity of Siyavash & Jam-e Jam',
      combatBlessingEffect: 'Grants +85% sacred fire cleave, complete fire immunity, and +20 HP on [F] executions.',
      attackPowerMultiplier: 1.85,
      lifestealOnKill: 20,
      sacredFireGuard: true,
    },
    ahrimanOption: {
      id: 'choice-siyavash-ahriman',
      path: 'ahriman',
      title: 'Raze All Turan to Ash in Blood-Vengeance for Siyavash',
      persianTag: 'راه اهریمن — کین سیاوش و به آتش کشیدن شهرهای توران',
      description:
        'Let Rostam and Tus unleash total war across Turan, burning Kang-Dezh to the ground so that not a single brick remains standing.',
      consequenceSummary: '-50 Ahriman Alignment · -25 Iranshahr Stability · +140% Blood-Vengeance Might',
      alignmentDelta: -50,
      stabilityDelta: -25,
      farrDelta: 0,
      combatBlessingName: 'Kin-e Siyavash (Scorched Earth of Turan)',
      combatBlessingEffect: 'Unlocks +140% weapon lethality and 38 HP blood-siphon on every kill.',
      attackPowerMultiplier: 2.4,
      lifestealOnKill: 38,
      sacredFireGuard: false,
    },
  },
  {
    id: 'crossroads-10-rostam-esfandiyar',
    epochIndex: 9,
    versionRequired: '4.0.0',
    epochLabel: 'Epoch X (v4.0) · Rostam & Esfandiyar the Brazen-Bodied (Ruin-Tan)',
    title: 'The Double-Pronged Tamarisk Arrow of the Simurgh',
    location: 'The Banks of the Hirmand River, Zabulistan',
    portraitId: 'hushang',
    ferdowsiCouplet: {
      english: [
        'He drew the twin tamarisk shaft to his ear,',
        'And pierced the bright eyes that knew nothing of fear.',
      ],
      transliteration: 'بزد تیر بر چشم اسفندیار / سیه شد جهان پیش آن نامدار',
    },
    narrativeProse: [
      'Crown Prince Esfandiyar (`اسفندیار روئین‌تن`), whose body was rendered invulnerable to steel by sacred chains, has conquered the Haft Khan of Turan; yet his envious father Shah Goshtasp commands him to bring aged Jahan-Pahlavan Rostam to court in heavy chains.',
      'Pierced by Esfandiyar’s arrows, Rostam and Rakhsh retreat to Zabul. Zal burns the feather of the Simurgh: the celestial bird heals their wounds and guides Rostam to fashion a double-pronged arrow from the tamarisk tree (`تیر گز دوشاخه`), warning that whoever slays Esfandiyar shall know sorrow in this world and the next.',
    ],
    audioMetadata: {
      scaleMode: 'Homayoun (Tragic)',
      primaryInstruments: ['Kamancheh', 'Tanbur', 'Thunderous Zarb'],
      ambientBed: 'Wingbeats of Simurgh, blazing incense & bowstring tension',
      stingerFreqHz: 311.13,
    },
    ashaOption: {
      id: 'choice-esfandiyar-asha',
      path: 'asha',
      title: 'Weep Over Fallen Esfandiyar & Raise His Son Bahman in Honor',
      persianTag: 'راه اَشَه — سوگ اسفندیار و پرورش بهمن در زابلستان',
      description:
        'Shoot the tamarisk arrow only as a last resort to preserve freedom from chains, then fulfill Esfandiyar’s dying wish by raising young Prince Bahman as heir to Iran.',
      consequenceSummary: '+45 Asha Alignment · +25 Iranshahr Stability · +1 Max Farr Vessel',
      alignmentDelta: 45,
      stabilityDelta: 25,
      farrDelta: 1,
      combatBlessingName: 'Tir-e Gaz of Simurgh & Covenant of Bahman',
      combatBlessingEffect: 'Pierces all boss armor (+95% damage), empowers [Q] parry, and heals +22 HP on [F].',
      attackPowerMultiplier: 1.95,
      lifestealOnKill: 22,
      sacredFireGuard: true,
    },
    ahrimanOption: {
      id: 'choice-esfandiyar-ahriman',
      path: 'ahriman',
      title: 'Shatter the Brazen Prince & March on Goshtasp’s Throne',
      persianTag: 'راه اهریمن — کوری اسفندیار روئین‌تن و لشکرکشی به بلخ',
      description:
        'Drive the feathered tamarisk shaft deep into Esfandiyar’s eyes without remorse and send his headless armor back to Shah Goshtasp as a warning.',
      consequenceSummary: '-55 Ahriman Alignment · -30 Iranshahr Stability · +155% Armor-Piercing Might',
      alignmentDelta: -55,
      stabilityDelta: -30,
      farrDelta: 0,
      combatBlessingName: 'Curse of the Brazen Blood (Slayer of Princes)',
      combatBlessingEffect: 'Grants +155% armor-shattering damage and 42 HP siphon on every kill.',
      attackPowerMultiplier: 2.55,
      lifestealOnKill: 42,
      sacredFireGuard: false,
    },
  },
  {
    id: 'crossroads-11-rostam-shaghad',
    epochIndex: 10,
    versionRequired: '5.0.0',
    epochLabel: 'Epoch XI (v5.0) · The Pit of Shaghad & Rostam’s Final Arrow',
    title: 'Treachery in Kabul: The Spear-Pit & The Hollow Plane Tree',
    location: 'The Hunting Grounds of Kabulistan',
    portraitId: 'keyumars',
    ferdowsiCouplet: {
      english: [
        'He sewed tree and brother together as one,',
        'And thanked the Creator before life was done.',
      ],
      transliteration: 'درخت و برادر به هم بر بدوخت / به هنگام رفتن دلش برفروخت',
    },
    narrativeProse: [
      'For six hundred years Jahan-Pahlavan Rostam has guarded the throne of Iran. Yet his envious half-brother Shaghad conspires with the King of Kabul, digging deep hunting pits lined with poisoned spears and upward-pointing blades (`چاه شغاد`).',
      'Though faithful Rakhsh smells the upturned earth, Rostam urges him forward; both stallion and hero plunge into the spears. As false-hearted Shaghad mocks him from behind an ancient hollow plane tree (`درخت چنار`), bleeding Rostam asks for his bow and two arrows to keep wild beasts away until he dies.',
    ],
    audioMetadata: {
      scaleMode: 'Homayoun (Tragic)',
      primaryInstruments: ['Mournful Kamancheh', 'Deep Naghara', 'Santur Tremolo'],
      ambientBed: 'Rustling plane-tree leaves, Rakhsh’s last breath & bowstring twang',
      stingerFreqHz: 246.94,
    },
    ashaOption: {
      id: 'choice-shaghad-asha',
      path: 'asha',
      title: 'Pierce Shaghad Through the Plane Tree & Die Praising Yazdan',
      persianTag: 'راه اَشَه — دوختن شغاد به درخت چنار و نیایش واپسین تهمتن',
      description:
        'Draw the royal bow with your final strength, pin the traitor Shaghad through the thick trunk of the plane tree, and surrender your immortal soul to God in peace.',
      consequenceSummary: '+55 Asha Alignment · +30 Iranshahr Stability · Eternal Pahlavan Glory',
      alignmentDelta: 55,
      stabilityDelta: 30,
      farrDelta: 1,
      combatBlessingName: 'Final Arrow of Dastan (Immortal Soul of Zabul)',
      combatBlessingEffect: 'Grants +110% righteous strike power, sacred guard, and +25 HP on [F] finishers.',
      attackPowerMultiplier: 2.1,
      lifestealOnKill: 25,
      sacredFireGuard: true,
    },
    ahrimanOption: {
      id: 'choice-shaghad-ahriman',
      path: 'ahriman',
      title: 'Command Faramarz to Turn All Kabulistan into a Sea of Blood',
      persianTag: 'راه اهریمن — فرمان انتقام به فرامرز و نابودی کابلستان',
      description:
        'Impale Shaghad to the tree and swear a dying blood-oath that your son Faramarz shall flay the King of Kabul and burn forty cities to ash.',
      consequenceSummary: '-55 Ahriman Alignment · -30 Iranshahr Stability · +175% Vengeance of Zabul',
      alignmentDelta: -55,
      stabilityDelta: -30,
      farrDelta: 0,
      combatBlessingName: 'Ashes of Kabul (Wrath of Faramarz)',
      combatBlessingEffect: 'Unlocks +175% catastrophic cleave damage and 48 HP blood-drain per kill.',
      attackPowerMultiplier: 2.75,
      lifestealOnKill: 48,
      sacredFireGuard: false,
    },
  },
  {
    id: 'crossroads-12-ferdowsi-finale',
    epochIndex: 11,
    versionRequired: '5.0.0',
    epochLabel: 'Epoch XII (v5.0 Grand Finale) · Rostam Farrokhzad & Ferdowsi’s Immortal Palace of Verse',
    title: 'The Last Stand of Ctesiphon & The Edifice Higher Than Wind and Rain',
    location: 'From the Arch of Kasra (Ctesiphon) to the Gardens of Tus',
    portraitId: 'soroush',
    ferdowsiCouplet: {
      english: [
        'I raised up from verse a high palace of gold,',
        'That neither the wind nor the rain shall make old.',
      ],
      transliteration: 'پی افکندم از نظم کاخی بلند / که از باد و باران نیابد گزند',
    },
    narrativeProse: [
      'Centuries pass across the historical ages of the Shahnameh—from Ardashir Babakan, Bahram Gur, and the wisdom of Khosrow Anushiravan the Just and Bozorgmehr, down to the fateful twilight of the Sassanian Empire.',
      'Before the final battle at Qadisiyyah, general Rostam Farrokhzad writes his prophetic lament to his brother, standing beneath the Derafsh Kaviani to the last breath. Yet when thrones turn to dust, Hakim Abolqasem Ferdowsi spends thirty years of his life forging sixty thousand couplets—turning the soul of Iranshahr into an indestructible palace of Persian verse (`بسی رنج بردم در این سال سی / عجم زنده کردم بدین پارسی`)!',
    ],
    audioMetadata: {
      scaleMode: 'Dastgah-e Chahargah (Heroic)',
      primaryInstruments: ['Full Symphonic Santur', 'Kamancheh', 'Karnay & Daf Finale'],
      ambientBed: 'Wind over the Arch of Kasra & eternal chime of Tus',
      stingerFreqHz: 523.25,
    },
    ashaOption: {
      id: 'choice-finale-asha',
      path: 'asha',
      title: 'Consecrate Ferdowsi’s Immortal Palace of Verse & Wisdom',
      persianTag: 'راه اَشَه — کاخ بلند نظم فردوسی و جاودانگی زبان پارسی و داد',
      description:
        'Transcend the fall of earthly crowns: seal the chronicle in wisdom, justice, and the immortal Persian tongue so that Iranshahr lives forever in the hearts of humanity.',
      consequenceSummary: '+65 Asha Alignment · +40 Iranshahr Stability · Unlocks True Immortal Ending',
      alignmentDelta: 65,
      stabilityDelta: 40,
      farrDelta: 2,
      combatBlessingName: 'Kakh-e Boland-e Nazm (Immortal Farr of Ferdowsi)',
      combatBlessingEffect: 'Ultimate +135% righteous power, sacred fire invulnerability aura, and +30 HP on [F].',
      attackPowerMultiplier: 2.35,
      lifestealOnKill: 30,
      sacredFireGuard: true,
    },
    ahrimanOption: {
      id: 'choice-finale-ahriman',
      path: 'ahriman',
      title: 'Wage the Eternal Apocalypse Beneath the Blood-Stained Derafsh',
      persianTag: 'راه اهریمن — نبرد بی‌پایان خون و آهن در پای درفش کاویانی',
      description:
        'Reject the passing of ages: command the immortal phantom legions of Pishdad and Kayan to wage an unending war of iron and fire across the seven climes.',
      consequenceSummary: '-65 Ahriman Alignment · -35 Iranshahr Stability · +200% Eternal Warlord Might',
      alignmentDelta: -65,
      stabilityDelta: -35,
      farrDelta: 0,
      combatBlessingName: 'Eternal Eclipse of Qadisiyyah (Iron Apocalypse)',
      combatBlessingEffect: 'Triples weapon lethality (+200%) and drains 55 HP on every kill.',
      attackPowerMultiplier: 3.0,
      lifestealOnKill: 55,
      sacredFireGuard: false,
    },
  },
];
