begin;
select plan(4);

select has_view('public', 'public_stats', 'the public stats view exists');
select is((select count(*)::int from public.public_stats), 1, 'it returns exactly one row');
select columns_are('public', 'public_stats',
  array['events_held', 'members_listed', 'committees_active', 'certificates_issued'],
  'it exposes counts only');

set local role anon;
select lives_ok($$select * from public.public_stats$$, 'anon can read the counts');

select * from finish();
rollback;
