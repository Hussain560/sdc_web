-- Sprint 11 · ACC-005, ACC-006, REG-007, PUB-001 — audit log reader, audited exports with a filter, site settings
-- validation, partners and tags: who may, what is refused, and that every change leaves an audit row.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.partners;

insert into auth.users (id, aud, role, email, raw_user_meta_data)
select ('00000000-0000-0000-0000-00000000' || lpad(n::text, 4, '0'))::uuid, 'authenticated', 'authenticated',
       'u' || n || '@adm.example.test', jsonb_build_object('full_name', 'Admin User ' || n)
from generate_series(1201, 1203) n;
-- 1201 system admin · 1202 community leader (no audit.view) · 1203 plain user
insert into public.role_assignments (user_id, role_key) values
  ('00000000-0000-0000-0000-000000001201', 'system_admin'),
  ('00000000-0000-0000-0000-000000001202', 'community_leader');

create temp table _audit0 as select count(*)::integer as n,
  (select count(*)::integer from public.audit_logs where action = 'settings.update') as settings,
  (select count(*)::integer from public.audit_logs where action like 'partner.%') as partners
  from public.audit_logs;
grant select on _audit0 to authenticated;

insert into public.tags (id, slug, label_ar, label_en) values
  ('00000000-0000-0000-0000-0000000f1001', 'adm-used', 'مستخدم', 'Used'),
  ('00000000-0000-0000-0000-0000000f1002', 'adm-free', 'حر', 'Free');

set local role authenticated;

-- ------------------------------------------------------------------------------ audit reader
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001202","role":"authenticated"}', true);
select throws_ok($$select public.list_audit_logs()$$, 'P0001', 'FORBIDDEN', 'a leader without audit.view cannot read the log');
select throws_ok($$select public.audit_facets()$$, 'P0001', 'FORBIDDEN', 'nor its facets');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001201","role":"authenticated"}', true);
select lives_ok($$select public.record_export('audit_logs', 4, '{"action":"export","from":"2026-01-01"}'::jsonb)$$, 'the admin records an audit export');
select is((select (public.list_audit_logs(p_action => 'export') -> 'rows' -> 0 -> 'summary' -> 'filter' ->> 'action')), 'export', 'the export filter is stored with the row');
select is((select (public.list_audit_logs(p_action => 'export') -> 'rows' -> 0 -> 'summary' ->> 'rows')::integer), 4, 'and the count');
select ok((select (public.list_audit_logs() ->> 'total')::integer from _audit0 limit 1) >= 1, 'the reader returns rows');
select is((select jsonb_array_length(public.list_audit_logs(p_limit => 1) -> 'rows')), 1, 'the page size is respected');
select is((select jsonb_array_length(public.list_audit_logs(p_entity => 'no_such_entity') -> 'rows')), 0, 'an unknown entity matches nothing');
select throws_ok($$select public.list_audit_logs(p_from => '2026-02-01', p_to => '2026-01-01')$$, 'P0001', 'VALIDATION_FAILED:to', 'an inverted range is refused');
select ok((select public.audit_facets() -> 'actions') ? 'export', 'the action facet lists the families in use');

-- ------------------------------------------------------------------------------ export filter
select throws_ok($$select public.record_export('nonsense', 1)$$, 'P0001', 'VALIDATION_FAILED', 'an unknown export kind is refused');
select throws_ok($$select public.record_export('registrations', 1, '[1]'::jsonb)$$, 'P0001', 'VALIDATION_FAILED:filter', 'a non-object filter is refused');
select lives_ok($$select public.record_export('registrations', 2, '{"event":"x","nested":{"a":1}}'::jsonb)$$, 'a filter with a nested value is accepted');
select is((select public.list_audit_logs(p_action => 'export.registrations') -> 'rows' -> 0 -> 'summary' -> 'filter' ? 'nested'), false, 'nested values are dropped from the stored filter');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001202","role":"authenticated"}', true);
select throws_ok($$select public.record_export('audit_logs', 1)$$, 'P0001', 'FORBIDDEN', 'only audit.view holders may export the audit log');

