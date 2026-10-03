# Articles / Threads — List, Editor & Review

`/dashboard/articles`, `/dashboard/articles/new`, `/dashboard/articles/[id]` — committee-authored bilingual content with a review step before publishing (*Q-006*, label per *Q-033*).

---

## 1. Blueprints

### 1.1 List

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ لوحة التحكم › المقالات                                         [ + مقال جديد ] │
│ [ الكل 9 ] [ مسودات 2 ] [ قيد المراجعة 1 ] [ منشورة 6 ] [ مؤرشفة 0 ]           │
│ [ 🔍 العنوان ] [ اللجنة ▾ ] [ الوسم ▾ ]                                         │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ العنوان                         الكتّاب            اللجنة    الحالة   التاريخ ⋮│ │
│ │──────────────────────────────────────────────────────────────────────────│ │
│ │ أنظمة التوصية                   لجنة الذكاء        الذكاء   (منشور) ١٢ سبت ⋮ │ │
│ │ Recommendation Systems          4 د قراءة · 3 وسوم                           │ │
│ │ هندسة البيانات للمبتدئين         سارة العتيبي       الذكاء   (قيد المراجعة) ⋮ │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Editor

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ … › المقالات › هندسة البيانات للمبتدئين    (مسودة)   [ حفظ ] [ إرسال للمراجعة ]        │
├──────────────────────────────────────────────────────────────┬─────────────────────┤
│ [ العربية ] [ English ]                                       │ ── النشر ──          │
│ العنوان * [ هندسة البيانات للمبتدئين                         ] │ اللجنة [ الذكاء ▾ ]   │
│ المقتطف  [                                               ]   │ الكتّاب               │
│ ┌──────────── كتابة ────────────┬──────────── معاينة ───────┐ │  (س) سارة العتيبي ✕   │
│ │ ## ما هي هندسة البيانات؟      │ ما هي هندسة البيانات؟        │ │  [+ كاتب/لجنة/ضيف]   │
│ │ هندسة البيانات هي …           │ هندسة البيانات هي …          │ │ الوسوم [بيانات ✕][+]  │
│ │ - النقطة الأولى               │ • النقطة الأولى              │ │ الغلاف [ رفع صورة ]   │
│ └───────────────────────────────┴──────────────────────────┘ │ مصدر/ملحق [https://] │
│ B  I  H2  •  1.  🔗  `code`  ❝                 812 كلمة · ~4 د │ وقت القراءة ~4 د     │
└──────────────────────────────────────────────────────────────┴─────────────────────┘
```

### 1.3 Review (approver opening an `in_review` article)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ هندسة البيانات للمبتدئين   (قيد المراجعة)        [ طلب تعديلات ] [ نشر ]        │
│ أرسلته سارة العتيبي · منذ يوم                                                  │
│ [ معاينة عامة ▾ العربية | English ]                                            │
│ (rendered article exactly as public page)                                     │
│ ── قائمة التحقق ──  ✓ عنوان عربي  ✓ مقتطف  ⚠ لا توجد نسخة إنجليزية  ✓ وسوم      │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layout rules

- **List** — status tabs, filters, table with two-line title, authors (users / committee byline / guest), committee, status, date (`published_at` or `updated_at`), kebab per allowed actions ([00 §7](./00-data-model-reference.md#7-article)).
- **Editor** — language tabs (Arabic first); Markdown split view on ≥ 1280px (tabs Write/Preview below); toolbar inserts Markdown only (no raw HTML); word count and computed reading time; publish sidebar (committee, authors repeater, tags multi-select, cover, resource link). Body preview uses the public sanitized renderer.
- **Actions** — authors: *Save*, *Submit for review*; approvers (`articles.publish` in scope): *Publish* directly or *Request changes*; published: *Edit* (audited), kebab *Archive*. Slug edits after publish create a redirect (notice shown).
- **Review view** — rendered preview with language switch + content checklist; *Request changes* dialog (note ≥ 10 chars) mirrors the event dialog.
- **Changes requested** — warning banner on the editor with reviewer note.

## 3. States

- **Loading** — list skeleton; editor skeleton (title line, toolbar, 2 blocks, sidebar form).
- **Unsaved changes** — dirty indicator + navigation guard.
- **Sanitization notice** — if pasted content contained HTML, inline info "تمت إزالة تنسيقات غير مدعومة".
- **Published** — toast + *View public page ↗*.

## 4. Data & permissions

- Actions: `createArticleDraft`, `updateArticle`, `transition_article(id, action, note)`, `uploadArticleCover`.
- Permissions: `articles.create`, `articles.edit`, `articles.publish` (scoped); authors edit own drafts by ownership.
- Requirements: FR-ART-001…003.
