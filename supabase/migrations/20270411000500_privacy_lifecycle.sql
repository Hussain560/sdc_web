-- Sprint 18 — erasure covers the new lifecycle data: name parts, tracking token, leave requests, the history, the
-- reviewer comments and the card. Aggregate facts (counts, dates, status) stay, as before.

create or replace function private.anonymize_person(p_user uuid, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  n_reg integer; n_app integer; n_cert integer; n_mem integer;
begin
  update public.event_registrations
     set full_name_snapshot = 'Anonymized', email_snapshot = 'anonymized-' || id || '@deleted.invalid', answers = '{}'::jsonb, user_id = null
   where user_id = p_user or lower(email_snapshot) = lower(p_email);
  get diagnostics n_reg = row_count;

  -- Scores and comments are about the person: the comments go, the numbers (no identity in them) stay.
  update public.application_scores set comment = null
   where application_id in (select id from public.membership_applications where user_id = p_user or lower(email) = lower(p_email));
  update public.application_events set data = '{}'::jsonb
   where application_id in (select id from public.membership_applications where user_id = p_user or lower(email) = lower(p_email));
  update public.membership_applications
     set full_name_ar = 'Anonymized', full_name_en = null, email = 'anonymized-' || id || '@deleted.invalid', phone = null,
         first_name_ar = null, middle_name_ar = null, last_name_ar = null, first_name_en = null, middle_name_en = null, last_name_en = null,
         bio_ar = null, bio_en = null, portfolio_url = null, github_url = null, linkedin_url = null, x_url = null,
         info_request = null, info_fields = '{}', tracking_token_hash = null, decision_note = null,
         answers = '{}'::jsonb, user_id = null
   where user_id = p_user or lower(email) = lower(p_email);
  get diagnostics n_app = row_count;

  update public.certificates
     set recipient_name = 'Anonymized', recipient_email = 'anonymized-' || id || '@deleted.invalid', user_id = null
   where user_id = p_user or lower(recipient_email) = lower(p_email);
  get diagnostics n_cert = row_count;

  update public.member_leave_requests set reason = null where member_id in (select id from public.members where user_id = p_user);
  update public.member_events set data = '{}'::jsonb where member_id in (select id from public.members where user_id = p_user);
  update public.members
     set first_name_ar = '—', middle_name_ar = null, last_name_ar = '', first_name_en = null, middle_name_en = null, last_name_en = null,
         bio_ar = null, bio_en = null, phone = null, portfolio_url = null, github_url = null, linkedin_url = null, x_url = null,
         legacy_claim_email = null, is_directory_visible = false,
         status = 'ended', end_reason = coalesce(end_reason, 'left'), ended_at = coalesce(ended_at, now()),
         card_token = null, leaves_on = null, suspension_category = null, suspended_until = null, user_id = null
   where user_id = p_user;
  get diagnostics n_mem = row_count;

  update public.email_logs set recipient_email = 'anonymized@deleted.invalid', recipient_user_id = null
   where recipient_user_id = p_user or lower(recipient_email) = lower(p_email);
  delete from public.role_assignments where user_id = p_user;
  return jsonb_build_object('registrations', n_reg, 'applications', n_app, 'certificates', n_cert, 'members', n_mem);
end;
$$;
revoke all on function private.anonymize_person(uuid, text) from public, anon, authenticated;
