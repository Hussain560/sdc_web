-- Sprint 09 · ART-001, ART-002, ART-003 — articles: lifecycle by role, visibility, byline and tags, computed
-- reading time, published_at / slug locks, deletion rules and the migrated legacy threads.
begin;
select no_plan();

delete from public.role_assignments; -- isolate from dev personas / E2E leftovers (rolled back)

create temp table _c as select (select id from public.committees where slug = 'ai') as a,
                               (select id from public.committees where slug = 'cybersecurity') as b;
create temp table _a (k text primary key, id uuid, updated_at timestamptz);
grant select on _c to authenticated, anon;
grant select, insert, update on _a to authenticated, anon;

insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000d001', 'authenticated', 'authenticated', 'leader9@example.test',  '{"full_name":"Leader Person Nine"}'),
  ('00000000-0000-0000-0000-00000000d002', 'authenticated', 'authenticated', 'heada9@example.test',   '{"full_name":"Head A Person Nine"}'),
  ('00000000-0000-0000-0000-00000000d003', 'authenticated', 'authenticated', 'headb9@example.test',   '{"full_name":"Head B Person Nine"}'),
  ('00000000-0000-0000-0000-00000000d004', 'authenticated', 'authenticated', 'membera9@example.test', '{"full_name":"Member A Person Nine"}'),
  ('00000000-0000-0000-0000-00000000d005', 'authenticated', 'authenticated', 'memberb9@example.test', '{"full_name":"Member B Person Nine"}'),
  ('00000000-0000-0000-0000-00000000d006', 'authenticated', 'authenticated', 'plain9@example.test',   '{"full_name":"Plain User Nine"}'),
  ('00000000-0000-0000-0000-00000000d007', 'authenticated', 'authenticated', 'founder9@example.test', '{"full_name":"Founder Person Nine"}');

insert into public.role_assignments (user_id, role_key) values
  ('00000000-0000-0000-0000-00000000d001', 'community_leader'),
  ('00000000-0000-0000-0000-00000000d007', 'founder');
insert into public.role_assignments (user_id, role_key, committee_id)
select '00000000-0000-0000-0000-00000000d002'::uuid, 'committee_head', a from _c
union all select '00000000-0000-0000-0000-00000000d003'::uuid, 'committee_head', b from _c
union all select '00000000-0000-0000-0000-00000000d004'::uuid, 'committee_member', a from _c
union all select '00000000-0000-0000-0000-00000000d005'::uuid, 'committee_member', b from _c;

-- =============================================================================== migrated legacy threads (anon)
set local role anon;
select is((select count(*)::int from public.public_articles where legacy_id is not null), 6, 'the six legacy articles are public');
select is((select count(*)::int from public.articles where status = 'published'), 6, 'anon reads published articles from the table too');
select is((select count(*)::int from public.articles where status <> 'published'), 0, 'anon sees no unpublished article');
select is((select slug from public.public_articles where legacy_id = 1), 'prompt-engineering', 'legacy id 1 resolves to a readable slug');
select is((select jsonb_array_length(authors) from public.public_articles where legacy_id = 2), 3, 'the Voice2Face thread keeps its three guest authors');
select is((select authors -> 0 ->> 'name_en' from public.public_articles where legacy_id = 3), 'AI Committee', 'the committee byline keeps its legacy English wording');
select is((select tags -> 1 ->> 'slug' from public.public_articles where legacy_id = 1), 'prompt-engineering', 'tags keep their original order');
select ok((select min(reading_minutes) from public.public_articles) >= 1, 'reading time is computed and never below one minute');
select throws_ok($$select public.save_article(null, '{"title_ar":"عنوان تجريبي"}'::jsonb)$$, '42501', null, 'anon cannot even call the writer');
select throws_ok($$update public.articles set title_ar = 'x'$$, '42501', null, 'direct writes are not granted to anon');

