-- Sprint 06 · NOT-002 — one row per e-mail attempt (docs/05-database/entities/platform.md §2).
-- Written only by the server with the service role; read by e-mail-log viewers and by reviewers of the related event.

create table public.email_logs (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  template_key        text not null,
  locale              text not null check (locale in ('ar', 'en')),
  recipient_user_id   uuid references public.profiles (id) on delete set null,
  recipient_email     text not null,
  entity_type         text,
  entity_id           text,
  idempotency_key     text not null,
  attempt             smallint not null default 1 check (attempt >= 1),
  status              text not null check (status in ('sending', 'sent', 'failed', 'skipped')),
  provider            text,
  provider_message_id text,
  error_code          text,
  error_message       text
);
comment on table public.email_logs is 'Outbox/audit of e-mail attempts. "sending" is a claim taken before the provider call.';

-- The same notification cannot be sent (or be mid-send) twice: this is the claim.
create unique index email_logs_one_active_per_key on public.email_logs (idempotency_key) where status in ('sending', 'sent');
create index email_logs_entity_idx on public.email_logs (entity_type, entity_id);
create index email_logs_status_idx on public.email_logs (status, created_at);
create index email_logs_sent_day_idx on public.email_logs (created_at) where status = 'sent';

alter table public.email_logs enable row level security;
revoke all on table public.email_logs from anon, authenticated;
grant select on table public.email_logs to authenticated;

create policy email_logs_select on public.email_logs
  for select to authenticated
  using (
    private.has_permission_any_scope('email_logs.view')
    or (entity_type = 'registration'
        and private.has_permission('registrations.review', private.registration_committee(entity_id::uuid)))
  );
