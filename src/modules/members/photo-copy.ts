import type { CropTexts } from '@/components/ui/ImageCropper';

type Lang = 'ar' | 'en';

/** Words of the photo flow (design: "قص الصورة والموافقة"), both languages. */
export const PHOTO_COPY: Record<
  Lang,
  {
    title: string;
    help: string;
    change: string;
    choose: string;
    remove: string;
    removing: string;
    formats: string;
    drop: string;
    showLabel: string;
    showHint: string;
    cropTitle: string;
    crop: CropTexts;
    consentTitle: string;
    consentIntro: string;
    consentYes: string;
    consentYesHint: string;
    consentNo: string;
    consentNoHint: string;
    consentPrivacy: string;
    consentContinue: string;
    uploading: string;
    uploadingHint: string;
    errorsTitle: string;
    tooLarge: string;
    tooLargeHint: string;
    wrongType: string;
    wrongTypeHint: string;
    offline: string;
    retry: string;
    close: string;
    photoOf: (name: string) => string;
  }
> = {
  ar: {
    title: 'الصورة الشخصية',
    help: 'صورة واضحة لوجهك تجعل ملفك أقرب للزائر. نقصّها مربعة ونصغّرها قبل الرفع.',
    change: 'تغيير الصورة',
    choose: 'اختيار صورة',
    remove: 'إزالة الصورة',
    removing: 'جارٍ الإزالة…',
    formats: 'JPG أو PNG أو WebP، حتى 2 ميغابايت.',
    drop: 'أو اسحب الصورة وأفلتها هنا.',
    showLabel: 'أظهر صورتي للزوار',
    showHint: 'إذا أطفأته تظهر أحرف اسمك بدل الصورة.',
    cropTitle: 'قصّ صورتك',
    crop: {
      instructions: 'اسحب الصورة لتضع وجهك داخل الدائرة. نحفظ نسخة مربعة 512 بكسل وأخرى مصغّرة.',
      zoom: 'التكبير',
      zoomIn: 'تكبير',
      zoomOut: 'تصغير',
      rotate: 'تدوير',
      keys: 'لوحة المفاتيح: الأسهم للتحريك، + و − للتكبير، R للتدوير.',
      use: 'استخدم الصورة',
      another: 'اختيار صورة أخرى',
      unreadable: 'تعذّرت قراءة هذه الصورة. اختر صورة أخرى.',
    },
    consentTitle: 'هل تُظهر صورتك للزوار؟',
    consentIntro:
      'نسألك مرة واحدة عند أول رفع. يمكنك تغيير اختيارك من قسم «ما يراه الزوار» متى شئت.',
    consentYes: 'نعم، أظهرها في ملفي والدليل',
    consentYesHint: 'تظهر على بطاقتك وفي الشريط بالصفحة الرئيسية.',
    consentNo: 'لا، استخدمها داخل حسابي فقط',
    consentNoHint: 'تظهر لك وفي لوحة التحكم، ويرى الزوار أحرف اسمك.',
    consentPrivacy: 'لا نضع صورتك في أي بريد إلكتروني. إذا حذفتها نحذف الملف نهائياً.',
    consentContinue: 'متابعة',
    uploading: 'جارٍ رفع صورتك…',
    uploadingHint: 'لا تغلق الصفحة. يستغرق ثوانٍ قليلة.',
    errorsTitle: 'أخطاء الرفع',
    tooLarge: 'الصورة أكبر من 2 ميغابايت',
    tooLargeHint: 'اختر صورة أصغر أو صدّرها بجودة أقل.',
    wrongType: 'نوع الملف غير مدعوم',
    wrongTypeHint: 'نقبل JPG وPNG وWebP فقط.',
    offline: 'انقطع الاتصال',
    retry: 'حاول مرة أخرى',
    close: 'إغلاق',
    photoOf: (name) => `صورة ${name}`,
  },
  en: {
    title: 'Profile photo',
    help: 'A clear photo of your face makes your profile feel closer. We crop it square and shrink it before it is uploaded.',
    change: 'Change photo',
    choose: 'Choose a photo',
    remove: 'Remove photo',
    removing: 'Removing…',
    formats: 'JPG, PNG or WebP, up to 2 MB.',
    drop: 'Or drag the photo here and drop it.',
    showLabel: 'Show my photo to visitors',
    showHint: 'If you turn it off, the letters of your name show instead.',
    cropTitle: 'Crop your photo',
    crop: {
      instructions:
        'Drag the picture so your face sits inside the circle. We keep a 512 px square and a small copy.',
      zoom: 'Zoom',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      rotate: 'Rotate',
      keys: 'Keyboard: arrows move, + and − zoom, R rotates.',
      use: 'Use photo',
      another: 'Choose another',
      unreadable: 'This picture could not be read. Choose another one.',
    },
    consentTitle: 'Show your photo to visitors?',
    consentIntro:
      'We ask once, at your first upload. You can change your answer later under "What visitors see".',
    consentYes: 'Yes, show it on my profile and in the directory',
    consentYesHint: 'It appears on your card and in the strip on the home page.',
    consentNo: 'No, use it inside my account only',
    consentNoHint: 'You and the dashboard see it; visitors see the letters of your name.',
    consentPrivacy:
      'We never put your photo in an e-mail. If you delete it, the file is deleted for good.',
    consentContinue: 'Continue',
    uploading: 'Uploading your photo…',
    uploadingHint: 'Do not close the page. It takes a few seconds.',
    errorsTitle: 'Upload errors',
    tooLarge: 'The picture is larger than 2 MB',
    tooLargeHint: 'Choose a smaller picture or export it at a lower quality.',
    wrongType: 'This file type is not supported',
    wrongTypeHint: 'We accept JPG, PNG and WebP only.',
    offline: 'The connection dropped',
    retry: 'Try again',
    close: 'Close',
    photoOf: (name) => `Photo of ${name}`,
  },
};
