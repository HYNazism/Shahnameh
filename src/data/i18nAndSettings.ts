export type GameLanguage = 'fa' | 'fa_classical' | 'en';

export type QualityTier = 'low' | 'medium' | 'high' | 'ultra';
export type DifficultyTier = 'story' | 'balanced' | 'hard' | 'maximum';

export interface GameSettings {
  language: GameLanguage;
  qualityTier: QualityTier;
  particleDensityMultiplier: number; // 0.25 (کم) to 2.0 (حداکثر)
  cameraShakeIntensity: number; // 0.0 (خاموش) to 1.5 (حداکثر)
  hitstopScale: number; // 0.0 (خاموش) to 1.5 (حداکثر)
  miniatureOrnamentLevel: number; // 1 (کم) to 4 (حداکثر - نگارگری کامل تبریز)
  showDamageNumbers: boolean;
  masterVolume: number; // 0 to 100
  sfxVolume: number; // 0 to 100
  musicChimeVolume: number; // 0 to 100
  difficultyTier: DifficultyTier;
  enemyAggressionScale: number; // 0.7 (کم) to 1.5 (حداکثر)
  autoOpenDecreeOnEpoch: boolean;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  language: 'fa', // پیش‌فرض فارسی سلیس
  qualityTier: 'ultra',
  particleDensityMultiplier: 1.25,
  cameraShakeIntensity: 1.0,
  hitstopScale: 1.0,
  miniatureOrnamentLevel: 4,
  showDamageNumbers: true,
  masterVolume: 85,
  sfxVolume: 90,
  musicChimeVolume: 80,
  difficultyTier: 'balanced',
  enemyAggressionScale: 1.0,
  autoOpenDecreeOnEpoch: false,
};

export function applyQualityPreset(current: GameSettings, tier: QualityTier): GameSettings {
  if (tier === 'low') {
    return {
      ...current,
      qualityTier: 'low',
      particleDensityMultiplier: 0.25,
      cameraShakeIntensity: 0.2,
      hitstopScale: 0.5,
      miniatureOrnamentLevel: 1,
      showDamageNumbers: false,
    };
  }
  if (tier === 'medium') {
    return {
      ...current,
      qualityTier: 'medium',
      particleDensityMultiplier: 0.65,
      cameraShakeIntensity: 0.6,
      hitstopScale: 0.8,
      miniatureOrnamentLevel: 2,
      showDamageNumbers: true,
    };
  }
  if (tier === 'high') {
    return {
      ...current,
      qualityTier: 'high',
      particleDensityMultiplier: 1.0,
      cameraShakeIntensity: 1.0,
      hitstopScale: 1.0,
      miniatureOrnamentLevel: 3,
      showDamageNumbers: true,
    };
  }
  return {
    ...current,
    qualityTier: 'ultra',
    particleDensityMultiplier: 1.6,
    cameraShakeIntensity: 1.25,
    hitstopScale: 1.2,
    miniatureOrnamentLevel: 4,
    showDamageNumbers: true,
  };
}

export function applyDifficultyPreset(
  current: GameSettings,
  difficulty: DifficultyTier
): GameSettings {
  const scaleMap: Record<DifficultyTier, number> = {
    story: 0.7,
    balanced: 1.0,
    hard: 1.25,
    maximum: 1.5,
  };
  return {
    ...current,
    difficultyTier: difficulty,
    enemyAggressionScale: scaleMap[difficulty],
  };
}

export interface LocalizedChapterNarrative {
  epochIndex: number;
  epochTitle: string;
  rulerName: string;
  location: string;
  ferdowsiVerse: [string, string];
  fullShahnamehChronicle: string[];
  ashaChoiceTitle: string;
  ashaChoiceDesc: string;
  ashaBlessingName: string;
  ashaBlessingEffect: string;
  ahrimanChoiceTitle: string;
  ahrimanChoiceDesc: string;
  ahrimanBlessingName: string;
  ahrimanBlessingEffect: string;
}

export const PERSIAN_STORY_CHAPTERS: Record<
  'fa' | 'fa_classical',
  LocalizedChapterNarrative[]
