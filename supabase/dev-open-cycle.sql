-- LOCAL ONLY: the cycle to test the whole flow with: Winter 2027 is OPEN (25 places, closes in 30 days) and Autumn 2026 is
-- closed (only one open cycle at a time). Run last in the demo chain.
--   docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1 < supabase/dev-open-cycle.sql
begin;
update public.membership_cycles set closes_at = now() - interval '1 day', review_ends_at = now() + interval '20 days'
 where name_en = 'Autumn 2026 intake';
update public.membership_cycles set opens_at = now() - interval '1 hour', closes_at = now() + interval '30 days',
       review_ends_at = now() + interval '45 days', capacity = 25
 where name_en = 'Winter 2027 intake';
commit;
