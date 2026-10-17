-- Sprint 17 (MEM-012): who may put a photo where, and what the photo functions refuse.
begin;
select no_plan();

-- The storage schema blocks plain SQL deletes; the policy is what is under test, so allow the query here.
select set_config('storage.allow_delete_query', 'true', true);

delete from public.role_assignments;
delete from public.members;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000c101', 'authenticated', 'authenticated', 'ph1@example.test', now(), '{"full_name":"Photo One"}'),
  ('00000000-0000-0000-0000-00000000c102', 'authenticated', 'authenticated', 'ph2@example.test', now(), '{"full_name":"Photo Two"}'),
  ('00000000-0000-0000-0000-00000000c103', 'authenticated', 'authenticated', 'ph3@example.test', now(), '{"full_name":"Not Member"}'),
  ('00000000-0000-0000-0000-00000000c104', 'authenticated', 'authenticated', 'ph4@example.test', now(), '{"full_name":"Staff Person"}');
insert into public.members (id, user_id, status, joined_via, first_name_ar, last_name_ar) values
  ('00000000-0000-0000-0000-00000000d101', '00000000-0000-0000-0000-00000000c101', 'active', 'manual', 'أول', 'عضو'),
  ('00000000-0000-0000-0000-00000000d102', '00000000-0000-0000-0000-00000000c102', 'active', 'manual', 'ثان', 'عضو');
insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000c104', 'system_admin');

select is((select public from storage.buckets where id = 'member-photos'), true, 'the bucket is public for reading');
select is((select file_size_limit from storage.buckets where id = 'member-photos'), 2097152::bigint, 'files are limited to 2 MB');
select is((select allowed_mime_types from storage.buckets where id = 'member-photos'), array['image/jpeg', 'image/png', 'image/webp'], 'only images are accepted');

-- ------------------------------------------------------------------------------------------ storage policies
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c101","role":"authenticated"}', true);
select lives_ok($$insert into storage.objects (bucket_id, name, owner) values ('member-photos', '00000000-0000-0000-0000-00000000c101/11111111-1111-1111-1111-111111111111.webp', '00000000-0000-0000-0000-00000000c101')$$, 'a member writes in their own folder');
select throws_ok($$insert into storage.objects (bucket_id, name, owner) values ('member-photos', '00000000-0000-0000-0000-00000000c102/22222222-2222-2222-2222-222222222222.webp', '00000000-0000-0000-0000-00000000c101')$$, '42501', null, 'a member cannot write in another member folder');
select throws_ok($$insert into storage.objects (bucket_id, name, owner) values ('member-photos', 'loose.webp', '00000000-0000-0000-0000-00000000c101')$$, '42501', null, 'nor outside any folder');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c103","role":"authenticated"}', true);
select throws_ok($$insert into storage.objects (bucket_id, name, owner) values ('member-photos', '00000000-0000-0000-0000-00000000c103/33333333-3333-3333-3333-333333333333.webp', '00000000-0000-0000-0000-00000000c103')$$, '42501', null, 'a person who is not an active member cannot upload');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c102","role":"authenticated"}', true);
select is((select count(*)::int from storage.objects where bucket_id = 'member-photos'), 1, 'a photo can be read by any signed-in person');
delete from storage.objects where bucket_id = 'member-photos' and name like '00000000-0000-0000-0000-00000000c101/%';
select is((select count(*)::int from storage.objects where bucket_id = 'member-photos'), 1, 'a member cannot delete another member photo');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c104","role":"authenticated"}', true);
delete from storage.objects where bucket_id = 'member-photos' and name like '00000000-0000-0000-0000-00000000c101/%';
select is((select count(*)::int from storage.objects where bucket_id = 'member-photos'), 0, 'leadership with members.manage can remove a photo');
reset role;

set local role anon;
select is((select count(*)::int from storage.objects where bucket_id = 'member-photos'), 0, 'anon reads through the same policy');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('member-photos', 'x/y.webp')$$, '42501', null, 'anon cannot write');
reset role;

-- ------------------------------------------------------------------------------------------ the photo functions
insert into storage.objects (bucket_id, name, owner) values
  ('member-photos', '00000000-0000-0000-0000-00000000c101/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp', '00000000-0000-0000-0000-00000000c101'),
  ('member-photos', '00000000-0000-0000-0000-00000000c101/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.jpg', '00000000-0000-0000-0000-00000000c101');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c101","role":"authenticated"}', true);
select is(public.set_my_member_photo('00000000-0000-0000-0000-00000000c101/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp', true), null, 'the first photo replaces nothing');
select is((select photo_path from public.members where id = '00000000-0000-0000-0000-00000000d101'), '00000000-0000-0000-0000-00000000c101/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp', 'the path is saved');
select is((select show_photo from public.members where id = '00000000-0000-0000-0000-00000000d101'), true, 'and the consent answer');
select is(public.set_my_member_photo('00000000-0000-0000-0000-00000000c101/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.jpg'), '00000000-0000-0000-0000-00000000c101/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp', 'a new photo returns the old path so the file can be deleted');
select is((select show_photo from public.members where id = '00000000-0000-0000-0000-00000000d101'), true, 'not sending the answer keeps the old one');

select throws_ok($$select public.set_my_member_photo('00000000-0000-0000-0000-00000000c102/cccccccc-cccc-cccc-cccc-cccccccccccc.webp')$$, 'P0001', 'VALIDATION_FAILED', 'a path in another folder is refused');
select throws_ok($$select public.set_my_member_photo('00000000-0000-0000-0000-00000000c101/../x.webp')$$, 'P0001', 'VALIDATION_FAILED', 'a path that climbs out of the folder is refused');
select throws_ok($$select public.set_my_member_photo('00000000-0000-0000-0000-00000000c101/cccccccc-cccc-cccc-cccc-cccccccccccc.gif')$$, 'P0001', 'VALIDATION_FAILED', 'a wrong extension is refused');
select throws_ok($$select public.set_my_member_photo('00000000-0000-0000-0000-00000000c101/dddddddd-dddd-dddd-dddd-dddddddddddd.webp')$$, 'P0001', 'NOT_FOUND', 'a path with no uploaded file is refused');

select is(public.remove_my_member_photo(), '00000000-0000-0000-0000-00000000c101/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.jpg', 'removing returns the path to delete');
select is((select photo_path from public.members where id = '00000000-0000-0000-0000-00000000d101'), null, 'the photo is gone');
select is((select show_photo from public.members where id = '00000000-0000-0000-0000-00000000d101'), false, 'and switched off, so the next upload asks again');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c103","role":"authenticated"}', true);
select throws_ok($$select public.set_my_member_photo('00000000-0000-0000-0000-00000000c103/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee.webp')$$, 'P0001', 'NOT_A_MEMBER', 'a person who is not a member cannot set a photo');
select throws_ok($$select public.remove_my_member_photo()$$, 'P0001', 'NOT_A_MEMBER', 'nor remove one');
reset role;
set local role anon;
select throws_ok($$select public.set_my_member_photo('x/y.webp')$$, '42501', null, 'anon cannot call it');
reset role;

select * from finish();
rollback;