> = {
  fa: [
    {
      epochIndex: 0,
      epochTitle: 'عصر اول · پادشاهی کیومرث و تخت پلنگینه البرز',
      rulerName: 'شاه کیومرث پیشدادی',
      location: 'چکاد کوه البرز، زیر گنبد لاجوردی آسمان',
      ferdowsiVerse: [
        'پژوهنده نامه باستان / که از پهلوانان زند داستان',
        'نخستین خدیوی که کشور گشود / سر پادشاهان کیومرث بود',
      ],
      fullShahnamehChronicle: [
        'بر پایه روایت حکیم ابوالقاسم فردوسی، نخستین کسی که آیین تاج و تخت را در جهان نهاد، کیومرث بود. او سی سال بر فراز کوه البرز فرمان راند، جامه‌ای از پوست پلنگ بر تن داشت و فره ایزدی چنان از سیمایش می‌تابید که دد و دام و آدمیان در برابرش رام و فروتن بودند.',
        'کیومرث را پسری بود به نام سیامک؛ جوانی دلیر، خردمند و روشندل که جان پدر به دیدار او زنده بود. در کل گیتی کسی را با کیومرث دشمنی نبود، جز اهریمن بدسگال که از شکوه تخت البرز به رشک افتاد و فرزندی مهیب همچون گرگی سترگ به نام «دیو سیاه» پروراند تا سپاه به جنگ کیومرث آورد.',
        'فرشته ایزدی، سروش خجسته، در جامه پلنگینه بر کیومرث فرود آمد و راز کمین دیو سیاه را فاش ساخت. اکنون نخستین دوراهی اخلاقی و شهریاری ایران‌شهر در برابر شماست:',
      ],
      ashaChoiceTitle: 'پیمان سروش و پاسداری از آیین داد (راه اَشَه)',
      ashaChoiceDesc:
        'آتش‌های دیده‌بانی را بر گذرگاه‌های البرز برافروزید و بدون به بند کشیدن جانوران کوهستان، با فره ایزدی و سپر روشنایی به پیشواز سپاه دیوان بروید.',
      ashaBlessingName: 'فره سروش (سپر روشنایی)',
      ashaBlessingEffect: '۲۰٪ کاهش آسیب دریافتی و تقویت موج ضدحمله سنگ آتشین سده [Q].',
      ahrimanChoiceTitle: 'فرمان خون و زنجیر آهنین (راه اهریمن)',
      ahrimanChoiceDesc:
        'درندگان البرز را در زنجیرهای پولادین ببندید و طلایه‌داران اسیر دیو را بر صخره‌های سیاه قربانی کنید تا هراس در دل سپاه مازندران بیفتد.',
      ahrimanBlessingName: 'خشم البرز (چنگال هراس)',
      ahrimanBlessingEffect: '۳۵٪ افزایش قدرت ضربه گرز و جذب ۸ واحد جان با هر دیوکشی.',
    },
    {
      epochIndex: 1,
      epochTitle: 'عصر دوم · رزم سیامک با دیو سیاه و نخستین سوگ شاهنامه',
      rulerName: 'شاهزاده سیامک',
      location: 'تنگه سنگ‌شکن، مرز کوهستان البرز و بیشه دیوان',
      ferdowsiVerse: [
        'سیامک بیامد برهنه تنا / بیاویخت با پور اهریمنا',
        'بزد چنگ وارونه دیو سیاه / دو تا اندر آورد بالای شاه',
      ],
      fullShahnamehChronicle: [
        'چون سیامک از کینه‌توزی دیو سیاه آگاه گشت، دلش از خشم به جوش آمد. او بی‌آنکه جوشن پولادین بر تن کند، چرم پلنگینه پوشید و پیشاپیش سپاه ایران به نبرد دیو شتافت.',
        'در تنگه تاریک، جادوگران مازندران پیمانی نهانی پیش نهادند: اگر سیامک محراب‌های تاریک آنان را ویران نسازد و باج خون در روستاهای مرزی را بپذیرد، کمینگاه دیو سیاه را لو خواهند داد.',
        'آیا سیامک با شرافت و پاکی با دیو سیاه روبه‌رو می‌شود، یا تیغ خود را به زهر جادوگران می‌آلاید؟',
      ],
      ashaChoiceTitle: 'درهم شکستن محراب جادو و پایداری در راستی (راه اَشَه)',
      ashaChoiceDesc:
        'پیمان آلوده جادوگران را رد کنید، بت‌های تاریک را بشکنید و با شرافت پهلوانی از مرزنشینان ایران‌شهر دفاع کنید.',
      ashaBlessingName: 'سوگند خون پاک سیامک',
      ashaBlessingEffect: 'افزایش ۱ ظرف فره ایزدی (جان بیشینه) و بازیابی سریع‌تر نیروی اسطوره‌ای.',
      ahrimanChoiceTitle: 'پذیرش پیمان خونین جادوگران (راه اهریمن)',
      ahrimanChoiceDesc:
        'باج روستاهای مرزی را به جادوگران واگذارید و شمشیر خود را به زهر سیاه مازندران آلوده سازید تا دیوان را درهم بدرید.',
      ahrimanBlessingName: 'زهر سیاه مازندران',
      ahrimanBlessingEffect: '۴۵٪ افزایش آسیب شمشیر و بازگردانی ۱۲ واحد جان با هر کشتن.',
    },
    {
      epochIndex: 2,
      epochTitle: 'عصر سوم (نسخه ۱.۱) · پادشاهی هوشنگ، پیدایش آتش سده و آهنگری',
      rulerName: 'شاه هوشنگ پیشدادی',
      location: 'صخره‌های آتش سده و کوره آهنگری، در برابر دژ دیو سیاه',
      ferdowsiVerse: [
        'بشد سنگ با سنگ و آتش بجست / فروغی پدید آمد از هر دو دست',
        'جهاندار پیش جهان‌آفرین / نیایش همی کرد و خواند آفرین',
      ],
      fullShahnamehChronicle: [
        'پس از شهادت سیامک، کیومرث و همه جانوران کوهستان یک سال در سوگ نشستند تا آنکه سروش پیام آورد که زمان خیزش فرارسیده است. هوشنگ، فرزند برومند سیامک، سپاهی از پری، پلنگ، شیر، گرگ و مرغان گرد آورد تا انتقام خون پدر را از دیو سیاه بستاند.',
        'در راه کوهستان، ماری سترگ و سیاه‌چشم با دود و زهر بر هوشنگ پدیدار شد. هوشنگ سنگی گران [کلید Q] برداشت و به سوی مار افکند؛ سنگ بر صخره دیگری فرود آمد و از برخورد دو سنگ، نخستین جرقه آتش در جهان پدیدار گشت! هوشنگ به شکرانه این فروغ ایزدی «جشن سده» را بنیان نهاد و با حرارت آتش، آهن را از دل سنگ بیرون کشید و هنر آهنگری را آغاز کرد.',
        'در این نسخه (v1.1)، شما می‌توانید با کلید [Q] سنگ آتشین سده را پرتاب کنید تا طلسم دیوان را بشکنید و ۴ آتشدان گوشه‌های میدان را شعله‌ور سازید، و با کلید [F] دیوان گیج‌شده را به کمند دیوبند بکشید!',
      ],
      ashaChoiceTitle: 'تقدیس آتش سده و ساخت گاوآهن و کاریز (راه اَشَه)',
      ashaChoiceDesc:
        'آتش سده را قبله روشنایی و داد قرار دهید؛ از آهن گداخته ابزار آبادانی و شمشیر دادگری بسازید و تنها دیو سیاه و ستمگران را کیفر دهید.',
      ashaBlessingName: 'آتش سده (کوره مقدس هوشنگ)',
      ashaBlessingEffect: 'شکستن دوبرابر سریع‌تر طلسم دیوان با [Q] و درمان ۱۲ جان با هر ضربه نهایی دیوبند [F].',
      ahrimanChoiceTitle: 'برافروختن دوزخ انتقام و ذوب تاج دیوان (راه اهریمن)',
      ahrimanChoiceDesc:
        'کوره‌های سده را با استخوان دیوان شکست‌خورده بسوزانید، بیشه‌های مازندران را به خاکستر کشید و با وحشت آهن و آتش فرمان برانید.',
      ahrimanBlessingName: 'کوره دوزخ هوشنگ',
      ahrimanBlessingEffect: '۶۰٪ افزایش قدرت ضربه و انفجار آتشین در هنگام اجرای ضربه نهایی دیوبند [F].',
    },
    {
      epochIndex: 3,
      epochTitle: 'عصر چهارم (نسخه ۱.۲) · طهمورث دیوبند و راز سی خط',
      rulerName: 'شاه طهمورث دیوبند',
      location: 'ایوان زنجیر و میدان رزم دیوان',
      ferdowsiVerse: [
        'وزیشان دو بهره به افسون ببست / دگرشان به گرز گران کرد پست',
        'نبشتن به خسرو بیاموختند / دلش را به دانش برافروختند',
      ],
      fullShahnamehChronicle: [
        'پس از هوشنگ، فرزندش طهمورث بر تخت نشست. او ریسیدن پشم، بافتن جامه و رام کردن باز و یوز را به مردمان آموخت و با دستور خردمندش «شیدسپ» راه پاکی در پیش گرفت.',
        'دیوان که از قدرت طهمورث به تنگ آمده بودند، انبوه شدند تا تخت او را واژگون سازند. طهمورث دو سوم ایشان را با گرز گران بر زمین کوفت و یک سوم دیگر را به کمند افسون [کلید F] در بند کشید. دیوانِ اسیر برای رهایی جان خود سوگند خوردند که اگر شاه امانشان دهد، رازی بزرگ را به او بیاموزند: هنر نوشتن به نزدیکِ سی خط گوناگون، از پهلوی و سغدی تا پارسی و رومی!',
      ],
      ashaChoiceTitle: 'بخشایش دیوانِ دربند و آموزش دانش نوشتن (راه اَشَه)',
      ashaChoiceDesc:
        'بر پیمان خود استوار بمانید و دیوانِ دربند را امان دهید تا دبیران ایران‌شهر هنر خط و دانش را برای آیندگان بنگارند.',
      ashaBlessingName: 'فرمان سی خط دانش',
      ashaBlessingEffect: 'تقویت کمند دیوبند [F] با کتیبه‌های زرین (+۴۰٪ قدرت ضربه و سپر نور).',
      ahrimanChoiceTitle: 'استخراج افسون سیاه و خرد کردن سر اسیران (راه اهریمن)',
      ahrimanChoiceDesc:
        'راز خطوط و طلسم‌ها را از ذهن دیوان بیرون بکشید و سپس پیمان شکسته، همگی را زیر گرز پولادین نابود سازید.',
      ahrimanBlessingName: 'گرز پیمان‌شکن',
      ahrimanBlessingEffect: '۷۰٪ افزایش ویرانگر قدرت سلاح و جذب ۲۰ جان با هر کشتن.',
    },
    {
      epochIndex: 4,
      epochTitle: 'عصر پنجم (نسخه ۲.۰) · جمشید، ضحاک ماردوش و قیام کاوه آهنگر',
      rulerName: 'کاوه آهنگر و فریدون فرخ',
      location: 'دژ ماران ضحاک و میدان درفش کاویانی',
      ferdowsiVerse: [
        'از آن چرم کآهنگران پشت پای / بپوشند هنگام زخم درای',
        'همی بر خروشید و فریاد خواند / جهان را سراسر سوی داد خواند',
      ],
      fullShahnamehChronicle: [
        'جمشید هفتصد سال در شکوه و داد پادشاهی کرد، طبقات جامعه را سامان داد، گوهرها را استخراج کرد و نوروز را بنیان نهاد؛ اما سرانجام غرور و خودبینی بر او چیره گشت و فره ایزدی از او گریخت. آنگاه ضحاک تازی که ابلیس بر شانه‌هایش بوسه زده و دو مار سیاه از کتف‌هایش روییده بود، بر ایران چیره شد.',
        'هزار سال شبِ تاریک بر ایران‌شهر گذشت و هر روز مغز دو جوان ایرانی خوراک ماران ضحاک می‌شد، تا آنکه کاوه آهنگر در بارگاه ضحاک خروش برآورد، محضر دروغین اژدهاک را درید و پیش‌بند چرمی آهنگری خود را بر سر نیزه کرد تا «درفش کاویانی» و قیام فریدون با گرز گاوسار آغاز شود!',
      ],
      ashaChoiceTitle: 'افراشتن درفش کاویانی و به بند کشیدن ضحاک در دماوند (راه اَشَه)',
      ashaChoiceDesc:
        'به فرمان سروش، ضحاک را با گرز گاوسار فروکوبید و در غار دماوند به زنجیر کشید تا خون اهریمنی‌اش خاک را نیالاید.',
      ashaBlessingName: 'درفش کاویانی (پرچم رهایی)',
      ashaBlessingEffect: '۴۵٪ افزایش قدرت ضربه، ۲۰٪ کاهش آسیب و بازیابی پیوسته فره ایزدی.',
      ahrimanChoiceTitle: 'تصاحب تاج ماردوش و ریختن زهر انتقام (راه اهریمن)',
      ahrimanChoiceDesc:
        'ضحاک را بر محراب خودش ذبح کنید و با نیروی تاریک دو مار، بر هفت کشور فرمانروایی آهنین برپا سازید.',
      ahrimanBlessingName: 'تاج بیوراسب (سلطه زهر)',
      ahrimanBlessingEffect: '۸۰٪ افزایش مرگبار قدرت ضربه و جذب ۲۴ واحد جان در هر کشتن.',
    },
  ],
  fa_classical: [],
};

