'use client';

import { CalendarDays, Check, Mail, Plus, Share2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  Accordion,
  Alert,
  Avatar,
  AvatarGroup,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardLink,
  Checkbox,
  CountdownChip,
  DateChip,
  Dialog,
  EmptyState,
  ErrorSummary,
  Field,
  FilterChip,
  IconButton,
  LinkButton,
  Media,
  PanelTabs,
  PasswordField,
  Progress,
  RadioGroup,
  RemovableChip,
  ResultDialog,
  SegmentedToggle,
  Select,
  Skeleton,
  SkeletonEventCard,
  SkeletonGroup,
  SkeletonLines,
  SkeletonMemberCard,
  StatCard,
  StatusPill,
  Stepper,
  Switch,
  TagChip,
  Textarea,
  TextLink,
  useToast,
  type EventStatus,
} from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { LocaleSwitch } from '@/components/layout/LocaleSwitch';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { ThemeSwitch } from '@/components/layout/ThemeSwitch';

// Strings are deliberately a little long in English and plain in Arabic: the +30% fixture of the plan.
const T = {
  ar: {
    title: 'معرض المكوّنات',
    note: 'صفحة للمطورين فقط: كل مكوّن بحالاته. لا تظهر في الإنتاج.',
    primary: 'سجّل الآن',
    secondary: 'عرض كل الفعاليات',
    ghost: 'إلغاء',
    destructive: 'إلغاء التسجيل',
    link: 'اعرف المزيد',
    loading: 'جارٍ الإرسال…',
    name: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    emailHint: 'سنرسل التأكيد إلى هذا البريد.',
    emailError: 'أدخل بريداً إلكترونياً صحيحاً.',
    ok: 'متاح',
    required: 'مطلوب',
    pass: 'كلمة المرور',
    show: 'إظهار كلمة المرور',
    hide: 'إخفاء كلمة المرور',
    bio: 'نبذة',
    track: 'المسار',
    agree: 'أوافق على سياسة الخصوصية',
    audience: 'الفئة المستهدفة',
    members: 'الأعضاء',
    everyone: 'الجميع',
    theme: 'الوضع الفاتح',
    upcoming: 'القادمة',
    past: 'السابقة',
    when: 'الفعاليات',
    open: 'التسجيل مفتوح',
    soon: 'يُغلق قريباً',
    waitlist: 'مكتمل · قائمة انتظار',
    registered: 'مسجّل',
    running: 'جارية الآن',
    finished: 'انتهت',
    cancelled: 'أُلغيت',
    opensSoon: 'يفتح التسجيل قريباً',
    tag: 'الذكاء الاصطناعي',
    eventTitle: 'ورشة بناء تطبيقات الويب الحديثة مع المجتمع',
    place: 'الرياض · حضوري',
    seats: 'متبقي 12 مقعداً',
    details: 'التفاصيل',
    member: 'سارة العتيبي',
    track2: 'تطوير الواجهات',
    empty: 'لا توجد فعاليات قادمة الآن',
    emptyBody: 'تابعنا لتعرف بموعد الفعالية القادمة.',
    emptyAction: 'تصفّح الفعاليات السابقة',
    alertInfo: 'سيُغلق التسجيل بعد يومين.',
    alertTitle: 'تنبيه',
    tabAbout: 'عن الفعالية',
    tabAgenda: 'الجدول',
    tabFaq: 'الأسئلة',
    q1: 'هل الفعالية مجانية؟',
    a1: 'نعم، الحضور مجاني ويتطلب التسجيل المسبق.',
    q2: 'هل أحتاج إلى جهاز محمول؟',
    a2: 'نعم، يُفضَّل إحضار جهازك الشخصي.',
    crumbEvents: 'الفعاليات',
    crumbEvent: 'ورشة الويب',
    crumbCheck: 'تسجيل الحضور',
    step1: 'البيانات',
    step2: 'الاهتمامات',
    step3: 'المراجعة',
    stepOf: (n: number, t: number, l: string) => `الخطوة ${n} من ${t}: ${l}`,
    toast: 'تم نسخ الرابط',
    undo: 'تراجع',
    openDialog: 'فتح نافذة',
    openSheet: 'فتح ورقة سفلية',
    openResult: 'فتح نتيجة',
    dialogTitle: 'تأكيد التسجيل',
    dialogDesc: 'سنسجّلك بالبيانات التالية.',
    close: 'إغلاق',
    confirm: 'تأكيد',
    busyHint: 'سيُغلق بعد اكتمال الإرسال',
    resultTitle: 'تم تسجيلك بنجاح',
    resultBody: 'أرسلنا تفاصيل الفعالية إلى بريدك.',
    addCal: 'أضف إلى التقويم',
    registering: 'جارٍ تسجيلك…',
    stat: 'عضواً',
    summary: 'راجع الحقول التالية',
    removeFilter: 'إزالة الفلتر: الذكاء الاصطناعي',
    loadingText: 'جارٍ التحميل…',
    more: 'أشخاص آخرين',
    cover: 'غلاف الفعالية',
    sections: 'أقسام الفعالية',
    fixture: 'نص طويل لاختبار الزيادة بنسبة ثلاثين بالمئة دون قص أو تجاوز للحدود',
  },
  en: {
    title: 'Component gallery',
    note: 'Developer-only page: every component with its states. Not shown in production.',
    primary: 'Register now',
    secondary: 'View all events',
    ghost: 'Cancel',
    destructive: 'Cancel registration',
    link: 'Learn more',
    loading: 'Sending…',
    name: 'Full name',
    email: 'E-mail',
    emailHint: 'We will send the confirmation to this address.',
    emailError: 'Enter a valid e-mail address.',
    ok: 'Available',
    required: 'required',
    pass: 'Password',
    show: 'Show password',
    hide: 'Hide password',
    bio: 'About you',
    track: 'Track',
    agree: 'I agree to the privacy notice',
    audience: 'Audience',
    members: 'Members',
    everyone: 'Everyone',
    theme: 'Light mode',
    upcoming: 'Upcoming',
    past: 'Past',
    when: 'Events',
    open: 'Registration open',
    soon: 'Closes soon',
    waitlist: 'Full · waiting list',
    registered: 'Registered',
    running: 'Happening now',
    finished: 'Finished',
    cancelled: 'Cancelled',
    opensSoon: 'Registration opens soon',
    tag: 'Artificial intelligence',
    eventTitle: 'Building modern web applications workshop with the community',
    place: 'Riyadh · In person',
    seats: '12 seats left',
    details: 'Details',
    member: 'Sara Al Otaibi',
    track2: 'Front-end development',
    empty: 'No upcoming events right now',
    emptyBody: 'Follow us to hear when the next event is announced.',
    emptyAction: 'Browse past events',
    alertInfo: 'Registration closes in two days.',
    alertTitle: 'Heads up',
    tabAbout: 'About the event',
    tabAgenda: 'Agenda',
    tabFaq: 'Questions',
    q1: 'Is the event free?',
    a1: 'Yes. Attendance is free and needs registration in advance.',
    q2: 'Do I need a laptop?',
    a2: 'Yes, please bring your own device.',
    crumbEvents: 'Events',
    crumbEvent: 'Web workshop',
    crumbCheck: 'Check-in',
    step1: 'Details',
    step2: 'Interests',
    step3: 'Review',
    stepOf: (n: number, t: number, l: string) => `Step ${n} of ${t}: ${l}`,
    toast: 'Link copied',
    undo: 'Undo',
    openDialog: 'Open dialog',
    openSheet: 'Open bottom sheet',
    openResult: 'Open result',
    dialogTitle: 'Confirm registration',
    dialogDesc: 'We will register you with these details.',
    close: 'Close',
    confirm: 'Confirm',
    busyHint: 'This closes once sending finishes',
    resultTitle: 'You are registered',
    resultBody: 'We sent the event details to your inbox.',
    addCal: 'Add to calendar',
    registering: 'Registering you…',
    stat: 'members',
    summary: 'Check the following fields',
    removeFilter: 'Remove filter: Artificial intelligence',
    loadingText: 'Loading…',
    more: 'more people',
    cover: 'Event cover',
    sections: 'Event sections',
    fixture: 'A long sentence to check a thirty percent increase without clipping or overflow',
  },
} as const;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} data-gallery-section={id} className="border-t border-line py-8">
      <h2 className="t-h3 mb-5">{title}</h2>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

