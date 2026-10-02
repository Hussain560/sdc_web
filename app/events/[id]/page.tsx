'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, MapPin, Calendar, Clock, Trophy, ExternalLink, Phone, Mail, CheckCircle, X } from 'lucide-react';
import Header from '../../../src/components/Header/Header';
import Footer from '../../../src/components/Footer/Footer';
import { useAuth } from '../../../src/context/AuthContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { supabase } from '../../../src/lib/supabase';
import type { Localized } from '../../../src/types/content';
import './event-details.css';

interface EventRecord {
  title: Localized;
  location: Localized;
  mapUrl: string;
  date: Localized;
  duration: Localized;
  prizes: Localized;
  target: Localized;
  email: string;
  // Not present in the legacy data; kept so the page renders exactly as before (TD-027 area).
  phone?: string;
  status: Localized;
  faq: Localized<string[]>;
  responsibilities: Localized<string[]>;
  requirements: Localized<string[]>;
  deliverables: Localized<string[]>;
  benefits: Localized<string[]>;
}


const eventsDatabase: Record<string, EventRecord> = {
  '1': {
    title: { ar: 'لقاء تقني: بيئات العمل التقنية وأساسيات Github', en: 'Technical Meetup: Tech Work Environments and GitHub Basics' },
    location: { ar: 'أونلاين', en: 'Online' },
    mapUrl: '#',
    date: { ar: 'قريبًا سيعلن عنه', en: 'To be announced soon' },
    duration: { ar: 'غير محدد', en: 'Not specified' },
    prizes: { ar: 'لا توجد شهادة حضور', en: 'No attendance certificate' },
    target: { ar: 'طلاب، خريجون، موظفون', en: 'Students, graduates, employees' },
    email: 'sdcommunity.sa@gmail.com',
    status: { ar: 'قريبًا', en: 'Coming Soon' },
    faq: {
      ar: ['لا توجد شهادة حضور لهذه الفعالية.', 'في حال القبول، سيتم إرسال رسالة القبول عبر البريد الإلكتروني.'],
      en: ['There is no attendance certificate for this event.', 'If accepted, an approval email will be sent to your email.']
    },
    responsibilities: {
      ar: ['الحضور والالتزام بوقت اللقاء.', 'المشاركة الفعالة أثناء النقاش.', 'الاستفادة من المحتوى وطرح الأسئلة عند الحاجة.'],
      en: ['Attend and respect the meeting time.', 'Participate actively during the discussion.', 'Use the content and ask questions when needed.']
    },
    requirements: { ar: ['لا يوجد.'], en: ['None.'] },
    deliverables: {
      ar: ['التعرف على أبرز الفروقات التقنية بين بيئات العمل في الشركات والبنوك.', 'التعرف على أساسيات GitHub وكيفية إنشاء حساب واستخدامه بشكل أولي.'],
      en: ['Understand the main technical differences between work environments in companies and banks.', 'Learn the basics of GitHub and how to create an account and use it initially.']
    },
    benefits: { ar: ['لا يوجد.'], en: ['None.'] }
  },
  '2': {
    title: { ar: 'ورشة Google AI Studio', en: 'Google AI Studio Workshop' },
    location: { ar: 'أونلاين', en: 'Online' },
    mapUrl: '#',
    date: { ar: '5/8/2026', en: '5/8/2026' },
    duration: { ar: 'غير محدد', en: 'Not specified' },
    prizes: { ar: 'شهادة حضور', en: 'Attendance certificate' },
    target: { ar: 'طلاب، خريجون، موظفون', en: 'Students, graduates, employees' },
    email: 'sdcommunity.sa@gmail.com',
    status: { ar: 'منتهي', en: 'Ended' },
    faq: {
      ar: ['تتوفر شهادة حضور بعد حضور الورشة.', 'في حال القبول، سيتم إرسال رسالة القبول عبر البريد الإلكتروني.'],
      en: ['An attendance certificate is available after attending the workshop.', 'If accepted, an approval email will be sent to your email.']
    },
    responsibilities: {
      ar: ['الحضور والالتزام بوقت الورشة.', 'المشاركة الفعالة أثناء التطبيق العملي.', 'متابعة الشرح وتجربة الأدوات المقدمة خلال الورشة.'],
      en: ['Attend and respect the workshop time.', 'Participate actively in hands-on practice.', 'Follow the explanation and experiment with the tools presented.']
    },
    requirements: { ar: ['لا يوجد.'], en: ['None.'] },
    deliverables: {
      ar: ['التعرف على Google AI Studio وأهم استخداماته.', 'اكتساب أساسيات التعامل مع أدوات الذكاء الاصطناعي وتطبيقها بشكل مبسط.'],
      en: ['Learn about Google AI Studio and its main use cases.', 'Gain the basics of working with AI tools and applying them simply.']
    },
    benefits: { ar: ['لا يوجد.'], en: ['None.'] }
  },
  '3': {
    title: { ar: 'ورشة تحليل البيانات باستخدام Excel & Power BI', en: 'Data Analysis Workshop using Excel & Power BI' },
    location: { ar: 'أونلاين', en: 'Online' },
    mapUrl: '#',
    date: { ar: '20/9/2025', en: '20/9/2025' },
    duration: { ar: 'غير محدد', en: 'Not specified' },
    prizes: { ar: 'شهادة حضور', en: 'Attendance certificate' },
    target: { ar: 'طلاب، خريجون، موظفون', en: 'Students, graduates, employees' },
    email: 'sdcommunity.sa@gmail.com',
    status: { ar: 'منتهي', en: 'Ended' },
    faq: {
      ar: ['تتوفر شهادة حضور بعد حضور الورشة.', 'في حال القبول، سيتم إرسال رسالة القبول عبر البريد الإلكتروني.'],
      en: ['An attendance certificate is available after attending the workshop.', 'If accepted, an approval email will be sent to your email.']
    },
    responsibilities: {
      ar: ['الحضور والالتزام بوقت الورشة.', 'المشاركة الفعالة أثناء التطبيق العملي.', 'متابعة خطوات تحليل البيانات وتجربة الأدوات المقدمة.'],
      en: ['Attend and respect the workshop time.', 'Participate actively in hands-on activities.', 'Follow the data analysis steps and try the tools provided.']
    },
    requirements: { ar: ['لا يوجد.'], en: ['None.'] },
    deliverables: {
      ar: ['التعرف على أساسيات تحليل البيانات باستخدام Excel وPower BI.', 'التعرف على كيفية تنظيم البيانات وعرضها في تقارير ولوحات معلومات بشكل مبسط.'],
      en: ['Learn the basics of data analysis using Excel and Power BI.', 'Learn how to organize and present data in reports and dashboards simply.']
    },
    benefits: { ar: ['لا يوجد.'], en: ['None.'] }
  },
  '4': {
    title: { ar: 'معسكر أساسيات الأمن السيبراني', en: 'Cybersecurity Fundamentals Camp' },
    location: { ar: 'أونلاين', en: 'Online' },
    mapUrl: '#',
    date: { ar: '15-19 سبتمبر 2024', en: 'September 15-19, 2024' },
    duration: { ar: 'غير محدد', en: 'Not specified' },
    prizes: { ar: 'شهادة حضور', en: 'Attendance certificate' },
    target: { ar: 'طلاب، خريجون، موظفون', en: 'Students, graduates, employees' },
    email: 'sdcommunity.sa@gmail.com',
    status: { ar: 'منتهي', en: 'Ended' },
    faq: {
      ar: ['تتوفر شهادة حضور بعد حضور المعسكر.', 'في حال القبول، سيتم إرسال رسالة القبول عبر البريد الإلكتروني.'],
      en: ['An attendance certificate is available after attending the camp.', 'If accepted, an approval email will be sent to your email.']
    },
    responsibilities: {
      ar: ['الحضور والالتزام بوقت المعسكر.', 'المشاركة الفعالة أثناء الشرح والتطبيق.', 'متابعة الأنشطة والاستفادة من المحتوى المقدم.'],
      en: ['Attend and respect the camp schedule.', 'Participate actively during lectures and practical activities.', 'Follow the activities and benefit from the provided content.']
    },
    requirements: { ar: ['لا يوجد.'], en: ['None.'] },
    deliverables: {
      ar: ['التعرف على المفاهيم الأساسية في الأمن السيبراني.', 'اكتساب معرفة مبسطة بأهم الممارسات والأساليب المستخدمة لحماية الأنظمة والبيانات.'],
      en: ['Understand the basic concepts of cybersecurity.', 'Gain practical knowledge of common practices and methods used to protect systems and data.']
    },
    benefits: { ar: ['لا يوجد.'], en: ['None.'] }
  },
  '5': {
    title: { ar: 'معسكر أساسيات حل التقاط العلم CTF', en: 'CTF Fundamentals Camp' },
    location: { ar: 'أونلاين', en: 'Online' },
    mapUrl: '#',
    date: { ar: '27/10/2024 to 1/11/2024', en: '10/27/2024 to 11/1/2024' },
    duration: { ar: 'غير محدد', en: 'Not specified' },
    prizes: { ar: 'شهادة حضور', en: 'Attendance certificate' },
    target: { ar: 'طلاب، خريجون، موظفون', en: 'Students, graduates, employees' },
    email: 'sdcommunity.sa@gmail.com',
    status: { ar: 'منتهي', en: 'Ended' },
    faq: {
      ar: ['تتوفر شهادة حضور بعد حضور المعسكر.', 'في حال القبول، سيتم إرسال رسالة القبول عبر البريد الإلكتروني.'],
      en: ['An attendance certificate is available after attending the camp.', 'If accepted, an approval email will be sent to your email.']
    },
    responsibilities: {
      ar: ['الحضور والالتزام بوقت المعسكر.', 'المشاركة الفعالة أثناء التمارين والتحديات.', 'متابعة الشرح وتجربة المهارات المقدمة خلال المعسكر.'],
      en: ['Attend and respect the camp schedule.', 'Participate actively in exercises and challenges.', 'Follow the explanation and practice the skills introduced.']
    },
    requirements: { ar: ['لا يوجد.'], en: ['None.'] },
    deliverables: {
      ar: ['التعرف على أساسيات تحديات CTF وطريقة التعامل معها.', 'اكتساب معرفة مبسطة بأساليب تحليل وحل التحديات التقنية.'],
      en: ['Learn the basics of CTF challenges and how to approach them.', 'Gain practical knowledge of analyzing and solving technical challenges.']
    },
    benefits: { ar: ['لا يوجد.'], en: ['None.'] }
  },
  '6': {
    title: { ar: 'معسكر نادي هواوي في ريادة الأعمال وصنع التطبيقات – StartApps', en: 'Huawei StartApps Entrepreneurship and App Development Camp' },
    location: { ar: 'أونلاين', en: 'Online' },
    mapUrl: '#',
    date: { ar: '02/03/2023', en: '02/03/2023' },
    duration: { ar: 'غير محدد', en: 'Not specified' },
    prizes: { ar: 'شهادة حضور', en: 'Attendance certificate' },
    target: { ar: 'طلاب، خريجون، موظفون', en: 'Students, graduates, employees' },
    email: 'sdcommunity.sa@gmail.com',
    status: { ar: 'منتهي', en: 'Ended' },
    faq: {
      ar: ['تتوفر شهادة حضور بعد حضور المعسكر.', 'في حال القبول، سيتم إرسال رسالة القبول عبر البريد الإلكتروني.'],
      en: ['An attendance certificate is available after attending the camp.', 'If accepted, an approval email will be sent to your email.']
    },
    responsibilities: {
      ar: ['الحضور والالتزام بوقت المعسكر.', 'المشاركة الفعالة أثناء الأنشطة والتطبيقات.', 'متابعة المحتوى والاستفادة من المهارات المقدمة.'],
      en: ['Attend and respect the camp schedule.', 'Participate actively in activities and practical exercises.', 'Follow the content and apply the skills introduced.']
    },
    requirements: { ar: ['لا يوجد.'], en: ['None.'] },
    deliverables: {
      ar: ['التعرف على أساسيات ريادة الأعمال وتطوير الأفكار.', 'التعرف على المراحل الأساسية لتحويل الفكرة إلى تطبيق أو مشروع بشكل مبسط.'],
      en: ['Learn the basics of entrepreneurship and idea development.', 'Understand the main stages of transforming an idea into an app or project in a simple way.']
    },
    benefits: { ar: ['لا يوجد.'], en: ['None.'] }
  }
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { lang, t } = useLanguage();
  const isEnglish = lang === 'en';

  const [showModal, setShowModal] = useState(false);
  const [showEndedModal, setShowEndedModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [sending, setSending] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const eventId = String(params?.id ?? '2');
  const event: EventRecord = eventsDatabase[eventId] ?? eventsDatabase['2']!;

  useEffect(() => {
    async function checkRegistration() {
      if (!isLoggedIn || !user) {
        setIsRegistered(false);
        return;
      }
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', Number(eventId))
        .maybeSingle();

      if (!error && data) {
        setIsRegistered(true);
      } else {
        setIsRegistered(false);
      }
    }
    checkRegistration();
  }, [isLoggedIn, user, eventId]);

  const isEventEnded = () => {
    const status = event.status?.[isEnglish ? 'en' : 'ar'];
    return status === 'Ended' || status === 'منتهي';
  };

  const handleRegisterClick = () => {
    if (isEventEnded()) {
      setShowEndedModal(true);
      return;
    }
    if (!isLoggedIn) {
      router.push(`/login?redirect=/events/${eventId}`);
    } else {
      setRegisterError('');
      setShowModal(true);
    }
  };

  const confirmRegistration = async () => {
    if (!user) return;
    setSending(true);
    setRegisterError('');

    const { error } = await supabase.from('event_registrations').insert({
      user_id: user.id,
      event_id: Number(eventId),
      full_name: user.user_metadata?.full_name || '',
      email: user.email || '',
    });

    setSending(false);

    if (error) {
      setRegisterError(
        isEnglish
          ? 'Something went wrong. Please try again.'
          : 'حدث خطأ أثناء التسجيل. حاول مرة أخرى.'
      );
      return;
    }

    setIsRegistered(true);
    setShowModal(false);

    // إرسال إيميل "استلمنا تسجيلك" بدون ما نوقف الواجهة بانتظاره
    supabase.functions.invoke('send-registration-email', {
      body: {
        to: user.email,
        fullName: user.user_metadata?.full_name || '',
        eventTitle: event.title.ar,
      },
    }).catch((err) => console.error('email error:', err));
  };

  const eventTitle = event.title[isEnglish ? 'en' : 'ar'];
  const eventLocation = event.location[isEnglish ? 'en' : 'ar'];
  const eventDuration = event.duration[isEnglish ? 'en' : 'ar'];
  const eventDate = event.date[isEnglish ? 'en' : 'ar'];
  const eventPrizes = event.prizes[isEnglish ? 'en' : 'ar'];
  const eventTarget = event.target[isEnglish ? 'en' : 'ar'];
  const faqItems = event.faq[isEnglish ? 'en' : 'ar'];
  const responsibilities = event.responsibilities[isEnglish ? 'en' : 'ar'];
  const requirements = event.requirements[isEnglish ? 'en' : 'ar'];
  const deliverables = event.deliverables[isEnglish ? 'en' : 'ar'];
  const benefits = event.benefits[isEnglish ? 'en' : 'ar'];

  return (
    <div className="sdc-event-detail-wrapper">
      <Header />

      <main className="sdc-event-detail-main">
        <section className="sdc-event-hero-banner">
          <div className="sdc-hero-overlay">
            <div className="sdc-hero-top-row">
              <nav className="sdc-breadcrumb">
                <Link href="/">{isEnglish ? 'Home' : 'الرئيسية'}</Link>
                <span className="sdc-bc-sep">&gt;</span>
                <Link href="/events">{isEnglish ? 'Events' : 'الفعاليات'}</Link>
                <span className="sdc-bc-sep">&gt;</span>
                <span style={{ color: '#00E676' }}>{eventTitle}</span>
              </nav>

              <button
                className={`sdc-hero-btn-register ${isRegistered ? 'registered' : ''}`}
                onClick={handleRegisterClick}
                disabled={isRegistered}
              >
                {isRegistered ? t('registered') : t('register')}
              </button>
            </div>

            <h1 className="sdc-event-hero-title">{eventTitle}</h1>
          </div>
        </section>

        <div className="sdc-event-body-container">
          <div className="sdc-about-community-block">
            <h2 className="sdc-about-title">{isEnglish ? 'What is the Saudi Developer Community?' : 'ما هو المجتمع السعودي للمطورين'}</h2>
            <p className="sdc-about-desc">
              {isEnglish
                ? 'The Saudi community is a non-profit tech community that empowers developers and technology enthusiasts to gain practical experience, build real projects, share knowledge in AI and modern technologies, organize workshops and regular meetups, launch open-source projects, host inspiring speakers, and enrich Arabic technical content with high-quality material.'
                : 'المجتمع السعودي هو مجتمع تقني غير ربحي يهدف إلى تمكين المطورين والمهتمين بالتقنية من اكتساب الخبرات العملية وبناء مشاريع حقيقية، ونشر المعرفة في مجالات الذكاء الاصطناعي والتقنيات الحديثة، من خلال تنظيم ورش العمل واللقاءات الدورية، وإطلاق المشاريع مفتوحة المصدر، واستضافة شخصيات ملهمة، إلى جانب الإسهام في إثراء المحتوى العربي التقني بمحتوى عال الجودة.'}
            </p>
          </div>

          <div className="sdc-event-content-grid">
            <div className="sdc-event-main-cards">
              <div className="sdc-detail-card">
                <div className="sdc-card-header">
                  <span className="sdc-card-icon">📋</span>
                  <h3>{isEnglish ? 'Tasks and Responsibilities' : 'المهام والمسؤوليات:'}</h3>
                </div>
                <ul className="sdc-card-list">
                  {responsibilities.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                </ul>
              </div>

              <div className="sdc-detail-card">
                <div className="sdc-card-header">
                  <span className="sdc-card-icon">📋</span>
                  <h3>{isEnglish ? 'Requirements and Criteria' : 'الشروط والمعايير'}</h3>
                </div>
                <ul className="sdc-card-list">
                  {requirements.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                </ul>
              </div>

              <div className="sdc-detail-card">
                <div className="sdc-card-header">
                  <span className="sdc-card-icon">📋</span>
                  <h3>{isEnglish ? 'Deliverables' : 'المخرجات :'}</h3>
                </div>
                <ul className="sdc-card-list">
                  {deliverables.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                </ul>
              </div>

              <div className="sdc-detail-card">
                <div className="sdc-card-header">
                  <span className="sdc-card-icon">📋</span>
                  <h3>{isEnglish ? 'Opportunities and Benefits' : 'الفرص والمزايا :'}</h3>
                </div>
                <ul className="sdc-card-list">
                  {benefits.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                </ul>
              </div>
            </div>

            <aside className="sdc-event-sidebar">
              <div className="sdc-sidebar-card">
                <div className="sdc-sidebar-item">
                  <div className="sdc-sidebar-item-header">
                    <User size={18} className="sdc-sb-icon-style" />
                    <h4>{isEnglish ? 'Target Audience' : 'الفئة المستهدفة'}</h4>
                  </div>
                  <p className="sdc-sb-val">{eventTarget}</p>
                </div>

                <div className="sdc-sidebar-item">
                  <div className="sdc-sidebar-item-header">
                    <MapPin size={18} className="sdc-sb-icon-style" />
                    <h4>{isEnglish ? 'Location' : 'الموقع'}</h4>
                  </div>
                  <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" className="sdc-sb-val sdc-link-val">
                    <ExternalLink size={14} className="sdc-ext-icon" />
                    <span>{eventLocation}</span>
                  </a>
                </div>

                <div className="sdc-sidebar-item">
                  <div className="sdc-sidebar-item-header">
                    <Calendar size={18} className="sdc-sb-icon-style" />
                    <h4>{isEnglish ? 'Event Date' : 'تاريخ الفعالية'}</h4>
                  </div>
                  <p className="sdc-sb-val">{eventDate}</p>
                </div>

                <div className="sdc-sidebar-item">
                  <div className="sdc-sidebar-item-header">
                    <Clock size={18} className="sdc-sb-icon-style" />
                    <h4>{isEnglish ? 'Event Duration' : 'مدة الفعالية'}</h4>
                  </div>
                  <p className="sdc-sb-val">{eventDuration}</p>
                </div>

                <div className="sdc-sidebar-item">
                  <div className="sdc-sidebar-item-header">
                    <Trophy size={18} className="sdc-sb-icon-style" />
                    <h4>{isEnglish ? 'Awards' : 'الجوائز'}</h4>
                  </div>
                  <p className="sdc-sb-val">{eventPrizes}</p>
                </div>

                <hr className="sdc-sb-divider" />
                <div className="sdc-sidebar-item">
                  <h4>{isEnglish ? 'FAQ' : 'الأسئلة الشائعة'}</h4>
                  {faqItems.map((item: string, index: number) => <p key={index} className="sdc-sb-val">{item}</p>)}
                </div>

                <div className="sdc-sidebar-item">
                  <div className="sdc-sidebar-item-header">
                    <Phone size={18} className="sdc-sb-icon-style" />
                    <h4>{isEnglish ? 'Phone' : 'الهاتف'}</h4>
                  </div>
                  <a href={`tel:${event.phone}`} className="sdc-sb-link">
                    <ExternalLink size={14} className="sdc-ext-icon" />
                    <span>{event.phone}</span>
                  </a>
                </div>

                <div className="sdc-sidebar-item">
                  <div className="sdc-sidebar-item-header">
                    <Mail size={18} className="sdc-sb-icon-style" />
                    <h4>{isEnglish ? 'Email' : 'البريد الالكتروني'}</h4>
                  </div>
                  <a href={`mailto:${event.email}`} className="sdc-sb-link">
                    <ExternalLink size={14} className="sdc-ext-icon" />
                    <span>{event.email}</span>
                  </a>
                </div>

                <hr className="sdc-sb-divider" />
                <div className="sdc-sidebar-socials">
                  <h4>{isEnglish ? 'Social Accounts' : 'حسابات التواصل الإجتماعي'}</h4>
                  <div className="sdc-social-icons">
                    <a href="https://x.com/SDC_Saudi?s=20" target="_blank" rel="noopener noreferrer" className="sdc-soc-box" title="X (Twitter)">
                      <span className="sdc-x-icon">𝕏</span>
                    </a>
                    <a href="https://www.linkedin.com/company/sdc-%D8%A7%D9%84%D9%85%D8%AC%D8%AA%D9%85%D8%B9-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A-%D9%84%D9%84%D9%85%D8%B7%D9%88%D8%B1%D9%8A%D9%86/" target="_blank" rel="noopener noreferrer" className="sdc-soc-box" title="LinkedIn">
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>in</span>
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="sdc-soc-box" aria-label="Instagram" title="Instagram">
                      <svg
                       width="18"
                       height="18"
                       viewBox="0 0 24 24"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="2"
                       strokeLinecap="round"
                       strokeLinejoin="round"
                       >
                       <rect x="2" y="2" width="20" height="20" rx="5"></rect>
                       <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                       <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                       </svg>
                    </a>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="sdc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sdc-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="sdc-modal-close" onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>

            <div className="sdc-modal-header">
              <CheckCircle size={40} className="sdc-modal-icon" />
              <h3>{isEnglish ? 'Confirm event registration' : 'تأكيد التسجيل في الفعالية'}</h3>
            </div>

            <div className="sdc-modal-body">
              <p className="sdc-modal-event-name">{eventTitle}</p>
              <div className="sdc-modal-user-info">
                <span>{isEnglish ? 'You will be registered with the following information:' : 'سيتم التسجيل بالبيانات التالية:'}</span>
                <ul>
                  <li><strong>{isEnglish ? 'Name' : 'الاسم'}:</strong> {user?.user_metadata?.full_name || (isEnglish ? 'Visitor' : 'زائر')}</li>
                  <li><strong>{isEnglish ? 'Email' : 'البريد'}:</strong> {user?.email || (isEnglish ? 'No email provided' : 'لا يوجد بريد')}</li>
                </ul>
              </div>
              {registerError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', marginTop: '12px', textAlign: 'center' }}>
                  {registerError}
                </div>
              )}
            </div>

            <div className="sdc-modal-footer">
              <button className="sdc-btn-confirm" onClick={confirmRegistration} disabled={sending}>
                {sending ? (isEnglish ? 'Sending...' : 'جاري الإرسال...') : (isEnglish ? 'Confirm Registration' : 'تأكيد التسجيل')}
              </button>
              <button className="sdc-btn-cancel" onClick={() => setShowModal(false)} disabled={sending}>
                {isEnglish ? 'Cancel' : 'إلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEndedModal && (
        <div className="sdc-modal-overlay" onClick={() => setShowEndedModal(false)}>
          <div className="sdc-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="sdc-modal-close" onClick={() => setShowEndedModal(false)}>
              <X size={20} />
            </button>
            <div className="sdc-modal-header">
              <h3>{isEnglish ? 'Event Ended' : 'انتهت الفعالية'}</h3>
            </div>
            <div className="sdc-modal-body" style={{ textAlign: 'center' }}>
              <p style={{ color: '#cccccc', fontSize: '15px', lineHeight: '1.8' }}>
                {isEnglish
                  ? 'We apologize, this event has ended and registration is no longer available. We look forward to seeing you in our upcoming events.'
                  : 'نعتذر، هذه الفعالية انتهت ولم يعد التسجيل متاحًا. نتطلع لوجودك في فعالياتنا القادمة.'}
              </p>
            </div>
            <div className="sdc-modal-footer">
              <button className="sdc-btn-confirm" onClick={() => setShowEndedModal(false)}>
                {isEnglish ? 'OK' : 'حسنًا'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}