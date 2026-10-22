-- LOCAL ONLY: two projects for ماجد علي القرني (dev.expiring) so the projects tab and the profile have data.
--   docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1 < supabase/dev-expiring-projects.sql
-- Safe to run twice (fixed ids).
begin;
insert into public.member_projects (id, member_id, position, title_ar, title_en, description_ar, description_en, url)
select v.id, m.id, v.pos, v.tar, v.ten, v.dar, v.den, v.url
from public.members m join public.profiles p on p.id = m.user_id
cross join (values
  ('00000000-0000-0000-0000-0000000d0001'::uuid, 0, 'منصة متابعة الحضور للفعاليات', 'Event attendance tracker',
   'تطبيق ويب يسجّل حضور الفعاليات عبر رمز QR ويصدر الشهادات تلقائياً.', 'A web app that records event attendance with a QR code and issues certificates automatically.', 'https://github.com/example/attendance-tracker'),
  ('00000000-0000-0000-0000-0000000d0002'::uuid, 1, 'واجهة برمجة لإدارة الورش', 'Workshop management API',
   'واجهة برمجية موثّقة لإدارة مواعيد الورش والمسجّلين، مع مفاتيح وصول لكل لجنة.', 'A documented API to manage workshop schedules and attendees, with access keys per committee.', 'https://github.com/example/workshop-api')
) as v(id, pos, tar, ten, dar, den, url)
where p.email = 'dev.expiring@example.test'
on conflict (id) do nothing;
commit;
