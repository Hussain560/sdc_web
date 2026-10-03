-- The community WhatsApp group link, shown in the welcome e-mail (not a public setting: only the server reads it).
insert into public.site_settings (key, value, is_public) values ('community_whatsapp_link', '""'::jsonb, false)
on conflict (key) do nothing;

create or replace function public.save_site_settings(p_values jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  k text;
  v jsonb;
  s text;
  changed text[] := '{}';
  old jsonb;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('settings.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if p_values is null or jsonb_typeof(p_values) <> 'object' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;

  for k, v in select * from jsonb_each(p_values) loop
    if k in ('social_instagram', 'social_linkedin', 'social_x') then
      if jsonb_typeof(v) <> 'string' then raise exception 'VALIDATION_FAILED:%', k using errcode = 'P0001'; end if;
      s := btrim(v #>> '{}');
      if s !~ '^https://[^[:space:]]{3,200}$' then raise exception 'VALIDATION_FAILED:%', k using errcode = 'P0001'; end if;
      v := to_jsonb(s);
    elsif k = 'contact_email' then
      if jsonb_typeof(v) <> 'string' then raise exception 'VALIDATION_FAILED:contact_email' using errcode = 'P0001'; end if;
      s := btrim(v #>> '{}');
      if s <> '' and s !~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' then
        raise exception 'VALIDATION_FAILED:contact_email' using errcode = 'P0001';
      end if;
      v := to_jsonb(s);
    elsif k = 'community_whatsapp_link' then
      -- the group invitation sent in the welcome e-mail; empty switches the line off
      if jsonb_typeof(v) <> 'string' then raise exception 'VALIDATION_FAILED:community_whatsapp_link' using errcode = 'P0001'; end if;
      s := btrim(v #>> '{}');
      if s <> '' and s !~* '^https://(chat\.whatsapp\.com|wa\.me|whatsapp\.com)/[^[:space:]]{2,200}$' then
        raise exception 'VALIDATION_FAILED:community_whatsapp_link' using errcode = 'P0001';
      end if;
      v := to_jsonb(s);
    elsif k in ('footer_rights_ar', 'footer_rights_en') then
      if jsonb_typeof(v) <> 'string' or char_length(v #>> '{}') > 200 then
        raise exception 'VALIDATION_FAILED:%', k using errcode = 'P0001';
      end if;
      v := to_jsonb(btrim(v #>> '{}'));
    elsif k = 'certificates_enabled' then
      if jsonb_typeof(v) <> 'boolean' then raise exception 'VALIDATION_FAILED:certificates_enabled' using errcode = 'P0001'; end if;
    elsif k = 'certificate_threshold' then
      if jsonb_typeof(v) <> 'number' or (v #>> '{}')::numeric <> floor((v #>> '{}')::numeric)
         or (v #>> '{}')::numeric not between 0 and 100 then
        raise exception 'VALIDATION_FAILED:certificate_threshold' using errcode = 'P0001';
      end if;
    else
      raise exception 'VALIDATION_FAILED:%', k using errcode = 'P0001';
    end if;

    select value into old from public.site_settings where key = k;
    if old is distinct from v then
      insert into public.site_settings (key, value, is_public, updated_by, updated_at)
      values (k, v, k not in ('certificates_enabled', 'certificate_threshold', 'community_whatsapp_link'), (select auth.uid()), now())
      on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now();
      changed := changed || k;
    end if;
  end loop;

  if cardinality(changed) > 0 then
    perform private.write_audit('settings.update', 'site_settings', 'site', null,
      jsonb_build_object('keys', to_jsonb(changed)));
  end if;
end;
$$;
revoke all on function public.save_site_settings(jsonb) from public, anon;
grant execute on function public.save_site_settings(jsonb) to authenticated;
