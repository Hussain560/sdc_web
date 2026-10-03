import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, type TabItem } from '@/components/ui';
import { can } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { getAccess } from '@/modules/access/queries';
import { PartnersManager } from '@/modules/admin/components/PartnersManager';
import { SettingsForm } from '@/modules/admin/components/SettingsForm';
import { getAdminSettings, listPartners } from '@/modules/admin/queries';

// ACC-006 (screen 24 §4): site settings and the partners strip. Permission: settings.manage.
export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/dashboard/admin/settings');
  const access = await getAccess();
  if (!access || !can(access, 'settings.manage')) return <Forbidden />;

  const tab = (await searchParams).tab === 'partners' ? 'partners' : 'general';
  const tabs: TabItem[] = [
    { key: 'general', label: ar ? 'عام' : 'General', href: '?tab=general' },
    { key: 'partners', label: ar ? 'الشركاء' : 'Partners', href: '?tab=partners' },
  ];

  return (
    <>
      <PageHeader
        title={ar ? 'إعدادات الموقع' : 'Site settings'}
        description={
          ar
            ? 'روابط التواصل ونص التذييل وسياسة الشهادات وشركاء الصفحة الرئيسية. كل تغيير يُسجَّل.'
            : 'Social links, footer text, the certificate policy and the home-page partners. Every change is logged.'
        }
      />
      <Tabs items={tabs} active={tab} label={ar ? 'القسم' : 'Section'} />
      {tab === 'general' ? (
        <SettingsForm initial={await getAdminSettings()} />
      ) : (
        <PartnersManager rows={await listPartners()} />
      )}
    </>
  );
}
