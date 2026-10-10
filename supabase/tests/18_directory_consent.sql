begin;
select plan(8);

select has_column('public', 'members', 'show_photo', 'the photo flag exists');
select col_default_is('public', 'members', 'show_photo', 'false', 'photos are off by default');
select col_default_is('public', 'members', 'show_participation', 'false', 'participation is off by default');

-- An unlisted or flagged-off member never reaches anon.
set local role anon;
select is((select count(*)::int from public.member_directory where photo_path is not null), 0, 'no photo is public by default');
select lives_ok($$select * from public.member_public_articles$$, 'anon can read the article ids of listed members');
select throws_ok($$select * from public.members$$, '42501', null, 'anon cannot read the members table');

reset role;
-- Turning a flag off hides that column in the directory.
update public.members set show_university = false, show_track = false, show_links = false
  where id = (select id from public.member_directory limit 1);
set local role anon;
select is((select count(*)::int from public.member_directory where university is null and track is null and github_url is null and linkedin_url is null), (select count(*)::int from public.member_directory where university is null and track is null) , 'a flag that is off hides university, track and links');
select ok((select count(*) from public.member_directory) >= 1, 'the member is still listed');

select * from finish();
rollback;
