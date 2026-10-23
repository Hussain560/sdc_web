import type { Metadata } from 'next';
import { CHROME } from '@/components/layout/chrome-strings';
import { redirect } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth/session';
import { getAccountState } from '@/modules/account/state';
import { OnboardingFlow } from '@/modules/members/components/OnboardingFlow';
import { getMyEditorData } from '@/modules/members/editor';
import { getMyMembership } from '@/modules/members/my-membership';
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
  const [state, editor, catalog, mine] = await Promise.all([
    getAccountState(),
    getMyEditorData(),
    getSkillCatalog(),
    getMyMembership(lang),
  ]);
  if (!state?.member || !editor || !mine) redirect({ href: '/account/profile', locale });
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
      card={mine!.card}
      base={{
        headline: Boolean(v.headline_ar || v.headline_en),
        about: Boolean(v.about_ar || v.about_en),
        links: Object.values(v.links).filter(Boolean).length,
      }}
      visibility={{
        directory: v.is_directory_visible,
        photo: v.show_photo,
        skills: v.show_skills,
        headline: v.show_headline,
      }}
    />
  );
}
