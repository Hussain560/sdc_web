-- LOCAL ONLY: the extra questions of the Winter 2027 intake, as designed: why join (long text, required), which committee
-- (radio cards with a hint each), interests (chips), and whether the person can attend one event a month (required).
--   docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1 < supabase/dev-cycle-questions.sql
begin;
update public.membership_cycles set
  description_ar = 'وضعتها القيادة لدورة شتاء 2027. أجب بصدق، فلا إجابة خاطئة.',
  description_en = 'Set by leadership for the Winter 2027 intake. Answer honestly: there is no wrong answer.',
  questions = $q$[
    {"key":"why","type":"long_text","required":true,
     "label_ar":"لماذا تريد الانضمام إلى المجتمع الآن؟","label_en":"Why do you want to join the community now?"},
    {"key":"committee","type":"single_choice","required":false,
     "label_ar":"أي لجنة تهمّك أكثر؟","label_en":"Which committee interests you most?",
     "options":["الذكاء الاصطناعي","التقنية والتطوير","الأمن السيبراني"],
     "option_hints":["نماذج وبيانات","ويب وتطبيقات","CTF وتوعية"]},
    {"key":"interests","type":"multi_choice","required":false,
     "label_ar":"مجالات تهمّك (اختر ما يناسبك)","label_en":"Areas you care about (choose any)",
     "options":["تعلّم الآلة","تحليل البيانات","الويب","الجوال","التصميم","تقديم ورش","كتابة مقالات"]},
    {"key":"monthly","type":"single_choice","required":true,
     "label_ar":"هل تستطيع حضور فعالية واحدة شهرياً على الأقل؟","label_en":"Can you attend at least one event a month?",
     "options":["نعم","ليس دائماً"]}
  ]$q$::jsonb
where name_en = 'Winter 2027 intake';
commit;
