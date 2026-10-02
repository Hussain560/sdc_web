'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  ar: {
    home: 'الرئيسية',
    about: 'عن المجتمع',
    events: 'الفعاليات',
    members: 'الأعضاء',
    articles: 'المقالات',
    search: 'البحث',
    login: 'تسجيل الدخول',
    allArticles: 'جميع مقالات المجتمع',
    allEvents: 'جميع الفعاليات',
    allMembers: 'جميع أعضاء المجتمع',
    readMore: 'قراءة المقال',
    register: 'تسجيل',
    registered: 'تم التسجيل ✓',
    moreDetails: 'تفاصيل أكثر',
    memberInfo: 'المعلومات المهنية',
    viewAll: 'عرض الكل',
    searchPlaceholder: 'ابحث في محتوى هذه الصفحة...',
    noResults: 'لا توجد نتائج تطابق البحث حالياً.',
    backToHome: 'الرئيسية',
    community: 'المجتمع',
    latestEvents: 'أحدث الفعاليات',
    latestThreads: 'أحدث الثريدات',
    communitySections: 'أقسام المجتمع',
    partners: 'قسم الشركاء',
    aboutCommunity: 'عن المجتمع',
    whoWeAre: 'ما هو المجتمع السعودي للمطورين',
    memberSectionTitle: 'أعضاء المجتمع',
    memberSectionSubtitle: 'تعرّف على أعضاء مجتمعنا الذين يجمعهم الشغف بالتقنية، والتعاون، وصناعة الأثر.',
    allMemberCards: 'جميع الأعضاء',
    contactMe: 'تواصل معي',
    sendMessage: 'إرسال الرسالة',
    name: 'الاسم',
    email: 'البريد',
    message: 'الرسالة',
    fillForm: 'سيتم التسجيل بالبيانات التالية:',
    confirmRegistration: 'تأكيد التسجيل',
    cancel: 'إلغاء',
    joinUs: 'انضم إلينا',
    homeBreadcrumb: 'الرئيسية',
    communityBreadcrumb: 'المجتمع',
    staff: 'زائر',
    noEmail: 'لا يوجد بريد',
    sentSuccessfully: 'تم إرسال رسالتك بنجاح! ✓',
    loading: 'جاري الإرسال...',
    soon: 'قريبًا',
    online: 'أونلاين',
    available: 'متاح التسجيل',
    ended: 'منتهي',
    viewProfile: 'عرض الملف الشخصي',
    recentArticle: 'ثريد حديث',
    registrationConfirmation: 'تأكيد التسجيل في الفعالية',
    viewAllMembers: 'عرض الكل',
    memberInfoTitle: 'المعلومات المهنية',
    platformLogo: 'شعار المنصة',
    followUs: 'تابعنا على',
    allRightsReserved: 'جميع الحقوق محفوظة للمجتمع السعودي © 2026',
    developedBy: 'تم تطويره وصيانته بواسطة [المجتمع السعودي للمطورين]',
    lastUpdated: 'تاريخ آخر تعديل: 04/12/2020',
    welcomeBack: 'مرحباً بعودتك! أدخل بياناتك للوصول إلى حسابك',
    emailLabel: 'البريد الإلكتروني',
    passwordLabel: 'كلمة المرور',
    newUser: 'مستخدم جديد؟',
    createAccount: 'إنشاء حساب جديد',
    verify: 'جاري التحقق...',
    noResultsSearch: 'لا توجد نتائج تطابق بحثك.',
  },
  en: {
    home: 'Home',
    about: 'About Us',
    events: 'Events',
    members: 'Members',
    articles: 'Articles',
    search: 'Search',
    login: 'Login',
    allArticles: 'All Community Articles',
    allEvents: 'All Events',
    allMembers: 'All Community Members',
    readMore: 'Read Article',
    register: 'Register',
    registered: 'Registered ✓',
    moreDetails: 'More Details',
    memberInfo: 'Professional Info',
    viewAll: 'View All',
    searchPlaceholder: 'Search page content...',
    noResults: 'No results matched your search.',
    backToHome: 'Home',
    community: 'Community',
    latestEvents: 'Latest Events',
    latestThreads: 'Latest Threads',
    communitySections: 'Community Sections',
    partners: 'Partners',
    aboutCommunity: 'About the community',
    whoWeAre: 'What is the Saudi Developer Community?',
    memberSectionTitle: 'Community Members',
    memberSectionSubtitle: 'Meet the members of our community who share a passion for technology, collaboration, and making an impact.',
    allMemberCards: 'All Members',
    contactMe: 'Contact Me',
    sendMessage: 'Send Message',
    name: 'Name',
    email: 'Email',
    message: 'Message',
    fillForm: 'You will be registered with the following information:',
    confirmRegistration: 'Confirm Registration',
    cancel: 'Cancel',
    joinUs: 'Join Us',
    homeBreadcrumb: 'Home',
    communityBreadcrumb: 'Community',
    staff: 'Visitor',
    noEmail: 'No email provided',
    sentSuccessfully: 'Your message was sent successfully! ✓',
    loading: 'Sending...',
    soon: 'Coming Soon',
    online: 'Online',
    available: 'Registration Open',
    ended: 'Ended',
    viewProfile: 'View Profile',
    recentArticle: 'Recent thread',
    registrationConfirmation: 'Confirm event registration',
    viewAllMembers: 'View All',
    memberInfoTitle: 'Professional Information',
    platformLogo: 'Platform Logo',
    followUs: 'Follow us',
    allRightsReserved: 'All rights reserved for the Saudi Community © 2026',
    developedBy: 'Developed and maintained by [Saudi Developer Community]',
    lastUpdated: 'Last updated: 04/12/2020',
    welcomeBack: 'Welcome back! Enter your details to access your account',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    newUser: 'New user?',
    createAccount: 'Create a new account',
    verify: 'Verifying...',
    noResultsSearch: 'No results matched your search.',
  }
};

export type Lang = 'ar' | 'en';
export type TranslationKey = keyof typeof translations.ar;

interface LanguageContextValue {
  lang: Lang;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar');

  const updateDOMAndStorage = (newLang: Lang) => {
    if (typeof window !== 'undefined') {
      document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = newLang;
      document.body.dir = newLang === 'ar' ? 'rtl' : 'ltr';
      localStorage.setItem('app_lang', newLang);
    }
  };

  const toggleLanguage = () => {
    const nextLang: Lang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    updateDOMAndStorage(nextLang);
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang');
    if (savedLang && (savedLang === 'ar' || savedLang === 'en')) {
      // Hydrates the saved preference after mount (SSR always renders 'ar'). Replaced by URL locales — ADR-010.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLang(savedLang);
      updateDOMAndStorage(savedLang);
    } else {
      updateDOMAndStorage('ar');
    }
  }, []);

  const t = (key: string): string => (translations[lang] as Record<string, string>)[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}