-- =============================================================================== member: drafts in own committee
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d004","role":"authenticated"}', true);
insert into _a select 'main', (r ->> 'id')::uuid, (r ->> 'updated_at')::timestamptz
  from (select public.save_article(null, jsonb_build_object(
    'committee_id', (select a from _c), 'title_ar', 'سلسلة تجريبية', 'title_en', 'Test Thread',
    'excerpt_ar', 'مقتطف', 'body_ar', 'نص المقال الأول',
    'tags', jsonb_build_array(jsonb_build_object('slug', 'data', 'label_ar', 'بيانات', 'label_en', 'Data'),
                              jsonb_build_object('slug', 'ai', 'label_ar', 'ذكاء اصطناعي', 'label_en', 'AI')))) as r) s;
select ok((select id from _a where k = 'main') is not null, 'a committee member can create a draft in their committee');
select is((select status from public.articles where id = (select id from _a where k = 'main')), 'draft', 'new articles are drafts');
select is((select slug from public.articles where id = (select id from _a where k = 'main')), 'test-thread', 'the slug is generated from the English title');
select is((select count(*)::int from public.article_authors where article_id = (select id from _a where k = 'main') and user_id = '00000000-0000-0000-0000-00000000d004'), 1, 'the creator is the default byline');
select is((select count(*)::int from public.article_tags where article_id = (select id from _a where k = 'main')), 2, 'tags are attached (new ones are created)');
select is((select label_ar from public.tags where slug = 'ai'), 'ذكاء اصطناعي', 'an existing tag keeps its label (conflict does nothing)');
select throws_ok($$select public.save_article(null, jsonb_build_object('committee_id', (select b from _c), 'title_ar', 'مقال آخر'))$$,
  'P0001', 'FORBIDDEN', 'a member cannot create in another committee');
select throws_ok($$select public.save_article(null, '{"title_ar":"بدون لجنة"}'::jsonb)$$, 'P0001', 'SCOPE_REQUIRED', 'a committee member must pick a committee');
select throws_ok($$select public.save_article(null, jsonb_build_object('committee_id', (select a from _c), 'title_ar', 'مقال', 'resource_url', 'http://insecure.example'))$$,
  'P0001', 'VALIDATION_FAILED:resource_url', 'only https resource links are accepted');
select throws_ok($$select public.save_article(null, jsonb_build_object('committee_id', (select a from _c), 'title_ar', 'ab'))$$,
  'P0001', 'VALIDATION_FAILED:title_ar', 'the Arabic title needs at least three characters');
select throws_ok($$select public.transition_article((select id from _a where k = 'main'), 'publish')$$, 'P0001', 'FORBIDDEN', 'a member cannot publish');
select throws_ok($$update public.articles set status = 'published' where id = (select id from _a where k = 'main')$$, '42501', null, 'status cannot be written directly');

-- reading time: 450 words → 3 minutes; an empty body → 1
select public.save_article((select id from _a where k = 'main'), jsonb_build_object('body_ar', (select string_agg('كلمة', ' ') from generate_series(1, 450))));
select is((select reading_minutes::int from public.articles where id = (select id from _a where k = 'main')), 3, 'reading time = words / 200 rounded up');

-- submit needs a title, a body and a byline
insert into _a select 'empty', (r ->> 'id')::uuid, (r ->> 'updated_at')::timestamptz
  from (select public.save_article(null, jsonb_build_object('committee_id', (select a from _c), 'title_ar', 'مسودة فارغة')) as r) s;
select throws_ok($$select public.transition_article((select id from _a where k = 'empty'), 'submit')$$, 'P0001', 'INCOMPLETE:body_ar', 'an empty body blocks submission');
select is((select reading_minutes::int from public.articles where id = (select id from _a where k = 'empty')), 1, 'an empty body still reads as one minute');

select is(public.transition_article((select id from _a where k = 'main'), 'submit'), 'in_review', 'the author submits for review');
select throws_ok($$select public.save_article((select id from _a where k = 'main'), '{"title_ar":"عنوان جديد"}'::jsonb)$$, 'P0001', 'NOT_EDITABLE', 'an article in review is not editable');
select is(public.transition_article((select id from _a where k = 'main'), 'withdraw'), 'draft', 'the author withdraws it');
select is(public.transition_article((select id from _a where k = 'main'), 'submit'), 'in_review', 'and submits again');

