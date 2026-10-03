-- Sprint 03 · AUTH-005 — profiles (docs/05-database/entities/identity-and-access.md §1).
-- One row per auth user, created by trigger; users edit only a few columns of their own row.

-- Helper schema for security-definer functions. Not exposed through the Data API (api.schemas = public only).
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  email            text not null,
  full_name_ar     text not null check (char_length(full_name_ar) between 3 and 100),
  full_name_en     text check (char_length(full_name_en) <= 100),
  preferred_locale text not null default 'ar' check (preferred_locale in ('ar', 'en')),
  avatar_path      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.profiles is 'App-level identity, 1:1 with auth.users. Created by private.handle_new_user().';
create unique index profiles_email_key on public.profiles (lower(email));

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function private.touch_updated_at();

-- Builds a display name that always satisfies the 3..100 check, so a sign-up can never fail here.
create or replace function private.profile_name(meta jsonb, fallback_email text, uid uuid)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when char_length(left(btrim(coalesce(meta ->> 'full_name', '')), 100)) >= 3
      then left(btrim(meta ->> 'full_name'), 100)
    when char_length(split_part(coalesce(fallback_email, ''), '@', 1)) >= 3
      then left(split_part(fallback_email, '@', 1), 100)
    else 'user-' || left(uid::text, 8)
  end
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name_ar, preferred_locale)
  values (
    new.id,
    lower(new.email),
    private.profile_name(new.raw_user_meta_data, new.email, new.id),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'ar' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function private.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = lower(new.email) where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function private.sync_profile_email();

-- Backfill for accounts created before this migration (idempotent).
insert into public.profiles (id, email, full_name_ar, preferred_locale)
select u.id, lower(u.email), private.profile_name(u.raw_user_meta_data, u.email, u.id),
       case when u.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'ar' end
from auth.users u
where u.email is not null
on conflict (id) do nothing;

-- RLS + grants (docs/05-database/rls-security-model.md §4).
alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name_ar, full_name_en, preferred_locale, avatar_path) on table public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
