import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, type TabItem } from '@/components/ui';
import { canGlobal } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { getAccess } from '@/modules/access/queries';
import { ReferenceTable, type ReferenceRow } from '@/modules/reference/components/ReferenceTable';

// Reference lists (screen 24): universities, majors (with sub-majors) and tracks. Permission: reference_data.manage.
const TABS = ['universities', 'majors', 'tracks'] as const;
type Tab = (typeof TABS)[number];
const LABEL: Record<Tab, { ar: string; en: string }> = {
  universities: { ar: 'الجامعات', en: 'Universities' },
  majors: { ar: 'التخصصات', en: 'Majors' },
  tracks: { ar: 'المسارات', en: 'Tracks' },
};

export default async function ReferenceDataPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/dashboard/admin/reference-data');
  const access = await getAccess();
  if (!access || !canGlobal(access, 'reference_data.manage')) return <Forbidden />;

  const sp = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(sp.tab ?? '')
    ? (sp.tab as Tab)
    : 'universities';

  const supabase = await createClient();
  let rows: ReferenceRow[] = [];
  let parents: Array<{ id: number; name: string }> | undefined;
  if (tab === 'majors') {
    const { data } = await supabase
      .from('majors')
      .select('id, name_ar, name_en, is_active, parent_id')
      .order('name_ar');
    const byId = new Map((data ?? []).map((m) => [m.id, m.name_ar]));
    rows = (data ?? []).map((m) => ({
      id: m.id,
      nameAr: m.name_ar,
      nameEn: m.name_en,
      isActive: m.is_active,
      parentId: m.parent_id,
      parentName: m.parent_id ? byId.get(m.parent_id) : undefined,
    }));
    parents = (data ?? []).filter((m) => !m.parent_id).map((m) => ({ id: m.id, name: m.name_ar }));
  } else {
    const { data } = await supabase
      .from(tab)
      .select('id, name_ar, name_en, is_active')
      .order('display_order')
      .order('name_ar');
    rows = (data ?? []).map((m) => ({
      id: m.id,
      nameAr: m.name_ar,
      nameEn: m.name_en,
      isActive: m.is_active,
      parentId: null,
    }));
  }

  const tabs: TabItem[] = TABS.map((t) => ({ key: t, label: LABEL[t][lang], href: `?tab=${t}` }));

  return (
    <>
      <PageHeader
        title={ar ? 'القوائم المرجعية' : 'Reference lists'}
        description={
          ar
            ? 'قيم تُستخدم في نموذج الانضمام وملفات الأعضاء. تُعطَّل القيم المستخدمة ولا تُحذف.'
            : 'Values used by the join form and member profiles. Used values are deactivated, never deleted.'
        }
      />
      <Tabs items={tabs} active={tab} label={ar ? 'القائمة' : 'List'} />
      <ReferenceTable table={tab} rows={rows} parents={parents} />
    </>
  );
}