-- visibility of drafts
select is((select count(*)::int from public.dashboard_articles where id = (select id from _a where k = 'main')), 1, 'the author sees their own article in the dashboard');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d005","role":"authenticated"}', true);
select is((select count(*)::int from public.articles where id = (select id from _a where k = 'main')), 0, 'a member of another committee cannot read the draft');
select throws_ok($$select public.transition_article((select id from _a where k = 'main'), 'publish')$$, 'P0001', 'NOT_FOUND', 'and cannot even tell it exists');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d003","role":"authenticated"}', true);
select is((select count(*)::int from public.dashboard_articles where id = (select id from _a where k = 'main')), 0, 'the head of another committee does not see it either');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d006","role":"authenticated"}', true);
select is((select count(*)::int from public.articles where status <> 'published'), 0, 'a plain user sees no draft');
select throws_ok($$select public.save_article(null, jsonb_build_object('committee_id', (select a from _c), 'title_ar', 'مقال'))$$, 'P0001', 'FORBIDDEN', 'a plain user cannot write');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d007","role":"authenticated"}', true);
select throws_ok($$select public.transition_article((select id from _a where k = 'main'), 'publish')$$, 'P0001', 'NOT_FOUND', 'a founder has read-only oversight of reports, not of drafts');

-- =============================================================================== head: review and publish
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d002","role":"authenticated"}', true);
select is((select count(*)::int from public.dashboard_articles where id = (select id from _a where k = 'main')), 1, 'the head of the committee sees the submitted article');
select throws_ok($$select public.transition_article((select id from _a where k = 'main'), 'request_changes', 'قصير')$$, 'P0001', 'NOTE_TOO_SHORT', 'a change request needs a note of at least ten characters');
select is(public.transition_article((select id from _a where k = 'main'), 'request_changes', 'يرجى إضافة أمثلة ومصادر للمقال'), 'changes_requested', 'the head requests changes');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d004","role":"authenticated"}', true);
select ok((select review_note from public.dashboard_articles where id = (select id from _a where k = 'main')) like 'يرجى%', 'the author reads the reviewer note');
select lives_ok($$select public.save_article((select id from _a where k = 'main'), '{"excerpt_ar":"مقتطف محسّن"}'::jsonb)$$, 'the author revises a changes-requested article');
select is(public.transition_article((select id from _a where k = 'main'), 'submit'), 'in_review', 'and resubmits');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d002","role":"authenticated"}', true);
select is(public.transition_article((select id from _a where k = 'main'), 'publish'), 'published', 'the head publishes');
select ok((select published_at from public.articles where id = (select id from _a where k = 'main')) is not null, 'published_at is set on publish');
create temp table _p as select published_at as at from public.articles where id = (select id from _a where k = 'main');
grant select on _p to authenticated, anon;
select throws_ok($$select public.transition_article((select id from _a where k = 'main'), 'publish')$$, 'P0001', 'INVALID_TRANSITION', 'a published article cannot be published again');

set local role anon;
select set_config('request.jwt.claims', '', true);
select is((select count(*)::int from public.public_articles where slug = 'test-thread'), 1, 'the published article is public');
select is((select jsonb_array_length(tags) from public.public_articles where slug = 'test-thread'), 2, 'the public view carries its tags');
select is((select authors -> 0 ->> 'name_ar' from public.public_articles where slug = 'test-thread'), 'Member A Person Nine', 'and the creator byline');