const Row = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-3">{children}</div>
);

const STATUSES: EventStatus[] = [
  'registration-open',
  'closes-soon',
  'full-waitlist',
  'registered',
  'running-now',
  'finished',
  'cancelled',
  'opens-soon',
];

/** Every v2 component with its states. Route: /design-gallery (development, or DESIGN_GALLERY=1). */
export function Gallery() {
  const { lang } = useLanguage();
  const s = T[lang];
  const toast = useToast();
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
  const [aud, setAud] = useState<'members' | 'everyone' | ''>('members');
  const [sw, setSw] = useState(true);
  const [agree, setAgree] = useState(false);
  const [dialog, setDialog] = useState<'none' | 'plain' | 'busy' | 'sheet' | 'result'>('none');
  const [step, setStep] = useState(2);
  const [chip, setChip] = useState(true);
  const statusLabel: Record<EventStatus, string> = {
    'registration-open': s.open,
    'closes-soon': s.soon,
    'full-waitlist': s.waitlist,
    registered: s.registered,
    'running-now': s.running,
    finished: s.finished,
    cancelled: s.cancelled,
    'opens-soon': s.opensSoon,
  };

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-(--container) px-4 py-10 md:px-8">
        <h1 className="t-h1">{s.title}</h1>
        <p className="t-lede mt-2 text-muted">{s.note}</p>
        <p className="t-body-sm mt-4 rounded-shape-md bg-surface-raised p-3">{s.fixture}</p>

        <Section id="type" title="Type">
          <p className="t-display">{s.title}</p>
          <p className="t-h1">{s.title}</p>
          <p className="t-h2">{s.title}</p>
          <p className="t-h3">{s.title}</p>
          <p className="t-h4">{s.title}</p>
          <p className="t-stat text-signal">1,240</p>
          <p className="t-lede">{s.note}</p>
          <p className="t-body">{s.note}</p>
          <p className="t-body-sm">{s.note}</p>
          <p className="t-label">{s.name}</p>
          <p className="t-caption">{s.seats}</p>
          <p className="t-badge">{s.registered}</p>
        </Section>

        <Section id="actions" title="Actions">
          <Row>
            <Button>{s.primary}</Button>
            <Button variant="secondary">{s.secondary}</Button>
            <Button variant="brand">{s.primary}</Button>
            <Button variant="ghost">{s.ghost}</Button>
            <Button variant="destructive">{s.destructive}</Button>
            <Button variant="link">{s.link}</Button>
          </Row>
          <Row>
            <Button size="sm">{s.primary}</Button>
            <Button size="md">{s.primary}</Button>
            <Button size="lg">{s.primary}</Button>
            <Button loading>{s.loading}</Button>
            <Button disabled>{s.primary}</Button>
            <Button iconStart={<Plus className="size-5" />}>{s.primary}</Button>
            <LinkButton href="/events" variant="secondary">
              {s.secondary}
            </LinkButton>
          </Row>
          <Row>
            <IconButton label={s.close} onClick={() => {}} variant="ghost">
              <Share2 className="size-5" />
            </IconButton>
            <IconButton label={s.close} onClick={() => {}} variant="secondary">
              <Share2 className="size-5" />
            </IconButton>
            <IconButton label={s.close} onClick={() => {}} variant="primary">
              <Share2 className="size-5" />
            </IconButton>
            <TextLink href="/events">{s.link}</TextLink>
            <TextLink href="/events" variant="standalone">
              {s.link}
            </TextLink>
            <TextLink href="https://example.com" external externalLabel="(new tab)">
              example.com
            </TextLink>
          </Row>
          <SegmentedToggle
            label={s.when}
            value={view}
            onChange={setView}
            options={[
              { value: 'upcoming', label: s.upcoming },
              { value: 'past', label: s.past },
            ]}
          />
          <Row>
            <LocaleSwitch />
            <ThemeSwitch />
          </Row>
        </Section>

        <Section id="labels" title="Labels">
          <Row>
            <Badge>{s.registered}</Badge>
            <Badge tone="accent">{s.registered}</Badge>
            <Badge tone="success">{s.open}</Badge>
            <Badge tone="warning">{s.soon}</Badge>
            <Badge tone="danger">{s.cancelled}</Badge>
            <Badge tone="info" icon={<Check />}>
              {s.running}
            </Badge>
          </Row>
          <Row>
            {STATUSES.map((st) => (
              <StatusPill key={st} status={st} label={statusLabel[st]} />
            ))}
          </Row>
          <Row>
            <TagChip>{s.tag}</TagChip>
            <TagChip title="AI, Web">+2</TagChip>
            <FilterChip pressed={chip} onClick={() => setChip((v) => !v)}>
              {s.tag}
            </FilterChip>
            <FilterChip pressed={false} onClick={() => {}}>
              {s.track}
            </FilterChip>
            <RemovableChip removeLabel={s.removeFilter} onRemove={() => {}}>
              {s.tag}
            </RemovableChip>
          </Row>
          <Row>
            <DateChip date="2026-10-14" lang={lang} variant="block" />
            <DateChip date="2026-10-14" lang={lang} start="18:00:00" end="20:00:00" />
            <CountdownChip date="2026-10-14" lang={lang} now={Date.parse('2026-10-11T00:00:00Z')} />
          </Row>
        </Section>

        <Section id="forms" title="Forms">
          <ErrorSummary
            title={s.summary}
            errors={[{ fieldId: 'g-email', message: s.emailError }]}
          />
          <div className="grid gap-6 md:grid-cols-2">
            <Field label={s.name} requiredLabel={s.required} autoComplete="name" />
            <Field
              id="g-email"
              label={s.email}
              type="email"
              hint={s.emailHint}
              error={s.emailError}
            />
            <Field label={s.name} success={s.ok} defaultValue="sdc_saudi" />
            <Field label={s.name} disabled defaultValue="—" />
            <PasswordField label={s.pass} showLabel={s.show} hideLabel={s.hide} />
            <Select label={s.track} hint={s.emailHint}>
              <option>{s.track2}</option>
              <option>{s.tag}</option>
            </Select>
            <Textarea label={s.bio} counter maxLength={500} value={s.fixture} readOnly />
            <div className="flex flex-col gap-1">
              <Checkbox
                label={s.agree}
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <Checkbox label={s.agree} indeterminate readOnly />
              <Checkbox label={s.agree} error={s.emailError} />
              <Checkbox label={s.agree} disabled />
            </div>
            <RadioGroup
              legend={s.audience}
              value={aud}
              onChange={setAud}
              options={[
                { value: 'members', label: s.members },
                { value: 'everyone', label: s.everyone, hint: s.emailHint },
              ]}
            />
            <Switch checked={sw} onChange={setSw} label={s.theme} hint={s.emailHint} />
          </div>
        </Section>

        <Section id="containers" title="Containers">
          <div className="grid gap-4 md:grid-cols-3">
            <Card variant="surface" interactive>
              <Media alt={s.cover} kind="event" className="mb-4 rounded-shape-lg" />
              <div className="mb-3 flex items-center gap-2">
                <StatusPill status="registration-open" label={s.open} />
                <DateChip date="2026-10-14" lang={lang} variant="block" />
              </div>
              <h3 className="t-h4">
                <CardLink href="/events">{s.eventTitle}</CardLink>
              </h3>
              <p className="t-body-sm mt-2 text-muted">{s.place}</p>
            </Card>
            <Card variant="feature">
              <CalendarDays aria-hidden="true" className="mb-3 size-6 text-accent-text" />
              <h3 className="t-h4">{s.when}</h3>
              <p className="t-body-sm text-muted">{s.emptyBody}</p>
            </Card>
            <Card variant="feature-alt">
              <Mail aria-hidden="true" className="mb-3 size-6 text-accent-text" />
              <h3 className="t-h4">{s.email}</h3>
              <p className="t-body-sm text-muted">{s.emailHint}</p>
            </Card>
            <Card variant="cta">
              <h3 className="t-h3 mb-4">{s.primary}</h3>
              <Button>{s.primary}</Button>
            </Card>
            <Card variant="stat">
              <p className="t-stat text-signal">1,240</p>
              <p className="t-body-sm text-muted">{s.stat}</p>
            </Card>
            <StatCard label={s.stat} value="320" />
          </div>
          <Row>
            <Avatar name={s.member} size={24} />
            <Avatar name={s.member} size={40} />
            <Avatar name={s.member} size={72} />
            <Avatar name="" size={56} />
            <AvatarGroup
              people={Array.from({ length: 7 }, (_, i) => ({ name: `Person ${i}` }))}
              moreLabel={`3 ${s.more}`}
            />
          </Row>
          <Row>
            <div className="w-48">
              <Media alt="" kind="article" />
            </div>
            <div className="w-32">
              <Media alt="" kind="person" ratio="1/1" />
            </div>
            <div className="w-32">
              <Media alt="" ratio="3/4" />
            </div>
          </Row>
          <EmptyState
            variant="no-data"
            title={s.empty}
            description={s.emptyBody}
            action={<Button variant="secondary">{s.emptyAction}</Button>}
          />
          <SkeletonGroup label={s.loadingText} className="grid gap-4 md:grid-cols-3">
            <SkeletonEventCard />
            <SkeletonMemberCard />
            <div>
              <SkeletonLines />
              <Skeleton className="mt-4 h-10 w-32 rounded-full" />
            </div>
          </SkeletonGroup>
        </Section>

        <Section id="feedback" title="Feedback">
          <Alert tone="info" title={s.alertTitle}>
            {s.alertInfo}
          </Alert>
          <Alert tone="success">{s.resultBody}</Alert>
          <Alert tone="warning">{s.alertInfo}</Alert>
          <Alert tone="danger" title={s.alertTitle}>
            {s.emailError}
          </Alert>
          <Progress label={s.registering} />
          <Progress label={s.registering} value={60} />
          <Row>
            <Button
              variant="secondary"
              onClick={() => toast.success(s.toast, { label: s.undo, onClick: () => {} })}
            >
              {s.toast}
            </Button>
            <Button variant="secondary" onClick={() => toast.error(s.emailError)}>
              {s.emailError}
            </Button>
          </Row>
          <Row>
            <Button variant="secondary" onClick={() => setDialog('plain')}>
              {s.openDialog}
            </Button>
            <Button variant="secondary" onClick={() => setDialog('busy')}>
              {s.registering}
            </Button>
            <Button variant="secondary" onClick={() => setDialog('sheet')}>
              {s.openSheet}
            </Button>
            <Button variant="secondary" onClick={() => setDialog('result')}>
              {s.openResult}
            </Button>
          </Row>
          <Dialog
            open={dialog === 'plain'}
            onClose={() => setDialog('none')}
            title={s.dialogTitle}
            description={s.dialogDesc}
            closeLabel={s.close}
            footer={
              <>
                <Button variant="ghost" onClick={() => setDialog('none')}>
                  {s.ghost}
                </Button>
                <Button onClick={() => setDialog('result')}>{s.confirm}</Button>
              </>
            }
          >
            <Field label={s.email} type="email" />
          </Dialog>
          <Dialog
            open={dialog === 'busy'}
            onClose={() => setDialog('none')}
            title={s.dialogTitle}
            closeLabel={s.close}
            busy
            busyHint={s.busyHint}
            footer={<Button loading>{s.registering}</Button>}
          >
            <Progress label={s.registering} />
          </Dialog>
          <Dialog
            open={dialog === 'sheet'}
            onClose={() => setDialog('none')}
            title={s.dialogTitle}
            closeLabel={s.close}
            presentation="sheet"
          >
            <Field label={s.email} type="email" />
          </Dialog>
          <ResultDialog
            open={dialog === 'result'}
            onClose={() => setDialog('none')}
            tone="success"
            title={s.resultTitle}
            description={s.resultBody}
            actions={
              <>
                <Button onClick={() => setDialog('none')}>{s.addCal}</Button>
                <Button variant="ghost" onClick={() => setDialog('none')}>
                  {s.close}
                </Button>
              </>
            }
          />
        </Section>

        <Section id="navigation" title="Navigation">
          <Breadcrumb
            label="Breadcrumb"
            items={[
              { label: s.crumbEvents, href: '/events' },
              { label: s.crumbEvent, href: '/events' },
              { label: s.crumbCheck },
            ]}
          />
          <PanelTabs
            label={s.sections}
            tabs={[
              { key: 'about', label: s.tabAbout, content: <p className="t-body">{s.note}</p> },
              { key: 'agenda', label: s.tabAgenda, content: <p className="t-body">{s.fixture}</p> },
              { key: 'faq', label: s.tabFaq, content: <p className="t-body">{s.alertInfo}</p> },
            ]}
          />
          <Accordion
            items={[
              { id: 'a', question: s.q1, answer: s.a1 },
              { id: 'b', question: s.q2, answer: s.a2 },
            ]}
            defaultOpen={['a']}
          />
          <Stepper
            steps={[{ label: s.step1 }, { label: s.step2 }, { label: s.step3 }]}
            current={step}
            maxReached={3}
            onSelect={setStep}
            labelOf={s.stepOf}
            navLabel={s.sections}
          />
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
