-- Sprint 17 follow-up 3: fixing the dates of an intake cycle.
-- Before, a running or closed window changed only through "extend" or "close early". Now:
--  * no application yet: the dates can be changed freely (for example dates entered by mistake), and an early
--    close is cleared, so the cycle follows its new dates;
--  * applications exist: a running window keeps its opening time and its closing time may move earlier or later
--    while still ahead; a window that already ended changes only through extend.
-- The no-overlap rule and the review-date check always apply.

create or replace function public.save_membership_cycle(p_id uuid, p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  c public.membership_cycles;
  v_opens timestamptz;
  v_closes timestamptz;
  v_review timestamptz;
  v_questions jsonb;
  v_id uuid;
  has_apps boolean;
  dates_changed boolean;
  reset_early boolean := false;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('membership.manage_cycles') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;

  begin
    v_opens := (p ->> 'opens_at')::timestamptz;
    v_closes := (p ->> 'closes_at')::timestamptz;
    v_review := nullif(p ->> 'review_ends_at', '')::timestamptz;
  exception when others then
    raise exception 'INVALID_DATES' using errcode = 'P0001';
  end;
  if v_opens is null or v_closes is null or v_closes <= v_opens or (v_review is not null and v_review < v_closes) then
    raise exception 'INVALID_DATES' using errcode = 'P0001';
  end if;
  v_questions := coalesce(p -> 'questions', '[]'::jsonb);
  perform private.validate_questions(v_questions);

  if p_id is null then
    insert into public.membership_cycles (name_ar, name_en, description_ar, description_en, opens_at, closes_at,
                                          review_ends_at, capacity, questions, created_by)
    values (btrim(p ->> 'name_ar'), nullif(btrim(p ->> 'name_en'), ''), nullif(p ->> 'description_ar', ''),
            nullif(p ->> 'description_en', ''), v_opens, v_closes, v_review,
            nullif(p ->> 'capacity', '')::integer, v_questions, caller)
    returning id into v_id;
    perform private.write_audit('membership_cycle.created', 'membership_cycle', v_id::text, null, '{}'::jsonb);
    return jsonb_build_object('id', v_id);
  end if;

  select * into c from public.membership_cycles where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if c.status = 'completed' then raise exception 'NOT_EDITABLE' using errcode = 'P0001'; end if;
  has_apps := exists (select 1 from public.membership_applications where cycle_id = c.id);
  -- The form only has minutes: compare to the minute, and keep the exact stored times when nothing changed.
  dates_changed := date_trunc('minute', v_opens) <> date_trunc('minute', c.opens_at)
                or date_trunc('minute', v_closes) <> date_trunc('minute', c.closes_at);
  if not dates_changed then
    v_opens := c.opens_at;
    v_closes := c.closes_at;
  elsif c.status = 'published'
        and private.cycle_phase(c.status, c.opens_at, c.closes_at, c.closed_early_at) <> 'scheduled' then
    if has_apps then
      -- Applications exist: a running window keeps its opening time and may move its closing time (earlier or
      -- later, still ahead); a window that ended changes only through extend.
      if private.cycle_phase(c.status, c.opens_at, c.closes_at, c.closed_early_at) <> 'open'
         or date_trunc('minute', v_opens) <> date_trunc('minute', c.opens_at) or v_closes <= now() then
        raise exception 'NOT_EDITABLE' using errcode = 'P0001';
      end if;
      v_opens := c.opens_at;
    else
      -- Nobody applied yet: dates entered by mistake can be fixed freely, and an early close is cleared.
      reset_early := true;
    end if;
  end if;
  if v_questions <> c.questions and exists (select 1 from public.membership_applications where cycle_id = c.id) then
    raise exception 'QUESTIONS_LOCKED' using errcode = 'P0001'; -- MB / edge case 6
  end if;

  update public.membership_cycles
     set name_ar = btrim(p ->> 'name_ar'), name_en = nullif(btrim(p ->> 'name_en'), ''),
         description_ar = nullif(p ->> 'description_ar', ''), description_en = nullif(p ->> 'description_en', ''),
         opens_at = v_opens, closes_at = v_closes, review_ends_at = v_review,
         capacity = nullif(p ->> 'capacity', '')::integer, questions = v_questions,
         closed_early_at = case when reset_early then null else closed_early_at end
   where id = c.id;
  perform private.write_audit('membership_cycle.updated', 'membership_cycle', c.id::text, null, '{}'::jsonb);
  return jsonb_build_object('id', c.id);
exception
  when exclusion_violation then raise exception 'CYCLE_OVERLAP' using errcode = 'P0001';
  when check_violation then raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  when invalid_text_representation then raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$$;
