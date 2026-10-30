export type GameLanguage = 'fa' | 'fa_classical' | 'en';

export type QualityTier = 'low' | 'medium' | 'high' | 'ultra';
export type DifficultyTier = 'story' | 'balanced' | 'hard' | 'maximum';
export type RenderDimension = '3d_gore' | '2d_miniature';

export interface GameSettings {
  language: GameLanguage;
  renderDimension: RenderDimension; // '3d_gore' (Three.js 3D PBR + Gore) or '2d_miniature'
  qualityTier: QualityTier;
  particleDensityMultiplier: number; // 0.25 (کم) to 2.0 (حداکثر)
  goreIntensityMultiplier: number; // 0.0 (خاموش) to 2.0 (حداکثر خونریزی و قطع عضو بزرگسالانه)
  dismembermentEnabled: boolean; // قطع عضو و پرتاب سر و شاخ دیوان در ضربات سنگین
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
  renderDimension: '3d_gore', // پیش‌فرض موتور سه‌بعدی Three.js با جزئیات خونریزی بزرگسالانه
  qualityTier: 'ultra',
  particleDensityMultiplier: 1.5,
  goreIntensityMultiplier: 1.5,
  dismembermentEnabled: true,
  cameraShakeIntensity: 1.1,
  hitstopScale: 1.1,
  miniatureOrnamentLevel: 4,
  showDamageNumbers: true,
  masterVolume: 90,
  sfxVolume: 95,
  musicChimeVolume: 88,
  difficultyTier: 'balanced',
  enemyAggressionScale: 1.0,
  autoOpenDecreeOnEpoch: false,
};

