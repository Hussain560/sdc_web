-- MEM-012 (Sprint 17): member profile photos. A member writes only inside their own folder of the `member-photos`
-- bucket (`<user id>/<token>.webp` and `<token>-128.webp`); anyone can read an object whose address they know, but the
-- address only leaves the database through the public views when the member turned the photo on (`show_photo`).
-- File names are random, so an address cannot be guessed. A photo is never put in an e-mail.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-photos', 'member-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy member_photos_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'member-photos');

create policy member_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'member-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.members m where m.user_id = (select auth.uid()) and m.status = 'active')
  );

create policy member_photos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'member-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'member-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- A member removes their own files; leadership may remove any (for example after a complaint).
create policy member_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'member-photos'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or private.has_permission('members.manage'))
  );

-- ------------------------------------------------------------------------------------------ the photo of a member
-- Returns the path that was replaced so the caller can delete the old files.
create or replace function public.set_my_member_photo(p_path text, p_show boolean default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  m public.members;
  old_path text;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into m from public.members where user_id = caller for update;
  if not found or m.status <> 'active' then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;
  -- Only the exact shape the app writes: <own user id>/<random uuid>.webp or .jpg
  if p_path is null or p_path !~ ('^' || caller::text || '/[0-9a-f-]{36}\.(webp|jpg)$') then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'member-photos' and name = p_path) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  old_path := m.photo_path;
  update public.members set photo_path = p_path, show_photo = coalesce(p_show, show_photo) where id = m.id;
  perform private.write_audit('member.photo_updated', 'member', m.id::text, null, jsonb_build_object('shown', coalesce(p_show, m.show_photo)));
  return old_path;
end;
$$;
revoke all on function public.set_my_member_photo(text, boolean) from public, anon;
grant execute on function public.set_my_member_photo(text, boolean) to authenticated;

-- Removing the photo also turns it off, so a later upload asks for consent again.
create or replace function public.remove_my_member_photo()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  m public.members;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into m from public.members where user_id = caller for update;
  if not found then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;
  update public.members set photo_path = null, show_photo = false where id = m.id;
  perform private.write_audit('member.photo_removed', 'member', m.id::text, null, '{}'::jsonb);
  return m.photo_path;
end;
$$;
revoke all on function public.remove_my_member_photo() from public, anon;
grant execute on function public.remove_my_member_photo() to authenticated;
