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
      ashaBlessingName: 'فره سروش',
      ashaBlessingEffect: '۲۰٪ کاهش آسیب دریافتی و تقویت موج ضدحمله سنگ آتشین سده.',
      ahrimanChoiceTitle: 'فرمان خون و زنجیر آهنین (راه اهریمن)',
      ahrimanChoiceDesc:
        'درندگان البرز را در زنجیرهای پولادین ببندید و طلایه‌داران اسیر دیو را بر صخره‌های سیاه قربانی کنید تا هراس در دل سپاه مازندران بیفتد.',
      ahrimanBlessingName: 'خشم البرز',
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
      ],
      ashaChoiceTitle: 'درهم شکستن محراب جادو و پایداری در راستی (راه اَشَه)',
      ashaChoiceDesc:
        'پیمان آلوده جادوگران را رد کنید، بت‌های تاریک را بشکنید و با شرافت پهلوانی از مرزنشینان ایران‌شهر دفاع کنید.',
      ashaBlessingName: 'سوگند خون پاک سیامک',
      ashaBlessingEffect: 'افزایش ۱ ظرف فره ایزدی و بازیابی سریع‌تر نیروی اسطوره‌ای.',
      ahrimanChoiceTitle: 'پذیرش پیمان خونین جادوگران (راه اهریمن)',
      ahrimanChoiceDesc:
        'باج روستاهای مرزی را به جادوگران واگذارید و شمشیر خود را به زهر سیاه مازندران آلوده سازید تا دیوان را درهم بدرید.',
      ahrimanBlessingName: 'زهر سیاه مازندران',
      ahrimanBlessingEffect: '۴۵٪ افزایش آسیب شمشیر و بازگردانی ۱۲ واحد جان با هر کشتن.',
    },
    {
      epochIndex: 2,
      epochTitle: 'عصر سوم · پادشاهی هوشنگ، پیدایش آتش سده و آهنگری',
      rulerName: 'شاه هوشنگ پیشدادی',
      location: 'صخره‌های آتش سده و کوره آهنگری، در برابر دژ دیو سیاه',
      ferdowsiVerse: [
        'بشد سنگ با سنگ و آتش بجست / فروغی پدید آمد از هر دو دست',
        'جهاندار پیش جهان‌آفرین / نیایش همی کرد و خواند آفرین',
      ],
      fullShahnamehChronicle: [
        'پس از شهادت سیامک، کیومرث و همه جانوران کوهستان یک سال در سوگ نشستند تا آنکه سروش پیام آورد که زمان خیزش فرارسیده است. هوشنگ، فرزند برومند سیامک، سپاهی از پری، پلنگ، شیر، گرگ و مرغان گرد آورد تا انتقام خون پدر را از دیو سیاه بستاند.',
        'در راه کوهستان، ماری سترگ و سیاه‌چشم با دود و زهر بر هوشنگ پدیدار شد. هوشنگ سنگی گران برداشت و به سوی مار افکند؛ سنگ بر صخره دیگری فرود آمد و از برخورد دو سنگ، نخستین جرقه آتش در جهان پدیدار گشت! هوشنگ به شکرانه این فروغ ایزدی «جشن سده» را بنیان نهاد و با حرارت آتش، آهن را از دل سنگ بیرون کشید و هنر آهنگری را آغاز کرد.',
      ],
      ashaChoiceTitle: 'تقدیس آتش سده و ساخت گاوآهن و کاریز (راه اَشَه)',
      ashaChoiceDesc:
        'آتش سده را قبله روشنایی و داد قرار دهید؛ از آهن گداخته ابزار آبادانی و شمشیر دادگری بسازید و تنها دیو سیاه و ستمگران را کیفر دهید.',
      ashaBlessingName: 'آتش سده',
      ashaBlessingEffect: 'شکستن دوبرابر سریع‌تر طلسم دیوان و درمان ۱۲ جان با هر ضربه نهایی دیوبند.',
      ahrimanChoiceTitle: 'برافروختن دوزخ انتقام و ذوب تاج دیوان (راه اهریمن)',
      ahrimanChoiceDesc:
        'کوره‌های سده را با استخوان دیوان شکست‌خورده بسوزانید، بیشه‌های مازندران را به خاکستر کشید و با وحشت آهن و آتش فرمان برانید.',
      ahrimanBlessingName: 'کوره دوزخ هوشنگ',
      ahrimanBlessingEffect: '۶۰٪ افزایش قدرت ضربه و انفجار آتشین در هنگام اجرای ضربه نهایی دیوبند.',
    },
    {
      epochIndex: 3,
      epochTitle: 'عصر چهارم · طهمورث دیوبند و راز سی خط',
      rulerName: 'شاه طهمورث دیوبند',
      location: 'ایوان زنجیر و میدان رزم دیوان',
      ferdowsiVerse: [
        'وزیشان دو بهره به افسون ببست / دگرشان به گرز گران کرد پست',
        'نبشتن به خسرو بیاموختند / دلش را به دانش برافروختند',
      ],
      fullShahnamehChronicle: [
        'پس از هوشنگ، فرزندش طهمورث بر تخت نشست. او ریسیدن پشم، بافتن جامه و رام کردن باز و یوز را به مردمان آموخت و با دستور خردمندش «شیدسپ» راه پاکی در پیش گرفت.',
        'دیوان که از قدرت طهمورث به تنگ آمده بودند، انبوه شدند تا تخت او را واژگون سازند. طهمورث دو سوم ایشان را با گرز گران بر زمین کوفت و یک سوم دیگر را به کمند افسون در بند کشید. دیوانِ اسیر برای رهایی جان خود سوگند خوردند که اگر شاه امانشان دهد، هنر نوشتن به نزدیکِ سی خط گوناگون را به او بیاموزند.',
      ],
      ashaChoiceTitle: 'بخشایش دیوانِ دربند و آموزش دانش نوشتن (راه اَشَه)',
      ashaChoiceDesc:
        'بر پیمان خود استوار بمانید و دیوانِ دربند را امان دهید تا دبیران ایران‌شهر هنر خط و دانش را برای آیندگان بنگارند.',
      ashaBlessingName: 'فرمان سی خط دانش',
      ashaBlessingEffect: 'تقویت کمند دیوبند با کتیبه‌های زرین و ۴۰٪ افزایش قدرت ضربه.',
      ahrimanChoiceTitle: 'استخراج افسون سیاه و خرد کردن سر اسیران (راه اهریمن)',
      ahrimanChoiceDesc:
        'راز خطوط و طلسم‌ها را از ذهن دیوان بیرون بکشید و سپس پیمان شکسته، همگی را زیر گرز پولادین نابود سازید.',
      ahrimanBlessingName: 'گرز پیمان‌شکن',
      ahrimanBlessingEffect: '۷۰٪ افزایش ویرانگر قدرت سلاح و جذب ۲۰ جان با هر کشتن.',
    },
    {
      epochIndex: 4,
      epochTitle: 'عصر پنجم · جمشید، ضحاک ماردوش و قیام کاوه آهنگر',
      rulerName: 'کاوه آهنگر و جمشید',
      location: 'دژ ماران ضحاک و میدان درفش کاویانی',
      ferdowsiVerse: [
        'از آن چرم کآهنگران پشت پای / بپوشند هنگام زخم درای',
        'همی بر خروشید و فریاد خواند / جهان را سراسر سوی داد خواند',
      ],
      fullShahnamehChronicle: [
        'جمشید هفتصد سال در شکوه و داد پادشاهی کرد، طبقات جامعه را سامان داد، گوهرها را استخراج کرد و نوروز را بنیان نهاد؛ اما سرانجام غرور و خودبینی بر او چیره گشت و فره ایزدی از او گریخت. آنگاه ضحاک تازی که ابلیس بر شانه‌هایش بوسه زده و دو مار سیاه از کتف‌هایش روییده بود، بر ایران چیره شد.',
        'هزار سال شبِ تاریک بر ایران‌شهر گذشت و هر روز مغز دو جوان ایرانی خوراک ماران ضحاک می‌شد، تا آنکه کاوه آهنگر در بارگاه ضحاک خروش برآورد، محضر دروغین اژدهاک را درید و پیش‌بند چرمی آهنگری خود را بر سر نیزه کرد تا «درفش کاویانی» و قیام فریدون با گرز گاوسار آغاز شود.',
      ],
      ashaChoiceTitle: 'افراشتن درفش کاویانی و آزادی جوانان دربند (راه اَشَه)',
      ashaChoiceDesc:
        'چرم کاوه را به دیبای روم و گوهرهای شاهوار بیارایید و پیش از یورش به کاخ، زندانیان ضحاک را آزاد سازید.',
      ashaBlessingName: 'درفش کاویانی',
      ashaBlessingEffect: '۴۵٪ افزایش قدرت ضربه، ۲۰٪ کاهش آسیب و بازیابی پیوسته فره ایزدی.',
      ahrimanChoiceTitle: 'تصاحب تاج ماردوش و ریختن زهر انتقام (راه اهریمن)',
      ahrimanChoiceDesc:
        'ضحاک را بر محراب خودش ذبح کنید و با نیروی تاریک دو مار، بر هفت کشور فرمانروایی آهنین برپا سازید.',
      ahrimanBlessingName: 'تاج بیوراسب',
      ahrimanBlessingEffect: '۸۰٪ افزایش مرگبار قدرت ضربه و جذب ۲۴ واحد جان در هر کشتن.',
    },
    {
      epochIndex: 5,
      epochTitle: 'عصر ششم · فریدون فرخ و دربند کردن ضحاک در کوه دماوند',
      rulerName: 'فریدون فرخ',
      location: 'غار آتشین کوه دماوند، فراز ابرهای البرز',
      ferdowsiVerse: [
        'بیاورد ضحاک را چون نوند / به کوه دماوند کردش ببند',
        'فریدون فرخ فرشته نبود / ز مشک و ز عنبر سرشته نبود',
      ],
      fullShahnamehChronicle: [
        'فریدون با گرز گاوسار به کاخ ضحاک تاخت، طلسم‌های جادویی را درهم شکست و اژدهاک ماردوش را به زیر کشید. هنگامی که فریدون گرز گاوسار را بالا برد تا مغز ضحاک را متلاشی کند، سروش ایزدی فرود آمد و بانگ زد که ساعت او هنوز فرانرسیده است و باید در کوه دماوند به بند کشیده شود.',
      ],
      ashaChoiceTitle: 'فرمانبرداری از سروش و زنجیر کردن ضحاک در دماوند (راه اَشَه)',
      ashaChoiceDesc:
        'ضحاک را با میخ‌های آهنین در تنگنای کوه دماوند ببندید تا زمین از زهر او در امان بماند و جشن مهرگان را برپا سازید.',
      ashaBlessingName: 'گرز گاوسار و نگین مهرگان',
      ashaBlessingEffect: '۵۵٪ افزایش قدرت ضربه گرز گاوسار، ۲۰٪ استحکام زره و تقویت کمند.',
      ahrimanChoiceTitle: 'سر بریدن ضحاک و آبدیده کردن گرز در خون اژدهاک (راه اهریمن)',
      ahrimanChoiceDesc:
        'هشدار سروش را نادیده بگیرید، سر ضحاک و دو مارش را ببرید و گرز خود را در خون اژدهاک فرو ببرید.',
      ahrimanBlessingName: 'خون اژدهاک',
      ahrimanBlessingEffect: '۹۰٪ افزایش قدرت شکافتن زره و جذب ۲۶ واحد جان در هر کشتن.',
    },
    {
      epochIndex: 6,
      epochTitle: 'عصر هفتم · زال و سیمرغ و هفت‌خوان رستم (نبرد دیو سفید)',
      rulerName: 'رستم دستان (تهمتن)',
      location: 'غار تاریک هفت‌کوه مازندران — کمینگاه دیو سفید',
      ferdowsiVerse: [
        'به تاریکی اندر یکی کوه دید / سراسر شده تیره و ناپدید',
        'فرو برد خنجر دلش بردرید / جگرش از تن تیره بیرون کشید',
      ],
      fullShahnamehChronicle: [
        'زالِ سپیدموی که در آشیان سیمرغ بر چکاد البرز پرورش یافته بود، از پیوند با رودابه کابلی فرزندی پیل‌تن به دنیا آورد: جهان‌پهلوان رستم دستان. هنگامی که کیکاووس شاه و سپاه ایران به جادوی «دیو سفید» در مازندران نابینا گشتند، رستم بر پشت رخش پای در هفت‌خوان نهاد و در خوان هفتم وارد غار قیرگون دیو سفید شد.',
      ],
      ashaChoiceTitle: 'دریدن جگر دیو سفید و بینا کردن چشم ایرانیان (راه اَشَه)',
      ashaChoiceDesc:
        'در تاریکی غار با دیو سفید گلاویز شوید، پای او را ببرید و خون جگرش را برای درمان چشم کیکاووس و لشگر ایران به کار ببرید.',
      ashaBlessingName: 'ببر بیان و پر سیمرغ',
      ashaBlessingEffect: '۶۵٪ افزایش نیروی ضربه تهمتن و ۲۰٪ مقاومت در برابر آتش و جادو.',
      ahrimanChoiceTitle: 'نهادن کلاهخود دیو سفید بر سر و تصرف مازندران (راه اهریمن)',
      ahrimanChoiceDesc:
        'دیو سفید را بکشید، سپاه دیوان بازمانده را به فرمان خود درآورید و خود فرمانروای مازندران شوید.',
      ahrimanBlessingName: 'خشم دیو سفید',
      ahrimanBlessingEffect: 'افزایش ۱۰۵٪ قدرت مرگبار گرز و شمشیر و جذب ۳۰ واحد جان.',
    },
    {
      epochIndex: 7,
      epochTitle: 'عصر هشتم · تراژدی رستم و سهراب و نوشداروی دیرهنگام',
      rulerName: 'رستم و سهراب یل',
      location: 'دشت رزم مرز ایران و توران — کنار رود جیحون',
      ferdowsiVerse: [
        'چو بگشاد خفتان و آن مهره دید / همه جامه بر خویشتن بردرید',
        'یکی داستان است پر آب چشم / دل نازک از رستم آید به خشم',
      ],
      fullShahnamehChronicle: [
        'سهرابِ نوجوان، ثمره پیوند رستم و تهمینه، بی‌آنکه پدر را دیده باشد به جست‌وجوی رستم می‌آید تا تاج ایران را به پدر بسپارد؛ اما به نیرنگ افراسیاب پدر و پسر یکدیگر را نمی‌شناسند و رستم پس از گشودن خفتان، مهره بازوبند خود را بر بازوی سهراب می‌بیند.',
      ],
      ashaChoiceTitle: 'عمل به وصیت سهراب: بخشایش لشگریان و حفظ صلح ایران (راه اَشَه)',
      ashaChoiceDesc:
        'به واپسین خواهش سهراب وفا کنید: مانع کشتار سپاهیان توران شوید و ایران‌شهر را از جنگ داخلی برهانید.',
      ashaBlessingName: 'مهره بازوبند تهمینه',
      ashaBlessingEffect: '۷۵٪ افزایش قدرت ضربه پهلوانی، سپر مقدس سده و بازگردانی ۱۸ جان.',
      ahrimanChoiceTitle: 'تاراج پرده‌سرای کاووس و غرق کردن دشت در خون (راه اهریمن)',
      ahrimanChoiceDesc:
        'از دریغ کردن نوشدارو به خشم آیید، سراپرده کاووس را واژگون سازید و سپاه توران را از دم تیغ بگذرانید.',
      ahrimanBlessingName: 'خشم سوگ دستان',
      ahrimanBlessingEffect: '۱۲۵٪ افزایش ویرانگر قدرت شکافتن و جذب ۳۵ واحد جان در هر کشتن.',
    },
    {
      epochIndex: 8,
      epochTitle: 'عصر نهم · گذر سیاوش از کوه آتش و کین‌خواهی کیخسرو',
      rulerName: 'سیاوش و شاه کیخسرو',
      location: 'کوه آتش سده تا کنگ‌دژ و دریاچه چیچست در توران',
      ferdowsiVerse: [
        'یکی کوه آتش به فرمان شاه / برافروختند از برِ چرخ و ماه',
        'سیاوش به تندی برانگیخت اسب / بشد تیز مانند آذرگشسب',
      ],
      fullShahnamehChronicle: [
        'شاهزاده سیاوش برای اثبات بی‌گناهی خود جامه سپید پوشید و بر پشت اسب سیاه خود «شبرنگ بهزاد» از میان دو کوه آتشِ شعله‌ور گذشت. پس از شهادت مظلومانه او در توران، فرزندش کیخسرو با جام جم و همراهی رستم به کین‌خواهی پدر برخاست.',
      ],
      ashaChoiceTitle: 'آیین داد کیخسرو: کیفر افراسیاب و امان دادن به مردم توران (راه اَشَه)',
      ashaChoiceDesc:
        'همچون کیخسرو دادگر، تنها افراسیاب و گرسیوزِ خون‌ریز را به سزای خون سیاوش برسانید و به مردم توران آسیبی نرسانید.',
      ashaBlessingName: 'فروغ آتش سیاوش و جام جم',
      ashaBlessingEffect: '۸۵٪ افزایش قدرت ضربه مقدس، مصونیت کامل از آتش و بازگردانی ۲۰ جان.',
      ahrimanChoiceTitle: 'کین سیاوش: به آتش کشیدن سراسر شهرهای توران (راه اهریمن)',
      ahrimanChoiceDesc:
        'فرمان دهید سپاه ایران در انتقام خون سیاوش، کنگ‌دژ و همه آبادی‌های توران را با خاک یکسان سازد.',
      ahrimanBlessingName: 'توفان خاکستر توران',
      ahrimanBlessingEffect: '۱۴۰٪ افزایش مرگبار قدرت سلاح و جذب ۳۸ واحد جان در هر کشتن.',
    },
    {
      epochIndex: 9,
      epochTitle: 'عصر دهم · رزم رستم و اسفندیار روئین‌تن و تیر گز سیمرغ',
      rulerName: 'رستم و اسفندیار روئین‌تن',
      location: 'کرانه رود هیرمند در سیستان و زابلستان',
      ferdowsiVerse: [
        'بزد تیر بر چشم اسفندیار / سیه شد جهان پیش آن نامدار',
        'نگونسار شد از برِ زین کمان / نماند ایچ با او زمان و توان',
      ],
      fullShahnamehChronicle: [
        'اسفندیار روئین‌تن به فرمان گشتاسب به سیستان آمد تا رستم را دست‌بسته به بارگاه برد. شبانگاه سیمرغ زخم‌های رستم و رخش را درمان کرد و راز تیر دوشاخه از چوب درخت «گز» را به تهمتن آموخت.',
      ],
      ashaChoiceTitle: 'سوگواری بر اسفندیار و پذیرش وصیت او برای پرورش بهمن (راه اَشَه)',
      ashaChoiceDesc:
        'تنها برای رهایی از ننگِ بند، تیر گز را رها کنید و سپس فرزندش «بهمن» را با آیین پهلوانی در زابل پرورش دهید.',
      ashaBlessingName: 'تیر گز سیمرغ',
      ashaBlessingEffect: 'شکافتن زره روئین‌تنان، ۹۵٪ افزایش آسیب و بازگردانی ۲۲ جان.',
      ahrimanChoiceTitle: 'کوری اسفندیار روئین‌تن و لشکرکشی به تخت گشتاسب (راه اهریمن)',
      ahrimanChoiceDesc:
        'تیر گز دوشاخه را بی‌درنگ بر دو چشم اسفندیار بنشانید و تابوت خونین او را برای لرزاندن تخت گشتاسب به بلخ بفرستید.',
      ahrimanBlessingName: 'نفرین خون روئین‌تن',
      ahrimanBlessingEffect: '۱۵۵٪ افزایش قدرت زره‌شکاف و جذب ۴۲ واحد جان در هر کشتن.',
    },
    {
      epochIndex: 10,
      epochTitle: 'عصر یازدهم · چاه شغاد، تیر آخر رستم از دل درخت چنار و وداع تهمتن',
      rulerName: 'رستم دستان و فرامرز',
      location: 'نخجیرگاه کابلستان — چاه نیزه‌ها و درخت چنار کهنسال',
      ferdowsiVerse: [
        'درخت و برادر به هم بر بدوخت / به هنگام رفتن دلش برفروخت',
        'چنین گفت رستم که یزدان پاک / مرا داد نیروی و هوش و تریاک',
      ],
      fullShahnamehChronicle: [
        'شغاد با شاه کابل همدست شد و در شکارگاه چاه‌هایی پر از نیزه و شمشیر کند. رخش و رستم در چاه سقوط کردند و شغاد پشت درخت چنارِ میان‌تهی پنهان شد؛ اما رستم با آخرین توش پهلوانی کمان را کشید و چنار و شغاد را به هم دوخت.',
      ],
      ashaChoiceTitle: 'دوختن شغاد به درخت چنار و نیایش یزدان در واپسین نفس (راه اَشَه)',
      ashaChoiceDesc:
        'با یک تیرِ دادگرانه شغاد خائن را در دل چنار بدوزید، یزدان پاک را سپاس گویید و با نامی نیک وداع کنید.',
      ashaBlessingName: 'تیر واپسین دستان',
      ashaBlessingEffect: '۱۱۰٪ افزایش قدرت ضربه پهلوانی، سپر مقدس و بازگردانی ۲۵ جان.',
      ahrimanChoiceTitle: 'فرمان خونین به فرامرز برای زیر و رو کردن خاک کابلستان (راه اهریمن)',
      ahrimanChoiceDesc:
        'شغاد را به درخت بدوزید و سوگند انتقام بگذارید تا فرزندتان فرامرز کابل را به آتش کشد.',
      ahrimanBlessingName: 'خشم فرامرز',
      ahrimanBlessingEffect: '۱۷۵٪ افزایش ویرانگر قدرت شکافتن و جذب ۴۸ واحد جان در هر کشتن.',
    },
    {
      epochIndex: 11,
      epochTitle: 'عصر دوازدهم · از رستم فرخزاد تا کاخ بلند نظم فردوسی',
      rulerName: 'رستم فرخزاد و حکیم ابوالقاسم فردوسی',
      location: 'از ایوان مدائن و قادسیه تا توسِ فردوسی',
      ferdowsiVerse: [
        'پی افکندم از نظم کاخی بلند / که از باد و باران نیابد گزند',
        'بسی رنج بردم در این سال سی / عجم زنده کردم بدین پارسی',
      ],
      fullShahnamehChronicle: [
        'سپهبد رستم فرخزاد با شجاعت تا آخرین قطره خون در پای درفش کاویانی می‌رزمد و در توس، حکیم ابوالقاسم فردوسی سی سال از عمر خود را بر سر شصت هزار بیتِ زرین می‌گذارد تا تاریخ، اسطوره و زبان پارسی جاودانه بماند.',
      ],
      ashaChoiceTitle: 'جاودانه ساختن کاخ بلند نظم فردوسی، خرد و زبان پارسی (راه اَشَه)',
      ashaChoiceDesc:
        'روح ایران‌شهر را در کاخ بلند سخن فردوسی، دادگری و فرهنگ جاودان سازید تا از باد و باران روزگار گزند نیابد.',
      ashaBlessingName: 'کاخ بلند نظم فردوسی',
      ashaBlessingEffect: '۱۳۵٪ قدرت ضربه نهایی، سپر شکست‌ناپذیر سده و بازگردانی ۳۰ جان.',
      ahrimanChoiceTitle: 'رزم بی‌پایان تا آخرین قطره خون در پای درفش کاویانی (راه اهریمن)',
      ahrimanChoiceDesc:
        'روح پهلوانان پیشدادی و کیانی را فراخوانید و میدان نبرد را به کارزار ابدی آهن و خون بدل سازید.',
      ahrimanBlessingName: 'رستاخیز درفش کاویانی',
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
    gameSubtitle: 'حماسه دوازده عصر شاهنامه فردوسی',
    topKicker: 'حماسه شاهنامه فردوسی',
    heroIntro:
      'از تخت پلنگینه کیومرث و درفش کاویانی تا هفت‌خوان رستم، سیاوش، اسفندیار روئین‌تن، چاه شغاد و کاخ بلند نظم فردوسی.',
    startChronicleBtn: 'آغاز نبرد (عصر اول)',
    jumpToHushangBtn: 'رزم رستم و اسفندیار',
    versionManifestBtn: 'فهرست عصرها',
    settingsBtn: 'تنظیمات',
    controlHintLine: 'حرکت پهلوان · ضربه گرز · سنگ آتشین سده · کمند دیوبند · طومار داستان',
    hudVitalityLabel: 'فره ایزدی',
    hudStabilityLabel: 'ثبات ایران‌شهر',
    hudAlignmentLabel: 'تراز اخلاقی',
    hudRenownLabel: 'نام‌آوری',
    hudSadehFlintLabel: 'سنگ سده',
    hudDivBandLabel: 'کمند دیوبند',
    hudBraziersLabel: 'آتشدان سده',
    hudDecreeReadyBtn: 'طومار داستان',
    hudChooseAshaBtn: 'راه اَشَه (خیر)',
    hudChooseAhrimanBtn: 'راه اهریمن (شر)',
    hudEpochSelectLabel: 'عصر:',
    stanceAsha: 'راه اَشَه (خیر)',
    stanceAhriman: 'راه اهریمن (شر)',
    stanceBalance: 'تراز سپیده‌دم',
    pauseTitle: 'توقف بازی',
    pauseSubtitle: '«پی افکندم از نظم کاخی بلند / که از باد و باران نیابد گزند»',
    resumeBtn: 'ادامه نبرد',
    restartBtn: 'آغاز دوباره این عصر',
    returnTitleBtn: 'صفحه نخست',
    fullStoryReaderBtn: 'طومار داستان شاهنامه',
    settingsModalTitle: 'تنظیمات گرافیک، صدا، دشواری و زبان',
    settingsModalSubtitle: 'تنظیم کیفیت تصویر، شدت خونریزی، صدا و زبان بازی',
    qualitySectionTitle: '۱. کیفیت گرافیک و جزئیات',
    audioSectionTitle: '۲. تنظیمات صدا و موسیقی',
    gameplaySectionTitle: '۳. درجه سختی نبرد',
    languageSectionTitle: '۴. زبان بازی',
    presetLow: 'کم',
    presetMedium: 'متوسط',
    presetHigh: 'زیاد',
    presetUltra: 'حداکثر',
    diffStory: 'داستانی',
    diffBalanced: 'متعادل',
    diffHard: 'دشوار',
    diffMax: 'حداکثر',
  },
  fa_classical: {
    dir: 'rtl',
    gameTitle: 'شاهنامه فردوسی: فره و اهریمن',
    gameSubtitle: 'طومار دوازده عصر از کیومرث تا کاخ نظم فردوسی',
    topKicker: 'طومار شاهنامه فردوسی',
    heroIntro:
      'بشنو از فردوسی پاک‌زاد؛ از روزگار کیومرث بر کوه البرز تا هفت‌خوان رستم، آتش سیاوش، اسفندیار و چاه شغاد.',
    startChronicleBtn: 'گشودن طومار از کیومرث',
    jumpToHushangBtn: 'رزم رستم و اسفندیار',
    versionManifestBtn: 'کارنامه عصرها',
    settingsBtn: 'آرایش و تنظیمات',
    controlHintLine: 'خرامیدن · گرز و شمشیر · سنگ آتشین سده · کمند دیوبند · طومار شاهنامه',
    hudVitalityLabel: 'فره کیانی',
    hudStabilityLabel: 'آبادانی ایران‌شهر',
    hudAlignmentLabel: 'گوهر درون',
    hudRenownLabel: 'نام و ننگ',
    hudSadehFlintLabel: 'سنگ آتشین',
    hudDivBandLabel: 'کمند دیوبند',
    hudBraziersLabel: 'آتشدان سده',
    hudDecreeReadyBtn: 'طومار شاهنامه',
    hudChooseAshaBtn: 'آیین اَشَه (خیر)',
    hudChooseAhrimanBtn: 'آیین اهریمن (شر)',
    hudEpochSelectLabel: 'عصر:',
    stanceAsha: 'فروغ اَشَه',
    stanceAhriman: 'کین اهریمن',
    stanceBalance: 'میانه راز',
    pauseTitle: 'درنگ در ایوان البرز',
    pauseSubtitle: '«بسی رنج بردم در این سال سی / عجم زنده کردم بدین پارسی»',
    resumeBtn: 'بازگشت به رزمگاه',
    restartBtn: 'نوسازی این نبرد',
    returnTitleBtn: 'سرآغاز نامه',
    fullStoryReaderBtn: 'طومار نقالی شاهنامه',
    settingsModalTitle: 'آرایش نگارگری، خنیاگری و دشواری رزم',
    settingsModalSubtitle: 'فرمان بر جزئیات نقش‌مایه‌ها، نوای موسیقی و تندخویی دیوان',
    qualitySectionTitle: '۱. پایه نگارگری و ذرات زرین',
    audioSectionTitle: '۲. خنیاگری و کوبش دف',
    gameplaySectionTitle: '۳. دشواری کارزار با دیوان',
    languageSectionTitle: '۴. زبان و شیوه سخن',
    presetLow: 'کمینه',
    presetMedium: 'میانه',
    presetHigh: 'برتر',
    presetUltra: 'حداکثر',
    diffStory: 'رام',
    diffBalanced: 'همتراز',
    diffHard: 'سهمگین',
    diffMax: 'حداکثر',
  },
  en: {
    dir: 'ltr',
    gameTitle: 'SHAHNAMEH: CROWN OF ASHES & LIGHT',
    gameSubtitle: 'Twelve-Epoch Epic Chronicle of Ferdowsi',
    topKicker: 'Ferdowsi’s Shahnameh Chronicle',
    heroIntro:
      'From Keyumars and Hushang to Rostam’s Seven Labors, Sohrab, Siyavash, Esfandiyar the Brazen-Bodied, and Ferdowsi’s immortal verse.',
    startChronicleBtn: 'Start Battle (Epoch I)',
    jumpToHushangBtn: 'Rostam & Esfandiyar',
    versionManifestBtn: 'Epochs List',
    settingsBtn: 'Settings',
    controlHintLine: 'Move · Strike · Sadeh Flint · Div-Band · Story Scroll',
    hudVitalityLabel: 'ROYAL FARR',
    hudStabilityLabel: 'STABILITY',
    hudAlignmentLabel: 'ALIGNMENT',
    hudRenownLabel: 'RENOWN',
    hudSadehFlintLabel: 'Sadeh Flint',
    hudDivBandLabel: 'Div-Band',
    hudBraziersLabel: 'Braziers',
    hudDecreeReadyBtn: 'Story Scroll',
    hudChooseAshaBtn: 'Path of Asha (Good)',
    hudChooseAhrimanBtn: 'Path of Ahriman (Evil)',
    hudEpochSelectLabel: 'Epoch:',
    stanceAsha: 'Path of Asha (Good)',
    stanceAhriman: 'Path of Ahriman (Evil)',
    stanceBalance: 'Twilight Balance',
    pauseTitle: 'Game Paused',
    pauseSubtitle: '“I raised up from verse a high palace of gold, that neither the wind nor the rain shall make old.”',
    resumeBtn: 'Resume Battle',
    restartBtn: 'Restart Epoch',
    returnTitleBtn: 'Title Screen',
    fullStoryReaderBtn: 'Story Scroll',
    settingsModalTitle: 'Graphics, Audio, Difficulty & Language Settings',
    settingsModalSubtitle: 'Configure 3D detail, blood intensity, audio, and language',
    qualitySectionTitle: '1. Graphics & Detail',
    audioSectionTitle: '2. Audio & Music',
    gameplaySectionTitle: '3. Combat Difficulty',
    languageSectionTitle: '4. Language',
    presetLow: 'Low',
    presetMedium: 'Medium',
    presetHigh: 'High',
    presetUltra: 'Maximum',
    diffStory: 'Story',
    diffBalanced: 'Balanced',
    diffHard: 'Hard',
    diffMax: 'Maximum',
  },
};