export function applyQualityPreset(current: GameSettings, tier: QualityTier): GameSettings {
  if (tier === 'low') {
    return {
      ...current,
      qualityTier: 'low',
      particleDensityMultiplier: 0.35,
      goreIntensityMultiplier: 0.6,
      cameraShakeIntensity: 0.25,
      hitstopScale: 0.5,
      miniatureOrnamentLevel: 1,
      showDamageNumbers: false,
    };
  }
  if (tier === 'medium') {
    return {
      ...current,
      qualityTier: 'medium',
      particleDensityMultiplier: 0.75,
      goreIntensityMultiplier: 1.0,
      cameraShakeIntensity: 0.65,
      hitstopScale: 0.8,
      miniatureOrnamentLevel: 2,
      showDamageNumbers: true,
    };
  }
  if (tier === 'high') {
    return {
      ...current,
      qualityTier: 'high',
      particleDensityMultiplier: 1.15,
      goreIntensityMultiplier: 1.4,
      cameraShakeIntensity: 1.0,
      hitstopScale: 1.0,
      miniatureOrnamentLevel: 3,
      showDamageNumbers: true,
    };
  }
  return {
    ...current,
    qualityTier: 'ultra',
    particleDensityMultiplier: 1.8,
    goreIntensityMultiplier: 2.0,
    dismembermentEnabled: true,
    cameraShakeIntensity: 1.3,
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
        'در این نسخه، شما می‌توانید با کلید [Q] سنگ آتشین سده را پرتاب کنید تا طلسم دیوان را بشکنید و ۴ آتشدان گوشه‌های میدان را شعله‌ور سازید، و با کلید [F] دیوان گیج‌شده را به کمند دیوبند بکشید!',
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
      rulerName: 'کاوه آهنگر و جمشید',
      location: 'دژ ماران ضحاک و میدان درفش کاویانی',
      ferdowsiVerse: [
        'از آن چرم کآهنگران پشت پای / بپوشند هنگام زخم درای',
        'همی بر خروشید و فریاد خواند / جهان را سراسر سوی داد خواند',
      ],
      fullShahnamehChronicle: [
        'جمشید هفتصد سال در شکوه و داد پادشاهی کرد، طبقات جامعه را سامان داد، گوهرها را استخراج کرد و نوروز را بنیان نهاد؛ اما سرانجام غرور و خودبینی بر او چیره گشت و فره ایزدی از او گریخت. آنگاه ضحاک تازی که ابلیس بر شانه‌هایش بوسه زده و دو مار سیاه از کتف‌هایش روییده بود، بر ایران چیره شد.',
        'هزار سال شبِ تاریک بر ایران‌شهر گذشت و هر روز مغز دو جوان ایرانی خوراک ماران ضحاک می‌شد، تا آنکه کاوه آهنگر در بارگاه ضحاک خروش برآورد، محضر دروغین اژدهاک را درید و پیش‌بند چرمی آهنگری خود را بر سر نیزه کرد تا «درفش کاویانی» و قیام فریدون با گرز گاوسار آغاز شود!',
      ],
      ashaChoiceTitle: 'افراشتن درفش کاویانی و آزادی جوانان دربند (راه اَشَه)',
      ashaChoiceDesc:
        'چرم کاوه را به دیبای روم و گوهرهای شاهوار بیارایید و پیش از یورش به کاخ، زندانیان ضحاک را آزاد سازید.',
      ashaBlessingName: 'درفش کاویانی (پرچم رهایی)',
      ashaBlessingEffect: '۴۵٪ افزایش قدرت ضربه، ۲۰٪ کاهش آسیب و بازیابی پیوسته فره ایزدی.',
      ahrimanChoiceTitle: 'تصاحب تاج ماردوش و ریختن زهر انتقام (راه اهریمن)',
      ahrimanChoiceDesc:
        'ضحاک را بر محراب خودش ذبح کنید و با نیروی تاریک دو مار، بر هفت کشور فرمانروایی آهنین برپا سازید.',
      ahrimanBlessingName: 'تاج بیوراسب (سلطه زهر)',
      ahrimanBlessingEffect: '۸۰٪ افزایش مرگبار قدرت ضربه و جذب ۲۴ واحد جان در هر کشتن.',
    },
    {
      epochIndex: 5,
      epochTitle: 'عصر ششم (نسخه ۲.۵) · فریدون فرخ و دربند کردن ضحاک در کوه دماوند',
      rulerName: 'فریدون فرخ',
      location: 'غار آتشین کوه دماوند، فراز ابرهای البرز',
      ferdowsiVerse: [
        'بیاورد ضحاک را چون نوند / به کوه دماوند کردش ببند',
        'فریدون فرخ فرشته نبود / ز مشک و ز عنبر سرشته نبود',
      ],
      fullShahnamehChronicle: [
        'فریدون با گرز گاوسار (که به یاد گاو پرمایه ساخته شده بود) به کاخ ضحاک تاخت، طلسم‌های جادویی را درهم شکست و اژدهاک ماردوش را به زیر کشید. هنگامی که فریدون گرز گاوسار را بالا برد تا مغز ضحاک را متلاشی کند، سروش ایزدی فرود آمد و بانگ زد: «مزن! که ساعت او هنوز فرانرسیده است؛ اگر خون ناپاک او بر زمین ریزد، از هر قطره آن هزاران مار و کژدم سیاه برمی‌خیزد و جهان را تباه می‌سازد!»',
        'اکنون فریدون بر فراز دهانه آتشفشانی کوه دماوند ایستاده است. آیا فرمان سروش را گردن می‌نهید و ضحاک را با میخ‌های گران در غار دماوند به زنجیر می‌کشید تا جشن مهرگان آغاز شود، یا در خشم انتقام سر از تن اژدهاک جدا می‌سازید؟',
      ],
      ashaChoiceTitle: 'فرمانبرداری از سروش و زنجیر کردن ضحاک در دماوند (راه اَشَه)',
      ashaChoiceDesc:
        'ضحاک را با میخ‌های آهنین در تنگنای کوه دماوند ببندید تا زمین از زهر او در امان بماند و جشن مهرگان را برپا سازید.',
      ashaBlessingName: 'گرز گاوسار و نگین مهرگان',
      ashaBlessingEffect: '۵۵٪ افزایش قدرت ضربه گرز گاوسار، ۲۰٪ استحکام زره و تقویت کمند [F].',
      ahrimanChoiceTitle: 'سر بریدن ضحاک و آبدیده کردن گرز در خون اژدهاک (راه اهریمن)',
      ahrimanChoiceDesc:
        'هشدار سروش را نادیده بگیرید، سر ضحاک و دو مارش را ببرید و گرز خود را در خون اژدهاک فرو ببرید.',
      ahrimanBlessingName: 'خون اژدهاک (گرز مارکش)',
      ahrimanBlessingEffect: '۹۰٪ افزایش قدرت شکافتن زره و جذب ۲۶ واحد جان در هر کشتن.',
    },
    {
      epochIndex: 6,
      epochTitle: 'عصر هفتم (نسخه ۲.۵) · زال و سیمرغ و هفت‌خوان رستم (نبرد دیو سفید)',
      rulerName: 'رستم دستان (تهمتن)',
      location: 'غار تاریک هفت‌کوه مازندران — کمینگاه دیو سفید',
      ferdowsiVerse: [
        'به تاریکی اندر یکی کوه دید / سراسر شده تیره و ناپدید',
        'فرو برد خنجر دلش بردرید / جگرش از تن تیره بیرون کشید',
      ],
      fullShahnamehChronicle: [
        'زالِ سپیدموی که در آشیان سیمرغ بر چکاد البرز پرورش یافته بود، از پیوند با رودابه کابلی فرزندی پیل‌تن به دنیا آورد: جهان‌پهلوان رستم دستان! هنگامی که کیکاووس شاه به فریب دیوان به مازندران لشکر کشید و به جادوی «دیو سفید» چشمان خود و سپاه ایران نابینا گشت، رستم بر پشت رخشِ تیزتک پای در «هفت‌خوان» نهاد.',
        'رستم پس از کشتن شیر، گذر از بیابان تفتیده، دریدن اژدها، دو نیم کردن زن جادوگر، به کمند کشیدن اولاد و کندن سر ارژنگ‌دیو، اکنون در خوان هفتم وارد غار قیرگون دیو سفید شده است! تنها چکاندن خونِ جگر دیو سفید در چشمان کیکاووس و ایرانیان، بینایی را به آنان بازمی‌گرداند؛ اما جادوگران مازندران تاج و گنج هفت‌کوه را به خود رستم پیشکش می‌کنند.',
      ],
      ashaChoiceTitle: 'دریدن جگر دیو سفید و بینا کردن چشم ایرانیان (راه اَشَه)',
      ashaChoiceDesc:
        'در تاریکی غار با دیو سفید گلاویز شوید، پای او را ببرید و خون جگرش را تنها برای درمان چشم کیکاووس و لشگر ایران به کار ببرید.',
      ashaBlessingName: 'ببر بیان و پر سیمرغ',
      ashaBlessingEffect: '۶۵٪ افزایش نیروی ضربه تهمتن، ۲۰٪ مقاومت در برابر آتش و جادو، و +۱۴ جان در هر [F].',
      ahrimanChoiceTitle: 'نهادن کلاهخود دیو سفید بر سر و تصرف مازندران (راه اهریمن)',
      ahrimanChoiceDesc:
        'دیو سفید را بکشید، سپاه دیوان بازمانده را به فرمان خود درآورید و کیکاووسِ نابینا را در بند رها کرده، خود شاه مازندران شوید!',
      ahrimanBlessingName: 'خشم دیو سفید (سالار مازندران)',
      ahrimanBlessingEffect: 'افزایش ۱۰۵٪ قدرت مرگبار گرز و شمشیر و جذب ۳۰ واحد جان در هر قطع عضو.',
    },
    {
      epochIndex: 7,
      epochTitle: 'عصر هشتم (نسخه ۳.۰) · تراژدی رستم و سهراب و نوشداروی دیرهنگام',
      rulerName: 'رستم و سهراب یل',
      location: 'دشت رزم مرز ایران و توران — کنار رود جیحون',
      ferdowsiVerse: [
        'چو بگشاد خفتان و آن مهره دید / همه جامه بر خویشتن بردرید',
        'یکی داستان است پر آب چشم / دل نازک از رستم آید به خشم',
      ],
      fullShahnamehChronicle: [
        'در نسخه ۳.۰، حماسه به اوج تراژیک خود می‌رسد: سهرابِ نوجوان، ثمره پیوند رستم و تهمینه (شاهدخت سمنگان)، بی‌آنکه پدر را دیده باشد با لشکر توران به جست‌وجوی رستم می‌آید تا تاج ایران را به پدر بسپارد؛ اما افراسیابِ مکّار چنان توطئه می‌چیند که پدر و پسر یکدیگر را نشناسند.',
        'پس از سه روز نبرد تن‌به‌تن که زمین را به لرزه درآورد، رستم خنجر در سینه سهراب فرو می‌برد؛ اما سهراب در آخرین نفس از «مهره بازوبند» رستم بر بازوی خود سخن می‌گوید! رستم خفتان پسر را می‌گشاید، بازوبند را می‌بیند و خون از دیدگانش جاری می‌شود، در حالی که کیکاووس از دادن «نوشدارو» دریغ می‌ورزد. اکنون رستم بر بالین فرزند چه فرمانی می‌دهد؟',
      ],
      ashaChoiceTitle: 'عمل به وصیت سهراب: بخشایش لشگریان و حفظ صلح ایران (راه اَشَه)',
      ashaChoiceDesc:
        'به واپسین خواهش سهراب وفا کنید: مانع کشتار سپاهیان توران شوید، خشم خود را فروخورید و ایران‌شهر را از جنگ داخلی برهانید.',
      ashaBlessingName: 'مهره بازوبند تهمینه (فره جاودان)',
      ashaBlessingEffect: '۷۵٪ افزایش قدرت ضربه پهلوانی، سپر مقدس سده و بازگردانی ۱۸ جان در هر [F].',
      ahrimanChoiceTitle: 'تاراج پرده‌سرای کاووس و غرق کردن دشت در خون (راه اهریمن)',
      ahrimanChoiceDesc:
        'از دریغ کردن نوشدارو به خشم آیید، سراپرده کاووس را واژگون سازید و سپاه توران را تا آخرین نفر از دم تیغ بگذرانید!',
      ahrimanBlessingName: 'خشم سوگ دستان (رستاخیز رخش)',
      ahrimanBlessingEffect: '۱۲۵٪ افزایش ویرانگر قدرت شکافتن و جذب ۳۵ واحد جان در هر کشتن.',
    },
    {
      epochIndex: 8,
      epochTitle: 'عصر نهم (نسخه ۴.۰) · گذر سیاوش از کوه آتش و کین‌خواهی کیخسرو از افراسیاب',
      rulerName: 'سیاوش و شاه کیخسرو',
      location: 'کوه آتش سده تا کنگ‌دژ و دریاچه چیچست در توران',
      ferdowsiVerse: [
        'یکی کوه آتش به فرمان شاه / برافروختند از برِ چرخ و ماه',
        'سیاوش به تندی برانگیخت اسب / بشد تیز مانند آذرگشسب',
      ],
      fullShahnamehChronicle: [
        'شاهزاده سیاوش، مظهر پاکی و شرف در شاهنامه، برای اثبات بی‌گناهی خود در برابر تهمت سودابه، جامه سپید پوشید و بر پشت اسب سیاه خود «شبرنگ بهزاد» از میان دو کوه آتشِ شعله‌ور گذشت و به معجزه راستی، حتی دامن جامه‌اش دود نگرفت.',
        'اما چون سیاوش برای پرهیز از فتنه به توران پناه برد و شهر «سیاوش‌گرد» را بنا نهاد، به سعایت گرسیوز و فرمان افراسیاب، سر بی‌گناهش را در تشت زرین بریدند و از خون او گیاه «پرسیاوشان» رویید. آنگاه فرزندش «کیخسرو» با جام جهان‌بین (جام جم) و همراهی رستم و گودرز، در جنگ بزرگ به کین‌خواهی پدر برخاست تا افراسیاب را به کیفر برساند!',
      ],
      ashaChoiceTitle: 'آیین داد کیخسرو: کیفر افراسیاب و امان دادن به مردم توران (راه اَشَه)',
      ashaChoiceDesc:
        'همچون کیخسرو دادگر، تنها افراسیاب و گرسیوزِ خون‌ریز را به سزای خون سیاوش برسانید و به مردم و شهرهای توران آسیبی نرسانید.',
      ashaBlessingName: 'فروغ آتش سیاوش و جام جم',
      ashaBlessingEffect: '۸۵٪ افزایش قدرت ضربه مقدس، مصونیت کامل از آتش و +۲۰ جان در هر [F].',
      ahrimanChoiceTitle: 'کین سیاوش: به آتش کشیدن سراسر شهرهای توران (راه اهریمن)',
      ahrimanChoiceDesc:
        'فرمان دهید سپاه ایران در انتقام خون سیاوش، کنگ‌دژ و همه آبادی‌های توران را با خاک یکسان و غرق در خون سازد.',
      ahrimanBlessingName: 'کین سیاوش (توفان خاکستر توران)',
      ahrimanBlessingEffect: '۱۴۰٪ افزایش مرگبار قدرت سلاح و جذب ۳۸ واحد جان در هر کشتن.',
    },
    {
      epochIndex: 9,
      epochTitle: 'عصر دهم (نسخه ۴.۰) · رزم رستم و اسفندیار روئین‌تن و تیر گز سیمرغ',
      rulerName: 'رستم و اسفندیار روئین‌تن',
      location: 'کرانه رود هیرمند در سیستان و زابلستان',
      ferdowsiVerse: [
        'بزد تیر بر چشم اسفندیار / سیه شد جهان پیش آن نامدار',
        'نگونسار شد از برِ زین کمان / نماند ایچ با او زمان و توان',
      ],
      fullShahnamehChronicle: [
        'اسفندیار، شاهزاده دلیر و «روئین‌تن» که هیچ تیغ و نیزه‌ای بر اندامش کارگر نبود، پس از پیروزی در هفت‌خوان توران از پدرش گشتاسب شاهی را طلب کرد؛ اما گشتاسبِ پیمان‌شکن شرط نهاد که اسفندیار به سیستان رود و جهان‌پهلوان رستم را «دست‌بسته» به بارگاه آورد!',
        'در روز نخست نبرد، رستم و رخش از تیرهای اسفندیار خسته و مجروح شدند. شبانگاه زال پر سیمرغ را بر آتش نهاد؛ سیمرغ فرود آمد، زخم‌های رستم و رخش را درمان کرد و چوبِ درخت «گز» را به رستم نشان داد تا تیری دوشاخه بسازد و با پر سیمرغ و آب رز آبدیده کند؛ اما هشدار داد: «هر کس خون اسفندیار بریزد، در این جهان رنگ شادی نبیند!»',
      ],
      ashaChoiceTitle: 'سوگواری بر اسفندیار و پذیرش وصیت او برای پرورش بهمن (راه اَشَه)',
      ashaChoiceDesc:
        'تنها برای رهایی از ننگِ بند، تیر گز را رها کنید و سپس بر بالین اسفندیار بگریید و فرزندش «بهمن» را با مهر و آیین پهلوانی در زابل پرورش دهید.',
      ashaBlessingName: 'تیر گز سیمرغ و پیمان بهمن',
      ashaBlessingEffect: 'شکافتن زره روئین‌تنان (+۹۵٪ آسیب)، تقویت ضدحمله [Q] و +۲۲ جان در هر [F].',
      ahrimanChoiceTitle: 'کوری اسفندیار روئین‌تن و لشکرکشی به تخت گشتاسب (راه اهریمن)',
      ahrimanChoiceDesc:
        'تیر گز دوشاخه را بی‌درنگ بر دو چشم اسفندیار بنشانید و تابوت خونین او را برای لرزاندن تخت گشتاسب به بلخ بفرستید.',
      ahrimanBlessingName: 'نفرین خون روئین‌تن (تیغ شاه‌کش)',
      ahrimanBlessingEffect: '۱۵۵٪ افزایش قدرت زره‌شکاف و جذب ۴۲ واحد جان در هر کشتن.',
    },
    {
      epochIndex: 10,
      epochTitle: 'عصر یازدهم (نسخه ۵.۰) · چاه شغاد، تیر آخر رستم از دل درخت چنار و وداع تهمتن',
      rulerName: 'رستم دستان و فرامرز',
      location: 'نخجیرگاه کابلستان — چاه نیزه‌ها و درخت چنار کهنسال',
      ferdowsiVerse: [
        'درخت و برادر به هم بر بدوخت / به هنگام رفتن دلش برفروخت',
        'چنین گفت رستم که یزدان پاک / مرا داد نیروی و هوش و تریاک',
      ],
      fullShahnamehChronicle: [
        'نفرینِ خون اسفندیار سرانجام دامن تهمتن را گرفت: «شغاد»، برادر ناتنی و بدگوهر رستم، با شاه کابل همدست شد و در شکارگاه چاه‌هایی ژرف کند و بنِ آن‌ها را پر از نیزه، ژوپین و شمشیرهای زهرآلود ساخت و روی چاه‌ها را با خاشاک پوشاند.',
        'رخش بوی خاک تازه را حس کرد و پای پس کشید، اما تقدیر چشم رستم را بسته بود؛ رخش و رستم در چاه هشتم سقوط کردند و پیکرشان چاک‌چاک گشت! شغادِ نامرد با لبخند از بالای چاه نگریست. رستم در واپسین دم گفت: «کمان مرا با دو تیر به زه کن و نزدم بگذار تا درندگان در آخرین ساعات زندگی مرا ندرند.» شغاد کمان را انداخت و خود پشت درخت چنارِ تنومندی پنهان شد؛ اما رستم با آخرین توش پهلوانی کمان را کشید و چنار و شغاد را به هم دوخت!',
      ],
      ashaChoiceTitle: 'دوختن شغاد به درخت چنار و نیایش یزدان در واپسین نفس (راه اَشَه)',
      ashaChoiceDesc:
        'با یک تیرِ دادگرانه شغاد خائن را در دل چنار بدوزید، یزدان پاک را سپاس گویید و با نامی نیک و جاودان با جهان وداع کنید.',
      ashaBlessingName: 'تیر واپسین دستان (روان جاودان زابل)',
      ashaBlessingEffect: '۱۱۰٪ افزایش قدرت ضربه پهلوانی، سپر مقدس و +۲۵ جان در هر [F].',
      ahrimanChoiceTitle: 'فرمان خونین به فرامرز برای زیر و رو کردن خاک کابلستان (راه اهریمن)',
      ahrimanChoiceDesc:
        'شغاد را به درخت بدوزید و سوگند انتقام بگذارید تا فرزندتان فرامرز با لشکر زابل، شاه کابل و چهل خویشاوندش را بر دار کشد و کابل را به آتش کشد.',
      ahrimanBlessingName: 'خاکستر کابل (خشم فرامرز)',
      ahrimanBlessingEffect: '۱۷۵٪ افزایش ویرانگر قدرت شکافتن و جذب ۴۸ واحد جان در هر کشتن.',
    },
    {
      epochIndex: 11,
      epochTitle: 'عصر دوازدهم (نسخه ۵.۰ · پایان شاهنامه) · از انوشیروان و رستم فرخزاد تا کاخ بلند نظم فردوسی',
      rulerName: 'رستم فرخزاد و حکیم ابوالقاسم فردوسی',
      location: 'از ایوان مدائن (تیسفون) و قادسیه تا توسِ فردوسی',
      ferdowsiVerse: [
        'پی افکندم از نظم کاخی بلند / که از باد و باران نیابد گزند',
        'بسی رنج بردم در این سال سی / عجم زنده کردم بدین پارسی',
      ],
      fullShahnamehChronicle: [
        'در واپسین عصر شاهنامه، تاریخ از روزگار اردشیر بابکان، بهرام گور، و دادگری خسرو انوشیروان و خرد بوذرجمهر می‌گذرد تا به غروب غم‌انگیز ساسانیان می‌رسد. سپهبد «رستم فرخزاد» پیش از آخرین نبرد در قادسیه، نامه‌ای دردناک و آینده‌نگر به برادرش می‌نگارد و با شجاعت تا آخرین قطره خون در پای «درفش کاویانی» می‌رزمد.',
        'کاخ‌ها و تخت‌های شاهان فرو می‌ریزد؛ اما در شهر توس، دهقان‌زاده‌ای آزاده و خردمند به نام «حکیم ابوالقاسم فردوسی» سی سال از عمر خود را بر سر شصت هزار بیتِ زرین می‌گذارد تا تاریخ، اسطوره، اخلاق و زبان پارسی هرگز نمیرد! اکنون در ایستگاه پایانی شاهنامه، سرنوشت نهایی ایران‌شهر را چگونه مهر می‌کنید؟',
      ],
      ashaChoiceTitle: 'جاودانه ساختن کاخ بلند نظم فردوسی، خرد و زبان پارسی (راه اَشَه)',
      ashaChoiceDesc:
        'فراتر از شمشیر و تاج خاکی، روح ایران‌شهر را در «کاخ بلند سخن فردوسی»، دادگری و فرهنگ جاودان سازید تا از باد و باران روزگار گزند نیابد.',
      ashaBlessingName: 'کاخ بلند نظم (فره جاودان حکیم توس)',
      ashaBlessingEffect: '۱۳۵٪ قدرت ضربه نهایی، سپر شکست‌ناپذیر سده و +۳۰ جان در هر ضربه [F].',
      ahrimanChoiceTitle: 'رزم بی‌پایان تا آخرین قطره خون در پای درفش کاویانی (راه اهریمن)',
      ahrimanChoiceDesc:
        'تسلیم گردش زمان مشوید؛ روح پهلوانان پیشدادی و کیانی را فراخوانید و میدان قادسیه و مدائن را به کارزار ابدی آهن و خون بدل سازید!',
      ahrimanBlessingName: 'حماسه خونین قادسیه (رستاخیز درفش)',
      ahrimanBlessingEffect: '۲۰۰٪ افزایش قدرت ضربه افسانه‌ای و جذب ۵۵ واحد جان در هر کشتن.',
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
    gameSubtitle: 'نسخه کامل ۱۲ عصر: از کیومرث و رستم تا اسفندیار، چاه شغاد و پایان شاهنامه',
    topKicker: 'حماسه کامل شاهنامه فردوسی · نسخه ۵.۰ (۱۲ عصر کامل از آغاز اسطوره تا کاخ نظم فردوسی)',
    heroIntro:
      'از تخت پلنگینه کیومرث، آتش سده هوشنگ و درفش کاویانی تا هفت‌خوان رستم، سهراب، گذر سیاوش از آتش، اسفندیار روئین‌تن، چاه شغاد و رزم واپسین رستم فرخزاد؛ کل شاهنامه را در ۱۲ عصر تجربه کنید.',
    startChronicleBtn: 'آغاز از کیومرث (عصر ۱)',
    jumpToHushangBtn: 'عصر ۱۰: رستم و اسفندیار روئین‌تن',
    versionManifestBtn: 'مانیفست نسخه ۵.۰ (۱۲ عصر)',
    settingsBtn: 'تنظیمات کامل بازی',
    controlHintLine:
      'WASD حرکت · Space ضربه گرز گاوسار · Q سنگ آتشین سده · F کمند دیوبند (قطع عضو) · Shift جهش · E خروش اسطوره‌ای · C طومار ۱۲ عصر',
    hudVitalityLabel: 'فره ایزدی · جان پهلوان',
    hudStabilityLabel: 'ثبات ایران‌شهر',
    hudAlignmentLabel: 'تراز اخلاقی',
    hudRenownLabel: 'فر و نام‌آوری',
    hudSadehFlintLabel: '[Q] سنگ سده',
    hudDivBandLabel: '[F] کمند دیوبند',
    hudBraziersLabel: 'آتشدان سده',
    hudDecreeReadyBtn: 'طومار کامل ۱۲ عصر و فرمان شاهی [C]',
    hudChooseAshaBtn: '[1] راه اَشَه (داد و روشنایی)',
    hudChooseAhrimanBtn: '[2] راه اهریمن (قدرت و خون)',
    hudEpochSelectLabel: 'عصر (۱ تا ۱۲):',
    stanceAsha: 'راه اَشَه (روشنایی)',
    stanceAhriman: 'راه اهریمن (تاریکی)',
    stanceBalance: 'تراز سپیده‌دم',
    pauseTitle: 'دیوان شاهی البرز (توقف بازی)',
    pauseSubtitle: '«پی افکندم از نظم کاخی بلند / که از باد و باران نیابد گزند»',
    resumeBtn: 'ادامه نبرد و روایت',
    restartBtn: 'آغاز دوباره این عصر',
    returnTitleBtn: 'بازگشت به صفحه نخست',
    fullStoryReaderBtn: 'طومار کامل شاهنامه (۱۲ عصر) [C]',
    settingsModalTitle: 'تنظیمات جزئیات، گرافیک، صدا و زبان (از کم تا حداکثر)',
    settingsModalSubtitle:
      'تنظیم دقیق کیفیت سه‌بعدی و نگارگری ایرانی، شدت پاشش خون، لرزش دوربین، درجه سختی دیوان و زبان روایت',
    qualitySectionTitle: '۱. کیفیت گرافیک و جزئیات مدل‌ها (کم تا حداکثر)',
    audioSectionTitle: '۲. تنظیمات صدا و موسیقی سمفونیک و مقامی',
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
    gameSubtitle: 'طومار کامل ۱۲ عصر از کیومرث تا اسفندیار، شغاد و کاخ نظم فردوسی',
    topKicker: 'طومار کامل شاهنامه · نسخه ۵.۰ (۱۲ عصر از آغاز تا پایان شاهنامه)',
    heroIntro:
      'بشنو از فردوسی پاک‌زاد؛ از روزگار کیومرث بر کوه البرز تا هفت‌خوان رستم، آتش سیاوش، تیر گز بر چشم اسفندیار، چاه شغاد و جاودانگی پارسی.',
    startChronicleBtn: 'گشودن طومار از کیومرث',
    jumpToHushangBtn: 'عصر ۱۰: رستم و اسفندیار',
    versionManifestBtn: 'کارنامه نسخه‌ها (v5.0)',
    settingsBtn: 'آرایش و تنظیمات',
    controlHintLine:
      'WASD خرامیدن · Space گرز و شمشیر · Q سنگ آتشین سده · F کمند دیوبند · Shift گریز · E خروش اسطوره‌ای · C طومار ۱۲ عصر',
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
    hudEpochSelectLabel: 'عصر (۱ تا ۱۲):',
    stanceAsha: 'فروغ اَشَه',
    stanceAhriman: 'کین اهریمن',
    stanceBalance: 'میانه راز',
    pauseTitle: 'درنگ در ایوان البرز',
    pauseSubtitle: '«بسی رنج بردم در این سال سی / عجم زنده کردم بدین پارسی»',
    resumeBtn: 'بازگشت به رزمگاه',
    restartBtn: 'نوسازی این نبرد',
    returnTitleBtn: 'سرآغاز نامه',
    fullStoryReaderBtn: 'طومار نقالی شاهنامه (۱۲ عصر) [C]',
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
    gameSubtitle: 'Complete 12-Epoch Chronicle: From Keyumars to Rostam, Esfandiyar & Ferdowsi’s Finale',
    topKicker: 'Ferdowsi’s Complete Shahnameh Chronicle · Build v5.0.0 (All 12 Epochs Unlocked)',
    heroIntro:
      'Experience the entirety of Ferdowsi’s Shahnameh across 12 playable epochs: from Keyumars and Hushang to Rostam’s Seven Labors, Sohrab, Siyavash’s Fire-Ordeal, Esfandiyar the Brazen-Bodied, the Pit of Shaghad, and the immortal palace of Persian verse.',
    startChronicleBtn: 'Start Chronicle (Epoch I)',
    jumpToHushangBtn: 'Epoch X: Rostam & Esfandiyar',
    versionManifestBtn: 'Version Manifest (v5.0.0)',
    settingsBtn: 'Detailed Settings',
    controlHintLine:
      'WASD Move · Space Strike · Q Sadeh Flint Parry · F Div-Band Finisher · Shift Dash · E Mythic Art · C 12-Epoch Scroll',
    hudVitalityLabel: 'ROYAL FARR · VITALITY',
    hudStabilityLabel: 'STABILITY',
    hudAlignmentLabel: 'ALIGNMENT',
    hudRenownLabel: 'CHRONICLE RENOWN',
    hudSadehFlintLabel: '[Q] Sadeh Flint',
    hudDivBandLabel: '[F] Div-Band',
    hudBraziersLabel: 'Sadeh Braziers',
    hudDecreeReadyBtn: 'Shahnameh 12-Epoch Scroll [C]',
    hudChooseAshaBtn: '[1] Path of Asha',
    hudChooseAhrimanBtn: '[2] Path of Ahriman',
    hudEpochSelectLabel: 'Epoch (1–12):',
    stanceAsha: 'Path of Asha (Light)',
    stanceAhriman: 'Path of Ahriman (Dark)',
    stanceBalance: 'Twilight Balance',
    pauseTitle: 'Royal Diwan of Alborz',
    pauseSubtitle: '“I raised up from verse a high palace of gold, that neither the wind nor the rain shall make old.”',
    resumeBtn: 'Resume Chronicle',
    restartBtn: 'Restart Epoch',
    returnTitleBtn: 'Return to Title',
    fullStoryReaderBtn: 'Full Shahnameh Scroll (12 Epochs) [C]',
    settingsModalTitle: 'Detailed Settings: Graphics, Audio, Difficulty & Language (Low to Max)',
    settingsModalSubtitle:
      'Customize 3D character detail, directional blood physics, camera shake, Div aggression, and language',
    qualitySectionTitle: '1. Graphics & 3D Detail (Low to Maximum)',
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
