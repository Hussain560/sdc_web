-- Sprint 18 · MBR-008 — what an applicant is told on /join and in the received e-mail is public by design: the date
-- the decision is expected, how many places the cycle has, the activation period and when the membership ends.
create or replace view public.membership_cycle_phase as
select
  c.id, c.name_ar, c.name_en, c.description_ar, c.description_en, c.opens_at, c.closes_at, c.closed_early_at,
  least(c.closes_at, coalesce(c.closed_early_at, c.closes_at)) as effective_closes_at,
  c.questions, c.status,
  private.cycle_phase(c.status, c.opens_at, c.closes_at, c.closed_early_at) as phase,
  c.review_ends_at, c.capacity, c.activation_deadline_days, c.term_ends_at
from public.membership_cycles c
where c.status in ('published', 'completed');
