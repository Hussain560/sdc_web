-- Sprint 09 · ART-001 — author lookup for the article editor and the publishers of a committee (review mail).

-- Names only (no e-mail), for people who can write articles — same shape as the presenter lookup.
create or replace function public.search_article_author_candidates(p_query text)
returns table (id uuid, full_name_ar text, full_name_en text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name_ar, p.full_name_en
  from public.profiles p
  where private.has_permission_any_scope('articles.create')
    and char_length(btrim(coalesce(p_query, ''))) >= 2
    and (p.full_name_ar ilike '%' || btrim(p_query) || '%' or p.full_name_en ilike '%' || btrim(p_query) || '%')
  order by p.full_name_ar
  limit 8
$$;
revoke all on function public.search_article_author_candidates(text) from public, anon;
grant execute on function public.search_article_author_candidates(text) to authenticated;
