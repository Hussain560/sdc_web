/**
 * About page strings (PUBLIC-SCREENS-V2/06-about.md). Vision and mission are the approved wording of
 * docs/00-product/vision-mission.md. The offers, steps and values below are drafted from the approved design
 * and wait for the owner's review (Q-A1); they are plain data here so the review is one place.
 */
export const ABOUT_COPY = {
  ar: {
    home: 'الرئيسية',
    title: 'من نحن',
    breadcrumb: 'مسار التنقل',
    intro:
      'المجتمع السعودي مجتمع تقني غير ربحي يهدف إلى تمكين المطورين والمهتمين بالتقنية من اكتساب الخبرات العملية وبناء مشاريع حقيقية، ونشر المعرفة في مجالات الذكاء الاصطناعي والتقنيات الحديثة، وإثراء المحتوى العربي التقني.',
    apply: 'قدّم طلب العضوية',
    browseEvents: 'تصفّح الفعاليات',
    numbers: 'المجتمع بالأرقام',
    figures: {
      events: {
        title: 'فعاليات أقمناها',
        note: (year: string) => `ورش ومعسكرات ولقاءات منذ ${year}`,
      },
      committees: { title: 'لجان نشطة', note: 'لكل لجنة مجال واضح وفريق تطوعي' },
      members: { title: 'عضواً في الدليل', note: 'ممن اختاروا الظهور للعموم' },
      certificates: { title: 'شهادة صدرت', note: 'شهادات حضور موثّقة يمكن التحقق منها' },
    },
    topicsLabel: 'مجالاتنا',
    topics: [
      'الذكاء الاصطناعي',
      'الأمن السيبراني',
      'تطوير الويب',
      'تحليل البيانات',
      'التصميم',
      'تحديات CTF',
      'ريادة الأعمال',
      'تطوير التطبيقات',
    ],
    pause: 'إيقاف الحركة',
    play: 'تشغيل الحركة',
    visionMission: 'رؤيتنا ورسالتنا',
    choose: 'اختر',
    vision: 'رؤيتنا',
    visionText:
      'أن نكون الحاضنة الأكبر للمطورين السعوديين وأصحاب العقول المتميزة في مجال الذكاء الاصطناعي.',
    mission: 'رسالتنا',
    missionText:
      'تمكين المطورين السعوديين من خلال التعليم، والتعاون، وبناء مشاريع تقنية تسهم في النهضة الرقمية.',
    offerTitle: 'ماذا نقدّم',
    offerLede: 'كل ما نقدّمه مجاني ومفتوح للجميع.',
    offers: [
      ['Wrench', 'ورش العمل', 'تطبيق عملي في جلسة أو أكثر يقدّمه مختصون.'],
      ['Tent', 'المعسكرات', 'أيام مكثّفة في مجال واحد، من الأمن السيبراني إلى ريادة الأعمال.'],
      ['Trophy', 'الهاكاثونات', 'فرق تبني حلولاً حقيقية في وقت محدود.'],
      ['Mic', 'اللقاءات والمحاضرات', 'حوارات مفتوحة مع مختصين، حضورياً وعن بُعد.'],
      ['BookOpen', 'المحتوى التقني', 'مقالات يكتبها الأعضاء لإثراء المحتوى العربي.'],
      ['Award', 'شهادات الحضور', 'شهادة موثّقة تصلك بالبريد بعد الفعالية، ويمكن التحقق منها.'],
    ],
    how: 'كيف نعمل',
    howLede: 'لجان تقود، وفعاليات تجمع، وأعضاء يصنعون الأثر.',
    steps: [
      ['اللجان', 'فرق تطوعية لكل منها مجال واضح.', '/committees'],
      ['الفعاليات', 'ورش ولقاءات مفتوحة طوال العام.', '/events'],
      ['الأعضاء', 'مطورون يتعلمون ويشاركون ويبنون.', '/members'],
    ],
    committees: 'لجاننا',
    committeesLede: 'فرق تطوعية، لكل منها مجال واضح.',
    allCommittees: 'كل اللجان',
    values: 'قيمنا',
    valuesLede: 'مبادئ نعمل بها كل يوم، ولا يخالفها أي قرار في المجتمع.',
    valueList: [
      ['غير ربحي ومجاني', 'لا مزايا مدفوعة، وكل فعالياتنا مجانية.'],
      ['العربية أولاً', 'العربية لغتنا الأساسية، والإنجليزية كاملة لا ناقصة.'],
      [
        'قائم على التطوع',
        'فرق تطوعية بأدوار واضحة، وطرق عمل بسيطة وموثّقة يتسلّمها من يأتي بعدنا.',
      ],
      [
        'مشاركة عادلة وشفافة',
        'العضوية عبر دورة معلنة ومحددة المدة، مفتوحة لكل من تنطبق عليه الشروط، وتُسجَّل قراراتها.',
      ],
      ['مشاركة المعرفة', 'محتوانا متاح للجميع ما لم يكن هناك سبب لغير ذلك.'],
      ['احترام الخصوصية', 'يختار الأعضاء ما يظهر للعموم، ولا تُنشر بيانات التواصل.'],
    ],
    timeline: 'محطات من رحلتنا',
    timelineLede: 'نظرة على ما أنجزناه معاً.',
    timelineLabel: 'محطات المجتمع، مرّر أفقياً',
    pastEvents: 'الفعاليات السابقة',
    leadership: 'القيادة',
    leadershipLede: 'يظهر هنا من وافق على الظهور للعموم فقط.',
    allMembers: 'تعرّف على كل الأعضاء',
    cta: 'انضم إلى المجتمع',
    ctaLine: 'مجتمع يفتح لك الباب للتعلّم والمشاركة وبناء العلاقات المهنية.',
  },
  en: {
    home: 'Home',
    title: 'About',
    breadcrumb: 'Breadcrumb',
    intro:
      'The Saudi community is a non-profit tech community that empowers developers and technology enthusiasts to gain practical experience, build real projects, share knowledge in AI and modern technologies, and enrich Arabic technical content.',
    apply: 'Apply for membership',
    browseEvents: 'Browse events',
    numbers: 'The community in numbers',
    figures: {
      events: {
        title: 'Events we ran',
        note: (year: string) => `Workshops, bootcamps and meetups since ${year}`,
      },
      committees: {
        title: 'Active committees',
        note: 'Each with a clear focus and a volunteer team',
      },
      members: { title: 'Members in the directory', note: 'Who chose to be public' },
      certificates: {
        title: 'Certificates issued',
        note: 'Attendance certificates anyone can verify',
      },
    },
    topicsLabel: 'Our fields',
    topics: [
      'Artificial intelligence',
      'Cybersecurity',
      'Web development',
      'Data analysis',
      'Design',
      'CTF challenges',
      'Entrepreneurship',
      'App development',
    ],
    pause: 'Pause motion',
    play: 'Play motion',
    visionMission: 'Our vision and mission',
    choose: 'Choose',
    vision: 'Our vision',
    visionText:
      'To be the leading hub for Saudi developers and exceptional minds in artificial intelligence.',
    mission: 'Our mission',
    missionText:
      'Empowering Saudi developers through education, collaboration and building technical projects that contribute to digital growth.',
    offerTitle: 'What we offer',
    offerLede: 'Everything we offer is free and open to everyone.',
    offers: [
      ['Wrench', 'Workshops', 'Hands-on practice in one or more sessions, led by specialists.'],
      ['Tent', 'Bootcamps', 'Intensive days in one field, from cybersecurity to entrepreneurship.'],
      ['Trophy', 'Hackathons', 'Teams build real solutions in limited time.'],
      ['Mic', 'Meetups and talks', 'Open conversations with specialists, in person and online.'],
      [
        'BookOpen',
        'Technical content',
        'Articles written by members to enrich Arabic technical content.',
      ],
      [
        'Award',
        'Attendance certificates',
        'A verifiable certificate in your inbox after the event.',
      ],
    ],
    how: 'How we work',
    howLede: 'Committees lead, events bring people together, and members make the impact.',
    steps: [
      ['Committees', 'Volunteer teams, each with a clear focus.', '/committees'],
      ['Events', 'Open workshops and meetups all year.', '/events'],
      ['Members', 'Developers who learn, take part and build.', '/members'],
    ],
    committees: 'Our committees',
    committeesLede: 'Volunteer teams, each with a clear focus.',
    allCommittees: 'All committees',
    values: 'Our values',
    valuesLede:
      'Principles we work by every day, and no decision in the community goes against them.',
    valueList: [
      ['Non-profit and free', 'No paid perks, and every event is free.'],
      ['Arabic first', 'Arabic is our main language, and English is complete, not partial.'],
      [
        'Run by volunteers',
        'Volunteer teams with clear roles and simple, written ways of working for whoever comes next.',
      ],
      [
        'Fair and open participation',
        'Membership runs through an announced, time-limited cycle, open to everyone who meets the conditions, and decisions are recorded.',
      ],
      [
        'Sharing knowledge',
        'Our content is open to everyone unless there is a reason it should not be.',
      ],
      [
        'Respect for privacy',
        'Members choose what the public sees, and contact details are never published.',
      ],
    ],
    timeline: 'Milestones from our journey',
    timelineLede: 'A look at what we have done together.',
    timelineLabel: 'Community milestones, scroll sideways',
    pastEvents: 'Past events',
    leadership: 'Leadership',
    leadershipLede: 'Only people who agreed to be public are shown here.',
    allMembers: 'Meet all members',
    cta: 'Join the community',
    ctaLine:
      'A community that opens the door to learning, taking part and building professional relationships.',
  },
} as const;

export type AboutCopy = (typeof ABOUT_COPY)['ar'] | (typeof ABOUT_COPY)['en'];
