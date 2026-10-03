-- LCH-002 — contract step of the expand/contract migration (migration strategy, step 7).
-- The application reads only the new tables since Sprints 06–08. This drops the renamed legacy tables.
-- It refuses to run when a legacy row has no counterpart, so a forgotten or failed data migration cannot be
-- hidden by the drop. Take a backup first; there is no undo except a restore.

do $$
declare
  unmapped_members integer;
  unmapped_registrations integer;
begin
  select count(*) into unmapped_members
    from public.members_legacy l
   where not exists (select 1 from public.members m where m.legacy_id = l.id);

  select count(*) into unmapped_registrations
    from public.event_registrations_legacy l
   where not exists (select 1 from public.event_registrations r where r.legacy_id = l.id)
     -- the data migration keeps one row per person and event, so a duplicate legacy row is accounted for by its twin
     and not exists (
       select 1 from public.event_registrations r
         join public.events e on e.id = r.event_id
        where e.legacy_id = l.event_id
          and (r.user_id is not distinct from l.user_id and l.user_id is not null
               or lower(r.email_snapshot) = lower(coalesce(l.email, ''))));

  if unmapped_members > 0 or unmapped_registrations > 0 then
    raise exception 'CONTRACT_REFUSED: % legacy member(s) and % legacy registration(s) have no counterpart in the new tables',
      unmapped_members, unmapped_registrations;
  end if;
end $$;

drop function if exists private.import_legacy_members();
drop table public.event_registrations_legacy;
drop table public.members_legacy;
