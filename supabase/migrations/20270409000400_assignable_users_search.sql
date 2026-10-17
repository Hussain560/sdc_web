-- ACC-007 (Sprint 17): the person picker of "assign position".
-- Before: the app searched the `profiles` table, which only holders of `users.view` can read, and quietly returned an
-- empty list for everybody else (a committee head found nobody). It also searched the account name only, so a
-- member added with an English name could not be found in English.
-- Now: one function that answers who the caller may search, searches every name part in both languages, and says
-- when the search is limited instead of staying silent.

create or replace function public.search_assignable_users(p_query text, p_committee uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  can_all boolean;       -- may search every active member (users.view)
  can_assign boolean;    -- may open the assign dialog at all
  q text := btrim(coalesce(p_query, ''));
  pattern text;
  result jsonb;
  head jsonb;            -- who leads the committee now (name only), so the dialog can warn before saving
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  can_all := private.has_permission('users.view');
  can_assign := private.has_permission('roles.assign')
                or (p_committee is not null and private.has_permission('committee_members.manage', p_committee));
  if not can_assign then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if p_committee is not null then
    -- The head is named from the member record when there is one, otherwise from the account.
    select jsonb_build_object(
             'name_ar', coalesce(nullif(btrim(concat_ws(' ', m.first_name_ar, m.middle_name_ar, m.last_name_ar)), ''), p.full_name_ar),
             'name_en', coalesce(nullif(btrim(concat_ws(' ', m.first_name_en, m.middle_name_en, m.last_name_en)), ''), p.full_name_en))
    into head
    from public.role_assignments ra
    join public.profiles p on p.id = ra.user_id
    left join public.members m on m.user_id = ra.user_id
    where ra.role_key = 'committee_head' and ra.committee_id = p_committee
      and ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now())
    limit 1;
  end if;
  -- Without a committee there is nothing to limit the search to, so it needs the wide permission.
  if not can_all and p_committee is null then
    return jsonb_build_object('restricted', true, 'rows', '[]'::jsonb, 'head', head);
  end if;
  if char_length(q) < 2 then
    return jsonb_build_object('restricted', not can_all, 'rows', '[]'::jsonb, 'head', head);
  end if;
  pattern := '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%';

  select jsonb_build_object('restricted', not can_all, 'head', head,
                            'rows', coalesce(jsonb_agg(row_to_json(t) order by t.in_committee desc, t.name_ar), '[]'::jsonb))
  into result
  from (
    select
      m.id as member_id,
      m.user_id,
      btrim(concat_ws(' ', m.first_name_ar, m.middle_name_ar, m.last_name_ar)) as name_ar,
      nullif(btrim(concat_ws(' ', m.first_name_en, m.middle_name_en, m.last_name_en)), '') as name_en,
      case when can_all then p.email end as email,
      case when m.show_photo and m.is_directory_visible then m.photo_path end as photo_path,
      (au.last_sign_in_at is not null) as activated,
      coalesce(cm.in_committee, false) as in_committee,
      cm.role_ar, cm.role_en
    from public.members m
    join public.profiles p on p.id = m.user_id
    left join auth.users au on au.id = m.user_id
    left join lateral (
      select true as in_committee,
             (array_agg(r.name_ar order by r.display_order))[1] as role_ar,
             (array_agg(r.name_en order by r.display_order))[1] as role_en
      from public.role_assignments ra
      join public.roles r on r.key = ra.role_key
      where ra.user_id = m.user_id and ra.committee_id = p_committee
        and ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now())
      having count(*) > 0
    ) cm on p_committee is not null
    where m.status = 'active'
      and m.user_id is not null
      and (can_all or coalesce(cm.in_committee, false))
      and (
        concat_ws(' ', m.first_name_ar, m.middle_name_ar, m.last_name_ar) ilike pattern
        or concat_ws(' ', m.first_name_en, m.middle_name_en, m.last_name_en) ilike pattern
        or (can_all and p.email ilike pattern)
      )
    order by coalesce(cm.in_committee, false) desc, 3
    limit 12
  ) t;
  return result;
end;
$$;
revoke all on function public.search_assignable_users(text, uuid) from public, anon;
grant execute on function public.search_assignable_users(text, uuid) to authenticated;
comment on function public.search_assignable_users(text, uuid) is
  'Person picker for assigning a position. Searches active members by every name part in both languages; e-mail only for users.view; scope-limited callers see their committee only and are told so.';
