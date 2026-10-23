-- Sprint 18 · MBR-011 — a reviewer may ask for an edit while the application waits on the waiting list too (a person on the
-- waiting list can be asked to improve the application); the resubmission puts it back in the queue as "submitted".
CREATE OR REPLACE FUNCTION public.request_application_info(p_id uuid, p_message text, p_fields text[] DEFAULT '{}'::text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller uuid := (select auth.uid());
  a public.membership_applications;
  c public.membership_cycles;
  msg text := nullif(btrim(coalesce(p_message, '')), '');
  f text;
  mine text;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('membership.review') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if msg is null or char_length(msg) > 1000 then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
  select * into a from public.membership_applications where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  select lower(email) into mine from public.profiles where id = caller;
  if a.user_id = caller or lower(a.email) = mine then raise exception 'SELF_DECISION' using errcode = 'P0001'; end if;
  if a.status not in ('submitted', 'under_review', 'waitlisted') then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  if a.status = 'under_review' and a.reviewer_id is distinct from caller and not private.is_system_admin() then
    raise exception 'ALREADY_CLAIMED' using errcode = 'P0001';
  end if;
  select * into c from public.membership_cycles where id = a.cycle_id;
  if c.status = 'completed' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  foreach f in array coalesce(p_fields, '{}') loop
    if f not in ('portfolio_url', 'github_url', 'linkedin_url', 'x_url', 'bio_ar', 'bio_en')
       and not (f like 'q:%' and exists (select 1 from jsonb_array_elements(c.questions) x where x ->> 'key' = substr(f, 3))) then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
  end loop;
  update public.membership_applications
     set status = 'info_requested', info_request = msg, info_fields = coalesce(p_fields, '{}'),
         info_requested_at = now(), reviewer_id = caller
   where id = a.id;
  perform private.add_application_event(a.id, 'info_requested', jsonb_build_object('fields', to_jsonb(coalesce(p_fields, '{}'::text[]))));
  perform private.write_audit('membership_application.info_requested', 'membership_application', a.id::text, null, '{}'::jsonb);
end;
$function$;
