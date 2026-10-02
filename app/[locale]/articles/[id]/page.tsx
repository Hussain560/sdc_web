'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Calendar, Clock, User } from 'lucide-react';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { useLanguage } from '@/context/LanguageContext';
import type { Localized } from '@/types/content';
import './article-details.css';

interface ArticleRecord {
  title: Localized;
  author: Localized;
  date: Localized;
  readTime: Localized;
  tags: Localized<string[]>;
  content: Localized;
  sourceLink?: string;
  sourceLabel?: Localized;
}

const articlesDatabase: Record<string, ArticleRecord> = {
  '1': {
    title: { ar: 'هندسة الأوامر (Prompt Engineering)', en: 'Prompt Engineering' },
    author: { ar: 'لجنة الذكاء الاصطناعي', en: 'AI Committee' },
    date: { ar: '15 أغسطس 2024', en: 'August 15, 2024' },
    readTime: { ar: '3 دقائق', en: '3 min' },
    tags: {
      ar: ['ذكاء اصطناعي', 'هندسة الأوامر', 'Prompt Engineering'],
      en: ['AI', 'Prompt Engineering', 'LLM'],
    },
    content: {
      ar: `هندسة الأوامر (Prompt Engineering) هي عملية تصميم وتحسين الأوامر التي يتم إدخالها إلى نماذج الذكاء الاصطناعي، بهدف توجيهها للحصول على نتائج أكثر دقة وملاءمة للسياق من خلال اختيار الكلمات وصياغة الطلب بطريقة مدروسة.

تُستخدم هندسة الأوامر في العديد من المجالات، منها معالجة اللغة الطبيعية مثل تلخيص النصوص والترجمة، وروبوتات المحادثة والمساعدات الذكية، وأنظمة التوصية، وتوليد المحتوى، وتحليل البيانات، وأنظمة الإجابة عن الأسئلة.

وتكمن أهميتها في تحسين التفاعل بين الإنسان والذكاء الاصطناعي، ومساعدة النماذج على فهم استفسارات المستخدم بشكل أدق، وتطوير حلول فعالة للمهام المتخصصة، بالإضافة إلى دورها في تحسين أداء نماذج اللغة من خلال تجربة المدخلات وتحليل النتائج.

ولكتابة أمر أكثر فاعلية يمكن الاهتمام بعدة عناصر، مثل تحديد المهمة بوضوح، وإضافة السياق والمعلومات اللازمة، وتقديم مثال عند الحاجة، وتحديد الدور أو الشخصية المطلوبة من النموذج، وتوضيح شكل المخرجات، وتحديد نبرة الكتابة المناسبة.

كلما كان الطلب أكثر وضوحًا وتفصيلًا، ساعد ذلك في الحصول على إجابة أكثر دقة وجودة.

وللتوسع في المجال، يوفر المجتمع ملفًا يضم مجموعة من المصادر التعليمية حول هندسة الأوامر، تشمل مقالات ومدونات ودورات تعليمية.`,

      en: `Prompt Engineering is the process of designing and improving prompts entered into AI models to guide them toward more accurate and context-appropriate results through careful wording and clear instructions.

It is used in many areas, including natural language processing tasks such as text summarization and translation, chatbots and intelligent assistants, recommendation systems, content generation, data analysis, and question-answering systems.

Prompt engineering improves human-AI interaction by helping models understand user requests more accurately. It can also support the development of effective solutions for specialized tasks and improve language model performance through experimentation and analysis of different inputs.

An effective prompt can include several elements, such as a clearly defined task, relevant context, examples when needed, a specified role or persona, the desired output format, and an appropriate writing tone.

In general, the clearer and more detailed the request is, the more accurate and useful the resulting response can be.

For further learning, the community provides a collection of educational resources about Prompt Engineering, including articles, blogs, and courses.`,
    },

    sourceLink:
      'https://drive.google.com/file/d/1zBwwEHcTvdgtgIAybbD2TYTAPYbqsN00/view?usp=drivesdk',

    sourceLabel: {
      ar: 'مصادر تعلم هندسة الأوامر',
      en: 'Prompt Engineering Learning Resources',
    },
  },
  '2': {
    title: { ar: 'تقنية Voice2Face', en: 'Voice2Face Technology' },
    author: {
      ar: 'الين الزهراني – مريم النعيم – غلا العتيبي',
      en: 'Alin Al-Zahrani – Maryam Al-Neaim – Ghala Alotibi',
    },
    date: { ar: '25 نوفمبر 2024', en: 'November 25, 2024' },
    readTime: { ar: '3 دقائق', en: '3 min' },
    tags: { ar: ['ذكاء اصطناعي', 'Python', 'تعلم'], en: ['AI', 'Python', 'Learning'] },
    content: {
      ar: `تقنية Voice2Face هي إحدى تقنيات الذكاء الاصطناعي التوليدي التي تهدف إلى إنشاء صورة تقريبية لملامح الوجه بالاعتماد على الصوت فقط.

تعتمد التقنية على نماذج وشبكات عصبية عميقة يتم تدريبها باستخدام بيانات تربط بين صور الوجوه والمقاطع الصوتية، حتى تتعلم العلاقات بين خصائص الصوت وبعض السمات المرئية للوجه. وعند إدخال صوت جديد، يحاول النموذج إنشاء وجه تقريبي استنادًا إلى الأنماط التي تعلمها.

يمكن الاستفادة من هذه التقنية في عدة مجالات، مثل الأمن والتحقيقات الجنائية للمساعدة في تضييق نطاق الاحتمالات، وخدمة العملاء والتجارب الرقمية، والتفاعل الاجتماعي، وصناعة الألعاب، والإنتاج السينمائي والتلفزيوني.

كما ظهرت تجارب وتطبيقات تستخدم تقنيات مشابهة لتطوير الشخصيات الرقمية وجعل التفاعل معها أكثر تخصيصًا.

لكن Voice2Face تفتح أيضًا بابًا لتحديات مهمة، أبرزها الخصوصية والتزييف العميق والثقة بالمحتوى الرقمي. فقد تسهم تقنيات توليد الوجوه والأصوات في جعل التمييز بين المحتوى الحقيقي والمصطنع أكثر صعوبة.

لذلك تقدم Voice2Face مثالًا مثيرًا على تطور الذكاء الاصطناعي وقدرته على اكتشاف العلاقات بين الصوت والصورة، مع أهمية الانتباه إلى الاستخدام المسؤول والجوانب المتعلقة بالخصوصية والثقة الرقمية.`,

      en: `Voice2Face is a generative AI technology that aims to create an approximate facial representation using only a person's voice.

The technology relies on deep neural networks trained on data that pairs facial images with voice recordings. Through this training, the model learns relationships between vocal characteristics and certain visual facial features. When a new voice is provided, it attempts to generate an approximate face based on the patterns it has learned.

Potential applications include security and criminal investigations, customer service and digital experiences, social interaction, gaming, and film and television production.

Similar technologies have also been explored for developing digital characters and creating more personalized interactive experiences.

However, Voice2Face also raises important challenges related to privacy, deepfakes, and trust in digital content. Technologies capable of generating faces and voices can make distinguishing authentic content from synthetic content more difficult.

Voice2Face therefore provides an interesting example of how AI can discover relationships between audio and visual information, while highlighting the importance of responsible use, privacy, and digital trust.`,
    },
  },
  '3': {
    title: { ar: 'أنظمة التوصية (Recommendation Systems)', en: 'Recommendation Systems' },
    author: { ar: 'لجنة الذكاء الاصطناعي', en: 'AI Committee' },
    date: { ar: '12 سبتمبر 2025', en: 'September 12, 2025' },
    readTime: { ar: '3 دقائق', en: '3 min' },
    tags: { ar: ['انظمة', 'تعلم', 'ذكاء اصطناعي'], en: ['Systems', 'Learning', 'AI'] },
    content: {
      ar: `أنظمة التوصية (Recommendation Systems) هي أنظمة تعتمد على الذكاء الاصطناعي وتعلم الآلة وتحليل البيانات بهدف تصفية المحتوى الرقمي وتخصيصه لكل مستخدم.

تعتمد هذه الأنظمة على تحليل السلوك الرقمي، مثل عمليات البحث والمشاهدة والمشتريات والتفاعل مع المحتوى، ثم تربط هذه البيانات بالاهتمامات والأنماط لتوقع ما قد يفضله المستخدم لاحقًا.

وتستخدم أنظمة التوصية نوعين رئيسيين من البيانات: البيانات الصريحة (Explicit Data)، مثل التقييمات والتعليقات والإعجاب وعدم الإعجاب، والبيانات الضمنية (Implicit Data)، مثل سجل البحث والنقرات ومدة المشاهدة وإضافة المنتجات إلى السلة والمشتريات السابقة.

ومن أشهر طرق عملها التصفية التعاونية (Collaborative Filtering)، التي تعتمد على سلوك المستخدم وسلوك مستخدمين آخرين لديهم اهتمامات متشابهة، فتقترح محتوى أو منتجات بناءً على هذه الأنماط المشتركة.

كما توجد التصفية المعتمدة على المحتوى (Content-Based Filtering)، التي تعتمد على خصائص المحتوى الذي أعجب المستخدم سابقًا، والتصفية المعتمدة على السياق (Context-Based Filtering)، التي تأخذ في الاعتبار عوامل مثل الوقت والموقع وظروف الاستخدام.

ومن الأمثلة على ذلك المتاجر الإلكترونية مثل Amazon، حيث يمكن أن تظهر للمستخدم منتجات مشابهة لما شاهده أو اشتراه، ومنتجات تكمل مشترياته، واقتراحات مبنية على سلوك مستخدمين مشابهين.

هذه الأنظمة تجعل الوصول إلى الخيارات المناسبة أسهل وسط الكم الكبير من المحتوى والمنتجات، وتحوّل تجربة المستخدم العامة إلى تجربة أكثر تخصيصًا.

ومع ذلك، من المهم معرفة أن الأجهزة لا "تقرأ أفكارنا"، بل تقوم الأنظمة بتحليل الإشارات الناتجة عن سلوكنا الرقمي وتحويلها إلى أنماط تساعدها في تحديد ما قد يهمنا، ويبقى القرار النهائي للمستخدم.`,

      en: `Recommendation Systems use artificial intelligence, machine learning, and data analysis to filter and personalize digital content for each user.

These systems analyze digital behavior such as searches, views, purchases, and interactions, then connect these signals to patterns and interests in order to predict what the user may prefer next.

Recommendation systems use two main types of data. Explicit Data includes ratings, comments, likes, and dislikes, while Implicit Data includes search history, clicks, viewing duration, items added to a cart, and previous purchases.

One common method is Collaborative Filtering, which uses the behavior of a user and other users with similar interests to recommend content or products based on shared patterns.

Content-Based Filtering recommends items according to characteristics of content the user previously liked, while Context-Based Filtering considers factors such as time, location, and usage context.

Online stores such as Amazon provide a familiar example, where users may receive recommendations for similar products, complementary purchases, or suggestions based on the behavior of similar users.

These systems make it easier to navigate large amounts of content and products while creating a more personalized user experience.

However, these systems do not literally read our thoughts. They analyze signals produced by our digital behavior and transform them into patterns that help predict what may interest us, while the final choice remains with the user.`,
    },
  },
  '4': {
    title: { ar: 'التطبيقات الصينية والإنجليزية', en: 'Chinese and English Applications' },
    author: { ar: 'لجنة الذكاء الاصطناعي', en: 'AI Committee' },
    date: { ar: '11 يونيو 2023', en: 'June 11, 2023' },
    readTime: { ar: '4 دقائق', en: '4 min' },
    tags: { ar: ['تقنية', 'Language', 'تعلم'], en: ['Technology', 'Language', 'Learning'] },
    content: {
      ar: `تختلف واجهات التطبيقات الصينية والإنجليزية في العديد من التفاصيل، ويعود جزء كبير من هذه الاختلافات إلى الثقافة وعادات المستخدمين وتوقعاتهم من تجربة التطبيق.

من أبرز الاختلافات المساحات البيضاء؛ إذ قد تبدو بعض التطبيقات الصينية مزدحمة للمستخدم الغربي بسبب اختلاف استخدام المساحات وأحجام النصوص وارتفاع الأسطر. وفي المقابل، تميل هذه التطبيقات إلى وضع قدر أكبر من الوظائف والنصوص والمعلومات والصور في المساحة نفسها.

وتنتشر النوافذ المنبثقة الترويجية في بعض التطبيقات الصينية بشكل أكبر. ويمكن تشبيه ذلك بأجواء الأسواق الصينية المزدحمة التي يحاول فيها البائعون جذب انتباه الزوار، وهي تجربة قد تبدو مزعجة لبعض المستخدمين من ثقافات أخرى لكنها مألوفة لدى مستخدمين آخرين.

وتختلف أيضًا أيقونات التطبيقات؛ إذ تستخدم بعض التطبيقات الصينية الأحرف الصينية والعناصر البصرية داخل الأيقونة، وقد تتغير الأيقونة بحسب المواسم والمناسبات لجذب انتباه المستخدم، كما ظهر في بعض التطبيقات خلال أحداث ومناسبات مختلفة.

أما شاشات بداية التطبيق، فقد تستخدم بعض التطبيقات الصينية الإعلانات أو المحتوى الترويجي بدلًا من الاكتفاء بعرض شعار التطبيق.

كما تميل بعض التصاميم الصينية إلى استخدام ألوان متعددة ودافئة وعناصر بصرية كثيرة لجذب الانتباه.

وتظهر الحيوانات كذلك كرموز تحمل معاني ثقافية؛ فبعض الحيوانات لها دلالات خاصة في الثقافة الصينية، مثل ارتباط بعض الرموز بطول العمر أو الثراء، ويمكن الاستفادة منها في تصميم هوية التطبيق.

هذه الاختلافات توضح أن تصميم واجهات وتجربة المستخدم لا يعتمد على الجانب الجمالي فقط، بل يتأثر أيضًا بثقافة المستخدم وعاداته وتوقعاته.`,

      en: `Chinese and English-language applications can differ in many interface details, with much of this variation influenced by culture, user habits, and expectations.

One noticeable difference is the use of white space. Some Chinese applications may appear visually dense to Western users because of different approaches to spacing, text size, and line height. They may also place more functionality, text, information, and images within the same screen space.

Promotional pop-ups are also common in some Chinese applications. This can be compared to the busy atmosphere of physical markets where sellers actively compete for attention. While this may feel distracting to users from other cultures, it can be more familiar to local users.

Application icons can also differ. Some Chinese apps use Chinese characters and additional visual elements, and icons may change according to seasons or major events to attract attention.

Some Chinese applications may display advertising or promotional material on their launch screens rather than showing only the application logo.

Their interfaces may also use multiple warm and vivid colors to draw attention.

Animals can appear as culturally meaningful symbols as well. Certain animals carry specific meanings in Chinese culture, such as associations with longevity or wealth, which can influence branding and interface design.

These differences demonstrate that UI and UX design are shaped not only by visual aesthetics but also by culture, habits, and user expectations.`,
    },
  },
  '5': {
    title: {
      ar: 'الذكاء الاصطناعي في الألعاب والتعلّم المعزّز',
      en: 'AI in Games and Reinforcement Learning',
    },
    author: { ar: 'لجنة الذكاء الاصطناعي', en: 'AI Committee' },
    date: { ar: '17 اكتوبر 2025', en: 'October 17, 2025' },
    readTime: { ar: '3 دقائق', en: '3 min' },
    tags: { ar: ['ذكاء اصطناعي', 'NLP', 'لغة طبيعية'], en: ['AI', 'NLP', 'Natural Language'] },
    content: {
      ar: `كيف يستطيع الذكاء الاصطناعي التفوق في الألعاب واتخاذ قرارات ذكية؟ إحدى التقنيات الأساسية وراء ذلك هي التعلم المعزز (Reinforcement Learning).

في هذا النوع من التعلم يوجد وكيل ذكي (Agent) يتفاعل مع بيئة معينة (Environment). يراقب الوكيل الحالة (State)، ثم يختار فعلًا معينًا (Action)، ويحصل بعد ذلك على مكافأة أو عقوبة (Reward) بناءً على نتيجة قراره.

الوكيل الذكي هو الكيان الذي يتخذ القرارات والأفعال داخل اللعبة. ومع تكرار التجارب يتعلم تحسين استراتيجيته واختيار القرارات التي تحقق نتائج أفضل.

أما البيئة (Environment) فهي كل ما يحيط بالوكيل، مثل قواعد اللعبة ومواقع الأشياء وتصرفات الخصوم والتحديات والنتائج المترتبة على أفعاله. ومع كل خطوة تتغير استجابة البيئة للفعل وتمنح الوكيل مكافأة أو تغذية راجعة تساعده على التعلم.

تبدأ عملية التعلم عندما يجرب الوكيل حركة، ثم تعطيه البيئة نتيجة قد تكون نجاحًا أو فشلًا، وبعدها يحصل على مكافأة أو عقوبة. ومع تكرار آلاف المحاولات يتعلم الأفعال التي تمنحه مكافآت أكبر ويبني استراتيجية أفضل للوصول إلى الفوز.

ومن التقنيات المتقدمة التعلم المعزز العميق (Deep Reinforcement Learning)، الذي يجمع بين التعلم المعزز وتقنيات التعلم العميق للتعامل مع مواقف أكثر تعقيدًا.

ولا يقتصر استخدام التعلم المعزز على الألعاب، بل توجد له تطبيقات في السيارات ذاتية القيادة لتعلم الطرق، وأنظمة التنبؤ والتحكم في الاقتصاد والطاقة، والروبوتات التي تتعلم الحركة.

ويستطيع الذكاء الاصطناعي التفوق في بعض الألعاب لأنه قادر على خوض عدد هائل من التجارب بسرعة، وتذكر الاستراتيجيات والنتائج، والاستمرار في التعلم والتكرار دون توقف، مما يمنحه قدرة كبيرة على تحسين أدائه.`,

      en: `How can artificial intelligence become highly capable at games and make intelligent decisions? One of the key techniques behind this is Reinforcement Learning.

In reinforcement learning, an intelligent Agent interacts with an Environment. The agent observes the current State, chooses an Action, and then receives a Reward or penalty based on the outcome of its decision.

The agent is the entity responsible for making decisions and performing actions inside the game. Through repeated experiences, it learns to improve its strategy and select actions that produce better results.

The Environment includes everything surrounding the agent, such as game rules, object locations, opponents, challenges, and the consequences of its actions. After each action, the environment responds and provides a reward or feedback that helps the agent learn.

The learning process begins when the agent attempts an action. The environment then produces an outcome, such as success or failure, followed by a reward or penalty. After thousands of attempts, the agent learns which actions produce higher rewards and develops a stronger strategy.

Deep Reinforcement Learning combines reinforcement learning with deep learning techniques to handle more complex situations.

Its applications extend beyond games to self-driving cars learning road navigation, prediction and control systems in economics and energy, and robots learning how to move.

AI can become extremely capable in some games because it can perform huge numbers of experiments quickly, remember strategies and outcomes, and continuously learn through repetition.`,
    },
  },
  '6': {
    title: {
      ar: 'تطبيقات الذكاء الاصطناعي في تحليل المشاعر',
      en: 'AI Applications in Sentiment Analysis',
    },
    author: { ar: 'لجنة الذكاء الاصطناعي', en: 'AI Committee' },
    date: { ar: '26 سبتمبر 2025', en: 'September 26, 2025' },
    readTime: { ar: '4 دقائق', en: '4 min' },
    tags: { ar: ['ذكاء اصطناعي', 'أخلاقيات', 'AI '], en: ['AI', 'Ethics', 'AI'] },
    content: {
      ar: `أصبح الذكاء الاصطناعي جزءًا من حياتنا اليومية، ومن المجالات التي تتطور باستمرار قدرته على تحليل المشاعر البشرية والتفاعل معها بصورة أكثر ملاءمة.

تحليل المشاعر هو قدرة الأنظمة على التعرف على مؤشرات مرتبطة بالمشاعر البشرية باستخدام تقنيات مختلفة، مثل تحليل النصوص والتعرف على تعبيرات الوجه وتحليل نبرة الصوت، بهدف تحسين التفاعل وفهم المستخدم بصورة أفضل.

في تحليل النصوص، تُستخدم تقنيات تحليل المشاعر لفهم الكلمات والجمل المكتوبة والتعرف على المشاعر أو الانطباعات التي تعكسها.

أما التعرف على تعبيرات الوجه، فيعتمد على الكاميرات وتقنيات الرؤية الحاسوبية لتحليل تعبيرات قد ترتبط بمشاعر مثل السعادة أو الغضب أو الحزن.

وفي تحليل الصوت، يمكن للذكاء الاصطناعي تحليل نبرة الصوت واستخدامها كمؤشر يساعد في تقدير الحالة العاطفية للمتحدث.

وتوجد لهذه التقنيات تطبيقات في مجالات متعددة. ففي الرعاية الصحية يمكن استخدام الأجهزة الذكية لمتابعة مؤشرات مثل التوتر والقلق، كما يمكن لروبوتات المحادثة تحليل اللغة المكتوبة أو الصوتية وتقديم تفاعل داعم، لتكون أداة مساندة للمتخصصين.

وفي التسويق يمكن للشركات تحليل مشاعر المستخدمين وتفاعلهم مع المنتجات، والاستفادة من النتائج في فهم الجمهور ودعم الحملات التسويقية وتحسين الخدمات بما يناسب احتياجات العملاء.

وفي التعليم يمكن للأنظمة الذكية تحليل مؤشرات مثل تعبيرات الوجه وحركات العين والتفاعل أثناء التعلم، بما يساعد المعلمين على فهم احتياجات الطلاب بصورة أفضل وتقديم الدعم المناسب وتحسين تجربة التعليم وفق الفروقات الفردية.

أما وسائل التواصل الاجتماعي، فتحتوي على عدد ضخم من الإعجابات والتعليقات والصور ومقاطع الفيديو. ويمكن للذكاء الاصطناعي تحليل هذه التفاعلات واستخلاص مؤشرات عن انطباعات الجمهور، مما يساعد في معرفة المحتوى الذي يفضله المستخدمون وفهم الانطباع العام.

ورغم أن هذا المجال لا يزال في مراحل تطور مستمرة، فإن تطبيقاته تظهر إمكانات واعدة في العديد من المجالات. ويبقى السؤال: إلى أي مدى يمكن للآلة أن تفهم مشاعر الإنسان فعلًا؟`,

      en: `Artificial intelligence has become part of everyday life, and one continuously developing area is its ability to analyze indicators associated with human emotions and respond more appropriately.

Sentiment and emotion analysis refers to the ability of systems to identify emotional indicators using techniques such as text analysis, facial-expression recognition, and voice-tone analysis in order to improve interaction and better understand users.

In text analysis, sentiment-analysis techniques examine written words and sentences to identify the emotions or impressions they may express.

Facial-expression recognition uses cameras and computer-vision technologies to analyze expressions that may be associated with emotions such as happiness, anger, or sadness.

Voice analysis can examine tone and use it as one indicator for estimating the emotional state of a speaker.

These technologies have applications across several fields. In healthcare, smart devices can help monitor indicators such as stress and anxiety, while chatbots can analyze written or spoken language and provide supportive interactions as tools that assist professionals.

In marketing, companies can analyze customer reactions and interactions with products, using the results to better understand audiences, support marketing campaigns, and improve services.

In education, intelligent systems can analyze signals such as facial expressions, eye movements, and engagement during learning. This may help teachers better understand individual student needs and provide more appropriate support.

Social media contains enormous amounts of likes, comments, images, and videos. AI can analyze these interactions to identify patterns in audience sentiment, understand which content users prefer, and estimate general reactions.

Although this field is still developing, its applications show promising possibilities across many areas. The broader question remains: to what extent can a machine truly understand human emotions?`,
    },
  },
};