-- editing a published article is for publishers; published_at and slug never move
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d004","role":"authenticated"}', true);
select throws_ok($$select public.save_article((select id from _a where k = 'main'), '{"title_ar":"تعديل من الكاتب"}'::jsonb)$$, 'P0001', 'FORBIDDEN', 'the author cannot edit it once published');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d002","role":"authenticated"}', true);
select lives_ok($$select public.save_article((select id from _a where k = 'main'), '{"title_ar":"عنوان بعد التحرير"}'::jsonb)$$, 'the head edits a published article');
select is((select published_at from public.articles where id = (select id from _a where k = 'main')), (select at from _p), 'published_at is set once');
select throws_ok($$select public.save_article((select id from _a where k = 'main'), '{"slug":"another-slug"}'::jsonb)$$, 'P0001', 'SLUG_LOCKED', 'the slug is locked after the first publish');
select throws_ok($$select public.delete_article_draft((select id from _a where k = 'main'))$$, 'P0001', 'NOT_EDITABLE', 'a published article is archived, not deleted');

-- archive → 404 publicly; restore keeps published_at
select is(public.transition_article((select id from _a where k = 'main'), 'archive'), 'archived', 'the head archives it');
set local role anon;
select set_config('request.jwt.claims', '', true);
select is((select count(*)::int from public.public_articles where slug = 'test-thread'), 0, 'an archived article disappears from the public view');
select is((select count(*)::int from public.articles where slug = 'test-thread'), 0, 'and from the table for anon');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d002","role":"authenticated"}', true);
select is((select count(*)::int from public.dashboard_articles where slug = 'test-thread' and status = 'archived'), 1, 'publishers still see it');
select throws_ok($$select public.save_article((select id from _a where k = 'main'), '{"title_ar":"x yz"}'::jsonb)$$, 'P0001', 'NOT_EDITABLE', 'an archived article is not editable');
select is(public.transition_article((select id from _a where k = 'main'), 'restore'), 'published', 'the head restores it');
select is((select published_at from public.articles where id = (select id from _a where k = 'main')), (select at from _p), 'restoring keeps the original publish date');

-- byline kinds and limits
select lives_ok($$select public.save_article((select id from _a where k = 'main'), jsonb_build_object('authors', jsonb_build_array(
    jsonb_build_object('committee_id', (select a from _c)),
    jsonb_build_object('display_name_ar', 'ضيف كريم', 'display_name_en', 'Guest Author'))))$$, 'a committee byline and a guest author are accepted');
select is((select count(*)::int from public.public_articles where slug = 'test-thread' and jsonb_array_length(authors) = 2), 1, 'both bylines are public');
select throws_ok($$select public.save_article((select id from _a where k = 'main'), jsonb_build_object('authors', jsonb_build_array(jsonb_build_object('display_name_en', 'No Arabic name'))))$$,
  'P0001', 'VALIDATION_FAILED:authors', 'a byline needs a user, a committee or an Arabic display name');
select throws_ok($$select public.save_article((select id from _a where k = 'main'), jsonb_build_object('tags', (select jsonb_agg(jsonb_build_object('slug', 't' || g)) from generate_series(1, 9) g)))$$,
  'P0001', 'VALIDATION_FAILED:tags', 'at most eight tags');

-- leader publishes anything directly; deletion rules
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d004","role":"authenticated"}', true);
select lives_ok($$select public.delete_article_draft((select id from _a where k = 'empty'))$$, 'the author deletes a never-published draft');
insert into _a select 'second', (r ->> 'id')::uuid, (r ->> 'updated_at')::timestamptz
  from (select public.save_article(null, jsonb_build_object('committee_id', (select a from _c), 'title_ar', 'مقال للقائد', 'body_ar', 'نص', 'title_en', 'Leader Piece')) as r) s;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d001","role":"authenticated"}', true);
select is(public.transition_article((select id from _a where k = 'second'), 'publish'), 'published', 'the community leader can publish a draft directly in any committee');

-- =============================================================================== audit and counts
reset role;
select ok((select count(*) from public.audit_logs where action = 'article.published') >= 2, 'publishing is audited');
select ok((select count(*) from public.audit_logs where action = 'article.created') >= 3, 'creation is audited');
select ok((select count(*) from public.audit_logs where action = 'article.deleted') = 1, 'deleting a draft is audited');

select * from finish();
rollback;