// Mirror fa_classical to fa with classical headers
PERSIAN_STORY_CHAPTERS.fa_classical = PERSIAN_STORY_CHAPTERS.fa;

export interface UiDictionary {
  dir: 'rtl' | 'ltr';
  gameTitle: string;
  gameSubtitle: string;
  topKicker: string;
  heroIntro: string;
  startChronicleBtn: string;
  jumpToHushangBtn: string;
  versionManifestBtn: string;
  settingsBtn: string;
  controlHintLine: string;
  hudVitalityLabel: string;
  hudStabilityLabel: string;
  hudAlignmentLabel: string;
  hudRenownLabel: string;
  hudSadehFlintLabel: string;
  hudDivBandLabel: string;
  hudBraziersLabel: string;
  hudDecreeReadyBtn: string;
  hudChooseAshaBtn: string;
  hudChooseAhrimanBtn: string;
  hudEpochSelectLabel: string;
  stanceAsha: string;
  stanceAhriman: string;
  stanceBalance: string;
  pauseTitle: string;
  pauseSubtitle: string;
  resumeBtn: string;
  restartBtn: string;
  returnTitleBtn: string;
  fullStoryReaderBtn: string;
  settingsModalTitle: string;
  settingsModalSubtitle: string;
  qualitySectionTitle: string;
  audioSectionTitle: string;
  gameplaySectionTitle: string;
  languageSectionTitle: string;
  presetLow: string;
  presetMedium: string;
  presetHigh: string;
  presetUltra: string;
  diffStory: string;
  diffBalanced: string;
  diffHard: string;
  diffMax: string;
}

