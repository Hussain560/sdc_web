-- RDS-017: the home page figures. Counts only, nothing personal. One row.
-- The view runs with its owner's rights on purpose, so anon can read the counts without reading the tables.
create view public.public_stats as
select
  (select count(*) from public.public_events where phase = 'ended')::int as events_held,
  (select count(*) from public.member_directory)::int                     as members_listed,
  (select count(*) from public.committees where status = 'active')::int   as committees_active,
  (select count(*) from public.certificates where delivery_status in ('generated', 'sent'))::int
                                                                           as certificates_issued;

comment on view public.public_stats is 'Counts for the public home page (RDS-017). No personal data.';
grant select on public.public_stats to anon, authenticated;