-- ------------------------------------------------------------------------------ site settings
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001203","role":"authenticated"}', true);
select throws_ok($$select public.save_site_settings('{"contact_email":"a@b.sa"}'::jsonb)$$, 'P0001', 'FORBIDDEN', 'a plain user cannot change settings');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001201","role":"authenticated"}', true);
select throws_ok($$select public.save_site_settings('{"social_x":"http://x.com/a"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED:social_x', 'a social link must be https');
select throws_ok($$select public.save_site_settings('{"social_x":"javascript:alert(1)"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED:social_x', 'a javascript: link is refused');
select throws_ok($$select public.save_site_settings('{"contact_email":"not-an-email"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED:contact_email', 'a malformed e-mail is refused');
select throws_ok($$select public.save_site_settings('{"certificate_threshold":101}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED:certificate_threshold', 'a threshold above 100 is refused');
select throws_ok($$select public.save_site_settings('{"certificate_threshold":70.5}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED:certificate_threshold', 'a fractional threshold is refused');
select throws_ok($$select public.save_site_settings('{"certificates_enabled":"yes"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED:certificates_enabled', 'the switch must be a boolean');
select throws_ok($$select public.save_site_settings('{"anything_else":"x"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED:anything_else', 'an unknown key is refused');
select throws_ok($$select public.save_site_settings('[]'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'a non-object payload is refused');

select lives_ok($$select public.save_site_settings('{"contact_email":"hello@sdc.example.test","certificates_enabled":true,"certificate_threshold":80}'::jsonb)$$, 'valid settings are saved');
select is((select value from public.site_settings where key = 'contact_email'), '"hello@sdc.example.test"'::jsonb, 'the e-mail is stored');
select is((select is_public from public.site_settings where key = 'contact_email'), true, 'contact e-mail is public');
select is((select is_public from public.site_settings where key = 'certificate_threshold'), false, 'the threshold stays private');
select is((select value from public.site_settings where key = 'certificate_threshold'), '80'::jsonb, 'the threshold is stored');
select is((select jsonb_array_length(public.list_audit_logs(p_action => 'settings.update') -> 'rows' -> 0 -> 'summary' -> 'keys')), 3, 'the audit row names the three keys changed');
select lives_ok($$select public.save_site_settings('{"contact_email":"hello@sdc.example.test"}'::jsonb)$$, 'saving an unchanged value is accepted');
select is((select (public.list_audit_logs(p_action => 'settings.update') ->> 'total')::integer - settings from _audit0), 1, 'and writes no second audit row');

-- ------------------------------------------------------------------------------ partners
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001203","role":"authenticated"}', true);
select throws_ok($$select public.save_partner(null, '{"name_ar":"شريك"}'::jsonb)$$, 'P0001', 'FORBIDDEN', 'a plain user cannot add a partner');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001201","role":"authenticated"}', true);
select throws_ok($$select public.save_partner(null, '{"name_ar":""}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED:name_ar', 'a partner needs an Arabic name');
select throws_ok($$select public.save_partner(null, '{"name_ar":"شريك","logo_url":"http://x.test/a.png"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED:logo_url', 'the logo must be https');
select lives_ok($$select public.save_partner(null, '{"name_ar":"شريك أول","name_en":"First","logo_url":"https://x.test/a.png","display_order":1}'::jsonb)$$, 'a partner is added');
select lives_ok($$select public.save_partner(null, '{"name_ar":"شريك مخفي","is_active":false}'::jsonb)$$, 'an inactive partner is added');
select is((select count(*)::integer from public.partners), 2, 'the admin sees both partners');
select is((select (public.list_audit_logs(p_action => 'partner', p_limit => 200) ->> 'total')::integer - partners from _audit0), 2, 'each partner left an audit row');

set local role anon;
select is((select count(*)::integer from public.partners), 1, 'the public sees only the active partner');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001201","role":"authenticated"}', true);
select lives_ok($$select public.delete_partner((select id from public.partners where name_ar = 'شريك مخفي'))$$, 'a partner is deleted');
select throws_ok($$select public.delete_partner(gen_random_uuid())$$, 'P0001', 'NOT_FOUND', 'deleting an unknown partner says so');

-- ------------------------------------------------------------------------------ tags
select throws_ok($$select public.save_tag('00000000-0000-0000-0000-0000000f1002', '', 'x')$$, 'P0001', 'VALIDATION_FAILED:label_ar', 'a tag needs an Arabic label');
select lives_ok($$select public.save_tag('00000000-0000-0000-0000-0000000f1002', 'حرّ', 'Free tag')$$, 'a tag is renamed');
select is((select label_en from public.tags where slug = 'adm-free'), 'Free tag', 'the new label is stored');
select is((select uses from public.tag_usage() where slug = 'adm-free'), 0, 'usage counts are reported');
select lives_ok($$select public.delete_tag('00000000-0000-0000-0000-0000000f1002')$$, 'an unused tag is deleted');
select throws_ok($$select public.delete_tag('00000000-0000-0000-0000-0000000f1002')$$, 'P0001', 'NOT_FOUND', 'a second delete says not found');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001203","role":"authenticated"}', true);
select throws_ok($$select public.save_tag('00000000-0000-0000-0000-0000000f1001', 'x', 'x')$$, 'P0001', 'FORBIDDEN', 'a plain user cannot edit tags');

select * from finish();
rollback;