export const UI_DICTIONARY: Record<GameLanguage, UiDictionary> = {
  fa: {
    dir: 'rtl',
    gameTitle: 'شاهنامه: تاج خاکستر و نور',
    gameSubtitle: 'رزم‌نامه کیومرث، سیامک، هوشنگ، طهمورث و کاوه آهنگر',
    topKicker: 'حماسه تعاملی شاهنامه فردوسی · نسخه ۱.۱ (عصر هوشنگ و رزم دیوبند)',
    heroIntro:
      'بر تخت پلنگینه البرز بنشینید. از طلوع پادشاهی کیومرث تا کشف آتش سده به دست هوشنگ و خیزش درفش کاویانی، هر فرمان شاهانه و هر ضربه گرز، سرنوشت ایران‌شهر را میان فروغ «اَشَه» و تاریکی «اهریمن» رقم می‌زند.',
    startChronicleBtn: 'آغاز حماسه از کیومرث',
    jumpToHushangBtn: 'ورود به عصر هوشنگ (نسخه ۱.۱)',
    versionManifestBtn: 'مانیفست نسخه و ارتقا',
    settingsBtn: 'تنظیمات کامل بازی',
    controlHintLine:
      'WASD حرکت · Space ضربه گرز · Q سنگ آتشین سده (دفع/افروختن) · F کمند دیوبند · Shift جهش · E نیروی اسطوره‌ای · O تنظیمات',
    hudVitalityLabel: 'فره ایزدی · جان پهلوان',
    hudStabilityLabel: 'ثبات ایران‌شهر',
    hudAlignmentLabel: 'تراز اخلاقی',
    hudRenownLabel: 'فر و نام‌آوری',
    hudSadehFlintLabel: '[Q] سنگ سده',
    hudDivBandLabel: '[F] کمند دیوبند',
    hudBraziersLabel: 'آتشدان سده',
    hudDecreeReadyBtn: 'طومار روایت و فرمان شاهی [C]',
    hudChooseAshaBtn: '[1] راه اَشَه (داد و روشنایی)',
    hudChooseAhrimanBtn: '[2] راه اهریمن (قدرت و خون)',
    hudEpochSelectLabel: 'انتخاب عصر:',
    stanceAsha: 'راه اَشَه (روشنایی)',
    stanceAhriman: 'راه اهریمن (تاریکی)',
    stanceBalance: 'تراز سپیده‌دم',
    pauseTitle: 'دیوان شاهی البرز (توقف بازی)',
    pauseSubtitle: '«نماند به کس جاودان تاج و گاه / بماند سخن جاودان یادگار»',
    resumeBtn: 'ادامه نبرد و روایت',
    restartBtn: 'آغاز دوباره این عصر',
    returnTitleBtn: 'بازگشت به صفحه نخست',
    fullStoryReaderBtn: 'طومار کامل شاهنامه [C]',
    settingsModalTitle: 'تنظیمات جزئیات، گرافیک، صدا و زبان (از کم تا حداکثر)',
    settingsModalSubtitle:
      'تنظیم دقیق کیفیت نگارگری ایرانی، ذرات طلاکوب، لرزش دوربین، درجه سختی دیوان و زبان روایت',
    qualitySectionTitle: '۱. کیفیت گرافیک و جزئیات نگارگری (کم تا حداکثر)',
    audioSectionTitle: '۲. تنظیمات صدا و موسیقی مقامی سنتور و دف',
    gameplaySectionTitle: '۳. درجه سختی و مکانیک‌های جنگ با دیوان',
    languageSectionTitle: '۴. زبان بازی و سبک روایت شاهنامه',
    presetLow: 'کم (ساده)',
    presetMedium: 'متوسط',
    presetHigh: 'زیاد',
    presetUltra: 'حداکثر (نگارگری سلطنتی)',
    diffStory: 'داستانی (آسان)',
    diffBalanced: 'متعادل (پهلوانی)',
    diffHard: 'دشوار (رزم‌آوران)',
    diffMax: 'حداکثر (کابوس اهریمن)',
  },
  fa_classical: {
    dir: 'rtl',
    gameTitle: 'شاهنامه فردوسی: فره و اهریمن',
    gameSubtitle: 'طومار نقالی پیشدادیان از کیومرث تا درفش کاویانی',
    topKicker: 'طومار نقالی شاهنامه · نسخه ۱.۱ (آتش سده و کمند دیوبند)',
    heroIntro:
      'بشنو از فردوسی پاک‌زاد؛ از روزگار کیومرث بر کوه البرز تا سنگ آتشین هوشنگ و کمند طهمورث دیوبند. کدامین راه را برمی‌گزینی: آیین داد و روشناییِ اَشَه، یا گرز خونین اهریمن؟',
    startChronicleBtn: 'گشودن طومار از کیومرث',
    jumpToHushangBtn: 'آغاز از رزم هوشنگ (v1.1)',
    versionManifestBtn: 'کارنامه نسخه‌ها',
    settingsBtn: 'آرایش و تنظیمات',
    controlHintLine:
      'WASD خرامیدن · Space گرز و شمشیر · Q سنگ آتشین سده · F کمند دیوبند · Shift گریز · E خروش اسطوره‌ای · O تنظیمات',
    hudVitalityLabel: 'فره کیانی · توش و توان',
    hudStabilityLabel: 'آبادانی ایران‌شهر',
    hudAlignmentLabel: 'گوهر درون',
    hudRenownLabel: 'نام و ننگ',
    hudSadehFlintLabel: '[Q] سنگ آتشین',
    hudDivBandLabel: '[F] کمند دیوبند',
    hudBraziersLabel: 'آتشدان سده',
    hudDecreeReadyBtn: 'گشودن طومار شاهنامه [C]',
    hudChooseAshaBtn: '[1] آیین اَشَه',
    hudChooseAhrimanBtn: '[2] آیین اهریمن',
    hudEpochSelectLabel: 'گذر به عصر:',
    stanceAsha: 'فروغ اَشَه',
    stanceAhriman: 'کین اهریمن',
    stanceBalance: 'میانه راز',
    pauseTitle: 'درنگ در ایوان البرز',
    pauseSubtitle: '«فریدون فرخ فرشته نبود / ز مشک و ز عنبر سرشته نبود؛ به داد و دهش یافت آن نیکویی»',
    resumeBtn: 'بازگشت به رزمگاه',
    restartBtn: 'نوسازی این نبرد',
    returnTitleBtn: 'سرآغاز نامه',
    fullStoryReaderBtn: 'طومار نقالی شاهنامه [C]',
    settingsModalTitle: 'آرایش نگارگری، خنیاگری و دشواری رزم (کم تا حداکثر)',
    settingsModalSubtitle: 'فرمان بر جزئیات نقش‌مایه‌های تبریز و هرات، نوای سنتور و تندخویی دیوان',
    qualitySectionTitle: '۱. پایه نگارگری و ذرات زرین (کم تا حداکثر)',
    audioSectionTitle: '۲. خنیاگری، سنتور و کوبش دف',
    gameplaySectionTitle: '۳. دشواری کارزار با دیوان',
    languageSectionTitle: '۴. زبان و شیوه سخن',
    presetLow: 'کمینه',
    presetMedium: 'میانه',
    presetHigh: 'برتر',
    presetUltra: 'حداکثر (زرنگار شاهی)',
    diffStory: 'رام (نقالی)',
    diffBalanced: 'همتراز (پهلوانی)',
    diffHard: 'سهمگین',
    diffMax: 'حداکثر (رستاخیز دیوان)',
  },
  en: {
    dir: 'ltr',
    gameTitle: 'SHAHNAMEH: CROWN OF ASHES & LIGHT',
    gameSubtitle: 'Chronicles of Keyumars, Siamak, Hushang, Tahmuras & Kaveh',
    topKicker: 'Ferdowsi’s Shahnameh Interactive Chronicle · Build v1.1.0 (Era of Hushang)',
    heroIntro:
      'Ascend the Leopard-Throne of Mount Alborz. From Keyumars to Hushang’s Sadeh Fire and Kaveh’s uprising, every decree and battle strike tips the scales between the sacred flame of Asha and the blood dominion of Ahriman.',
    startChronicleBtn: 'Start Chronicle (Epoch I)',
    jumpToHushangBtn: 'Enter Era of Hushang (v1.1)',
    versionManifestBtn: 'Version Manifest (v1.1.0)',
    settingsBtn: 'Detailed Settings',
    controlHintLine:
      'WASD Move · Space Strike · Q Sadeh Flint Parry · F Div-Band Finisher · Shift Dash · E Mythic Art · O Settings',
    hudVitalityLabel: 'ROYAL FARR · VITALITY',
    hudStabilityLabel: 'STABILITY',
    hudAlignmentLabel: 'ALIGNMENT',
    hudRenownLabel: 'CHRONICLE RENOWN',
    hudSadehFlintLabel: '[Q] Sadeh Flint',
    hudDivBandLabel: '[F] Div-Band',
    hudBraziersLabel: 'Sadeh Braziers',
    hudDecreeReadyBtn: 'Shahnameh Decree & Lore [C]',
    hudChooseAshaBtn: '[1] Path of Asha',
    hudChooseAhrimanBtn: '[2] Path of Ahriman',
    hudEpochSelectLabel: 'Epoch:',
    stanceAsha: 'Path of Asha (Light)',
    stanceAhriman: 'Path of Ahriman (Dark)',
    stanceBalance: 'Twilight Balance',
    pauseTitle: 'Royal Diwan of Alborz',
    pauseSubtitle: '“Neither the crown of gold nor the dark demon’s fang escapes the ledger of time.”',
    resumeBtn: 'Resume Chronicle',
    restartBtn: 'Restart Epoch',
    returnTitleBtn: 'Return to Title',
    fullStoryReaderBtn: 'Full Shahnameh Scroll [C]',
    settingsModalTitle: 'Detailed Settings: Graphics, Audio, Difficulty & Language (Low to Max)',
    settingsModalSubtitle:
      'Customize Persian miniature ornamentation, particle density, camera shake, Div aggression, and language',
    qualitySectionTitle: '1. Graphics & Miniature Detail (Low to Maximum)',
    audioSectionTitle: '2. Modal Audio & Percussion Synthesis',
    gameplaySectionTitle: '3. Combat Difficulty & Div Aggression',
    languageSectionTitle: '4. Language & Narrative Register',
    presetLow: 'Low',
    presetMedium: 'Medium',
    presetHigh: 'High',
    presetUltra: 'Maximum (Royal Miniature)',
    diffStory: 'Story (Easy)',
    diffBalanced: 'Balanced',
    diffHard: 'Hard',
    diffMax: 'Maximum (Ahrimanic)',
  },
};
