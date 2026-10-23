import type { Metadata } from 'next';
import { CHROME } from '@/components/layout/chrome-strings';
import { redirect } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth/session';
import { getAccountState } from '@/modules/account/state';
import { OnboardingFlow } from '@/modules/members/components/OnboardingFlow';
import { getMyEditorData } from '@/modules/members/editor';
import { getSkillCatalog } from '@/modules/members/public';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * ACC-009: the first-sign-in set-up. Five short steps (welcome, name, photo, interests, privacy), each saved as it is
 * finished, skippable, on the same split layout as sign-in. It can be reopened from the account.
 */
export default async function WelcomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  await requireUser('/welcome');
  const [state, editor, catalog] = await Promise.all([
    getAccountState(),
    getMyEditorData(),
    getSkillCatalog(),
  ]);
  if (!state?.member || !editor) redirect({ href: '/account/profile', locale });
  const v = editor!.values;
  const full = (f: string, m: string, l: string) => [f, m, l].filter(Boolean).join(' ');
  const fullName =
    lang === 'en' && v.first_name_en
      ? full(v.first_name_en, v.middle_name_en, v.last_name_en)
      : full(v.first_name_ar, v.middle_name_ar, v.last_name_ar);
  const chrome = CHROME[lang];
  return (
    <OnboardingFlow
      lang={lang}
      start={Math.min(4, state!.member!.onboardingStep ?? 0)}
      logo={{ home: chrome.logoHome, alt: chrome.logoAlt }}
      firstName={lang === 'en' && v.first_name_en ? v.first_name_en : v.first_name_ar}
      fullName={fullName}
      names={{
        ar: [v.first_name_ar, v.middle_name_ar, v.last_name_ar],
        en: [v.first_name_en, v.middle_name_en, v.last_name_en],
      }}
      photoUrl={editor!.photoUrl}
      catalog={[...catalog.values()]}
      skills={editor!.skills}
      visibility={{
        directory: v.is_directory_visible,
        photo: v.show_photo,
        skills: v.show_skills,
        headline: v.show_headline,
      }}
    />
  );
}