export default function ArticleDetailPage() {
  const params = useParams();
  const articleId = String(params?.id ?? '1');
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';
  const article: ArticleRecord = articlesDatabase[articleId] ?? articlesDatabase['1']!;

  return (
    <div className="sdc-article-detail-wrapper">
      <Header />

      <main className="sdc-article-detail-main">
        <section className="sdc-article-hero-banner">
          <div className="sdc-article-hero-container">
            <nav className="sdc-article-breadcrumb">
              <Link href="/">{isEnglish ? 'Home' : 'الرئيسية'}</Link>
              <span className="sdc-article-bc-sep">&gt;</span>
              <Link href="/articles">{isEnglish ? 'Articles' : 'المقالات'}</Link>
              <span className="sdc-article-bc-sep">&gt;</span>
              <span style={{ color: '#00E676' }}>{article.title[isEnglish ? 'en' : 'ar']}</span>
            </nav>

            <h1 className="sdc-article-hero-title">{article.title[isEnglish ? 'en' : 'ar']}</h1>
          </div>
        </section>

        <div className="sdc-article-container">
          <header className="sdc-article-header">
            <div className="sdc-article-meta-row">
              <span>
                <User size={14} /> {article.author[isEnglish ? 'en' : 'ar']}
              </span>
              <span>
                <Calendar size={14} /> {article.date[isEnglish ? 'en' : 'ar']}
              </span>
              <span>
                <Clock size={14} /> {article.readTime[isEnglish ? 'en' : 'ar']}
              </span>
            </div>

            <div className="sdc-article-tags-row">
              {article.tags[isEnglish ? 'en' : 'ar'].map((tag: string, idx: number) => (
                <span key={idx} className="sdc-article-tag-pill">
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="sdc-article-content-card">
            <p className="sdc-article-text">{article.content[isEnglish ? 'en' : 'ar']}</p>

            {article.sourceLink && (
              <a
                href={article.sourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="sdc-article-source-link"
              >
                {article.sourceLabel?.[isEnglish ? 'en' : 'ar']}
              </a>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
