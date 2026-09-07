'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, User } from 'lucide-react';
import Header from '../../../src/components/Header/Header';
import Footer from '../../../src/components/Footer/Footer';
import { useLanguage } from '../../../src/context/LanguageContext';
import './article-details.css';

const articlesDatabase = {
  '1': {
    title: { ar: 'هندسة الأوامر (Prompt Engineering)', en: 'Prompt Engineering' },
    author: { ar: 'لجنة الذكاء الاصطناعي', en: 'AI Committee' },
    date: { ar: '15 أغسطس 2024', en: 'August 15, 2024' },
    readTime: { ar: '3 دقائق', en: '3 min' },
    tags: { ar: ['ذكاء اصطناعي', 'هندسة الأوامر', 'Prompt Engineering'], en: ['AI', 'Prompt Engineering', 'LLM'] },
    content: {
      ar: 'ثريد تعريفي يسلّط الضوء على مفهوم هندسة الأوامر (Prompt Engineering) وأهميتها في التعامل مع نماذج الذكاء الاصطناعي، ويوضح كيف يمكن لصياغة الأوامر واختيار الكلمات بطريقة مدروسة أن تساعد في توجيه النموذج للحصول على إجابات أكثر دقة ووضوحًا وملاءمة للسياق، والاستفادة بشكل أفضل من أدوات الذكاء الاصطناعي.',
      en: 'A technical thread that highlights the concept of prompt engineering and its importance in working with AI models. It explains how carefully crafting instructions and choosing words can guide the model toward more accurate, clearer, and context-aware responses while using AI tools more effectively.'
    }
  },
  '2': {
    title: { ar: 'تقنية Voice2Face', en: 'Voice2Face Technology' },
    author: { ar: 'الين الزهراني – مريم النعيم – غلا العتيبي', en: 'Alin Al-Zahrani – Maryam Al-Neaim – Ghala Alotibi' },
    date: { ar: '25 نوفمبر 2024', en: 'November 25, 2024' },
    readTime: { ar: '3 دقائق', en: '3 min' },
    tags: { ar: ['ذكاء اصطناعي', 'Python', 'تعلم'], en: ['AI', 'Python', 'Learning'] },
    content: {
      ar: 'ثريد تقني يستعرض تقنية Voice2Face القائمة على الذكاء الاصطناعي، ويوضح آلية عملها في تحليل الخصائص الصوتية وربطها بملامح الوجه لإنشاء تمثيلات للوجه اعتمادًا على الصوت. كما يستعرض أبرز استخداماتها وتطبيقاتها في مجالات متعددة، إلى جانب التحديات والمخاطر المرتبطة بها مثل التزييف العميق.',
      en: 'A technical thread that introduces the AI-based Voice2Face technology and explains how it analyzes voice characteristics and maps them to facial features to generate a face representation based on audio. It also covers key use cases, applications, and challenges such as deepfakes.'
    }
  },
  '3': {
    title: { ar: 'أنظمة التوصية (Recommendation Systems)', en: 'Recommendation Systems' },
    author: { ar: 'لجنة الذكاء الاصطناعي', en: 'AI Committee' },
    date: { ar: '12 سبتمبر 2025', en: 'September 12, 2025' },
    readTime: { ar: '3 دقائق', en: '3 min' },
    tags: { ar: ['انظمة', 'تعلم', 'ذكاء اصطناعي'], en: ['Systems', 'Learning', 'AI'] },
    content: {
      ar: 'ثريد تقني يتناول أنظمة التوصية (Recommendation Systems)، ويوضح مفهومها وآلية عملها بالاعتماد على الذكاء الاصطناعي وتعلّم الآلة وتحليل البيانات لفهم سلوك المستخدم واهتماماته. كما يوضح دور هذه الأنظمة في تخصيص المحتوى والتنبؤ بتفضيلات المستخدم وتقديم اقتراحات تتناسب مع اهتماماته وسلوكه السابق، بهدف تحسين تجربة المستخدم وتسهيل عملية اتخاذ القرار.',
      en: 'A technical thread about recommendation systems, explaining how they work using AI, machine learning, and data analysis to understand user behavior and interests. It also illustrates how these systems personalize content and predict preferences to improve the user experience and support better decision-making.'
    }
  },
  '4': {
    title: { ar: 'التطبيقات الصينية والإنجليزية', en: 'Chinese and English Applications' },
    author: { ar: 'لجنة الذكاء الاصطناعي', en: 'AI Committee' },
    date: { ar: '11 يونيو 2023', en: 'June 11, 2023' },
    readTime: { ar: '4 دقائق', en: '4 min' },
    tags: { ar: ['تقنية', 'Language', 'تعلم'], en: ['Technology', 'Language', 'Learning'] },
    content: {
      ar: 'ثريد يتناول أبرز الاختلافات في تصميم واجهة المستخدم بين التطبيقات الصينية والإنجليزية، ويسلط الضوء على اختلاف أساليب استخدام المساحات البيضاء وكثافة النصوص والمعلومات، والنوافذ المنبثقة الترويجية، بالإضافة إلى تصميم أيقونات التطبيقات واستخدام الألوان والرموز. كما يوضح كيف تؤثر الاختلافات الثقافية في أسلوب تصميم التطبيقات وتجربة المستخدم.',
      en: 'A thread exploring the major differences in UI design between Chinese and English applications, emphasizing blank space usage, text density, promotional pop-ups, icon design, colors, and symbols. It also explains how cultural differences affect app design and user experience.'
    }
  },
  '5': {
    title: { ar: 'الذكاء الاصطناعي في الألعاب والتعلّم المعزّز', en: 'AI in Games and Reinforcement Learning' },
    author: { ar: 'لجنة الذكاء الاصطناعي', en: 'AI Committee' },
    date: { ar: '17 اكتوبر 2025', en: 'October 17, 2025' },
    readTime: { ar: '3 دقائق', en: '3 min' },
    tags: { ar: ['ذكاء اصطناعي', 'NLP', 'لغة طبيعية'], en: ['AI', 'NLP', 'Natural Language'] },
    content: {
      ar: 'ثريد تقني يشرح دور الذكاء الاصطناعي في الألعاب وكيف يعتمد على التعلّم المعزّز (Reinforcement Learning) لاتخاذ قرارات ذكية وتحسين أدائه مع مرور الوقت. كما يستعرض مفهوم الوكيل الذكي (Agent) والبيئة (Environment)، وآلية التعلّم من خلال التجربة والمكافآت والعقوبات، وكيف تُمكّن المحاولات المتكررة الذكاء الاصطناعي من تطوير استراتيجيات تساعده على تحقيق الفوز.',
      en: 'A technical thread explaining the role of AI in games and how it uses reinforcement learning to make smart decisions and improve performance over time. It also explores the concepts of agents and environments, learning through trial and reward, and how repeated attempts allow AI to develop strategies for winning.'
    }
  },
  '6': {
    title: { ar: 'تطبيقات الذكاء الاصطناعي في تحليل المشاعر', en: 'AI Applications in Sentiment Analysis' },
    author: { ar: 'لجنة الذكاء الاصطناعي', en: 'AI Committee' },
    date: { ar: '26 سبتمبر 2025', en: 'September 26, 2025' },
    readTime: { ar: '4 دقائق', en: '4 min' },
    tags: { ar: ['ذكاء اصطناعي', 'أخلاقيات', 'AI '], en: ['AI', 'Ethics', 'AI'] },
    content: {
      ar: 'ثريد تقني يتناول تطبيقات الذكاء الاصطناعي في تحليل المشاعر، ويوضح كيف يمكن للأنظمة الذكية التعرّف على المشاعر البشرية وتحليلها باستخدام تقنيات متعددة، مثل تحليل النصوص، والتعرّف على تعبيرات الوجه، وتحليل نبرة الصوت. كما يستعرض دور هذه التقنيات والاستفادة منها في مجالات مختلفة مثل الرعاية الصحية، والتسويق، والتعليم، وتحليل محتوى وسائل التواصل الاجتماعي.',
      en: 'A technical thread on AI applications in sentiment analysis, explaining how intelligent systems can detect and analyze human emotions using text analysis, facial expression recognition, and voice tone analysis. It also covers benefits across healthcare, marketing, education, and social media analytics.'
    }
  }
};

export default function ArticleDetailPage() {
  const params = useParams();
  const articleId = params?.id || '1';
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';
  const article = articlesDatabase[articleId] || articlesDatabase['1'];

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
              <span><User size={14} /> {article.author[isEnglish ? 'en' : 'ar']}</span>
              <span><Calendar size={14} /> {article.date[isEnglish ? 'en' : 'ar']}</span>
              <span><Clock size={14} /> {article.readTime[isEnglish ? 'en' : 'ar']}</span>
            </div>

            <div className="sdc-article-tags-row">
              {article.tags[isEnglish ? 'en' : 'ar'].map((tag, idx) => (
                <span key={idx} className="sdc-article-tag-pill">
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="sdc-article-content-card">
            <p className="sdc-article-text">{article.content[isEnglish ? 'en' : 'ar']}</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}