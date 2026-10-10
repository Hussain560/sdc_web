begin;
select plan(6);

select has_column('public', 'event_dates', 'location_ar', 'a day can have its own place (Arabic)');
select has_column('public', 'event_dates', 'location_en', 'a day can have its own place (English)');

set local role anon;
select is((select count(*)::int from public.site_settings where key in ('certificates_enabled', 'certificate_threshold')), 2,
  'anon can read the two certificate settings');
select is((select count(*)::int from public.site_settings where not is_public), 0,
  'anon still cannot read any private setting');
select is(public.event_checkin_open('no-such-event'), false, 'an unknown event has no open check-in');
select lives_ok($$select public.event_checkin_open('x')$$, 'anon may call the check-in probe');

select * from finish();
rollback;
