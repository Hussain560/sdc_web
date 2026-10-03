-- Sprint 05 · EVT-010 — presenter lookup helpers.

-- Wizard typeahead: accounts a committee can pick as presenters. Only people who can edit events may search,
-- and only the name is returned (no e-mail) — heads do not hold users.view.
create or replace function public.search_presenter_candidates(p_query text)
returns table (id uuid, full_name_ar text, full_name_en text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name_ar, p.full_name_en
  from public.profiles p
  where private.has_permission_any_scope('events.edit')
    and char_length(btrim(coalesce(p_query, ''))) >= 2
    and (p.full_name_ar ilike '%' || btrim(p_query) || '%' or p.full_name_en ilike '%' || btrim(p_query) || '%')
  order by p.full_name_ar
  limit 8
$$;

-- Presenters of an event with display names (account names are public information once an event shows them).
-- Visible whenever the event itself is visible to the caller.
create or replace function public.event_presenters_for(p_event uuid)
returns table (
  id uuid, role text, sort_order smallint, profile_id uuid,
  name_ar text, name_en text, title_ar text, title_en text, photo_path text, link text
)
language sql
stable
security definer
set search_path = ''
as $$
  select ep.id, ep.role, ep.sort_order, ep.profile_id,
         coalesce(p.full_name_ar, ep.guest_name_ar), coalesce(p.full_name_en, ep.guest_name_en, p.full_name_ar, ep.guest_name_ar),
         ep.guest_title_ar, ep.guest_title_en, ep.guest_photo_path, ep.guest_link
  from public.event_presenters ep
  join public.events e on e.id = ep.event_id
  left join public.profiles p on p.id = ep.profile_id
  where ep.event_id = p_event
    and (e.status in ('published', 'cancelled', 'completed', 'archived')
         or private.has_permission('events.view_drafts', e.committee_id))
  order by ep.sort_order
$$;

revoke all on function public.search_presenter_candidates(text) from public, anon;
grant execute on function public.search_presenter_candidates(text) to authenticated;
revoke all on function public.event_presenters_for(uuid) from public;
grant execute on function public.event_presenters_for(uuid) to anon, authenticated;
