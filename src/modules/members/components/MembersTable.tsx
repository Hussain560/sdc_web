'use client';

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Mail,
  Pause,
  Play,
  RefreshCw,
  UserRoundX,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { Avatar, Badge, Button, cn } from '@/components/ui';
import { ActionMenu, type MenuItem } from '@/components/patterns/ActionMenu';
import { BulkBar } from '@/components/patterns/BulkBar';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';
import type { AdminMemberRow } from '../admin-queries';
import { END_REASON_LABEL, MEMBER_STATUS_LABEL, memberStatusLabel } from '../schemas';
import { memberThumbUrl } from '../photo-url';
import { CompletenessBar } from './CompletenessBar';
import {
  MemberActionDialogs,
  type ActionTarget,
  type MemberActionKind,
} from './MemberActionDialogs';
import { MemberActions } from './MemberActions';

/** What a row says about its state: the badge and the second line under it. */
export function stateOf(r: AdminMemberRow, ar: boolean, lang: 'ar' | 'en') {
  const L = (a: string, e: string) => (ar ? a : e);
  if (!r.linked)
    return {
      tone: 'warning' as const,
      text: L('لم يُربط بحساب', 'Not linked'),
      sub: null as string | null,
      subTone: 'muted' as const,
    };
  if (r.leaveRequest && r.status === 'active')
    return {
      tone: 'accent' as const,
      text: MEMBER_STATUS_LABEL.active[lang],
      sub: L('طلب مغادرة معلّق', 'Leave request pending'),
      subTone: 'info' as const,
    };
  if (r.status === 'active' && !r.activated)
    return {
      tone: 'info' as const,
      text: L('بانتظار التفعيل', 'Waiting to activate'),
      sub: null,
      subTone: 'muted' as const,
    };
  if (r.status === 'active' && r.endingSoon && r.daysLeft !== null)
    return {
      tone: 'accent' as const,
      text: MEMBER_STATUS_LABEL.active[lang],
      sub:
        r.daysLeft <= 0
          ? L('تنتهي اليوم', 'Ends today')
          : L(`تنتهي بعد ${r.daysLeft} يوماً`, `Ends in ${r.daysLeft} days`),
      subTone: 'warning' as const,
    };
  if (r.status === 'suspended')
    return {
      tone: 'warning' as const,
      text: MEMBER_STATUS_LABEL.suspended[lang],
      sub: r.suspendedUntil
        ? L(
            `حتى ${formatDate(r.suspendedUntil, lang)}`,
            `until ${formatDate(r.suspendedUntil, lang)}`,
          )
        : null,
      subTone: 'muted' as const,
    };
  if (r.status === 'ended')
    return {
      tone: 'neutral' as const,
      text:
        r.endReason && END_REASON_LABEL[r.endReason]
          ? `${MEMBER_STATUS_LABEL.ended[lang]} · ${END_REASON_LABEL[r.endReason]![lang]}`
          : MEMBER_STATUS_LABEL.ended[lang],
      sub: null,
      subTone: 'muted' as const,
    };
  const st = memberStatusLabel(r.status);
  return { tone: st.tone, text: st[lang], sub: null, subTone: 'muted' as const };
}

/**
 * The members list (MEM-018): lifecycle at a glance, selection with bulk actions, the leave requests with their
 * decision buttons, and one ⋮ menu per row. Phones get cards. Every action opens the shared dialogs.
 */
export function MembersTable({
  rows,
  tab,
  canManage,
  canContact,
  canCreate,
}: {
  rows: AdminMemberRow[];
  tab: string;
  canManage: boolean;
  canContact: boolean;
  canCreate: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const Arrow = ar ? ChevronLeft : ChevronRight;
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<MemberActionKind | null>(null);
  const [targets, setTargets] = useState<ActionTarget[]>([]);
  const leaveTab = tab === 'leave_requests';

  const nameOf = (r: AdminMemberRow) => (ar ? r.nameAr : (r.nameEn ?? r.nameAr));
  const toTarget = (r: AdminMemberRow): ActionTarget => ({
    id: r.id,
    actionId: leaveTab && r.leaveRequest ? r.leaveRequest.id : r.id,
    nameAr: r.nameAr,
    nameEn: r.nameEn,
    status: r.status,
    termEndsAt: r.termEndsAt,
    noCommittee: !r.committeeAr,
    committeeLabel: ar ? r.committeeAr : r.committeeEn,
    leave: r.leaveRequest
      ? {
          reason: r.leaveRequest.reason,
          preferredLastDay: r.leaveRequest.preferredLastDay,
          createdAt: r.leaveRequest.createdAt,
        }
      : null,
  });
  const selectable = rows.filter((r) => r.status !== 'ended' || leaveTab);
  const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(r.id));
  const chosen = rows.filter((r) => selected.has(r.id));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const start = (kind: MemberActionKind, list: AdminMemberRow[]) => {
    setTargets(list.map(toTarget));
    setAction(kind);
  };

  const openRow = (id: string) => (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a,button,input,label,select,textarea')) return;
    router.push(`/dashboard/members/${id}`);
  };
  const decideLeave = (r: AdminMemberRow, kind: 'leave_approve' | 'leave_decline') => {
    setTargets([{ ...toTarget(r), actionId: r.leaveRequest!.id }]);
    setAction(kind);
  };
  const dayOf = (iso: string) => formatDate(iso, lang);
  // The people whose term ends within 30 days, for the one-tap "renew them all" bar of the ending-soon tab.
  const ending = rows.filter((r) => r.status === 'active' && r.endingSoon);

  const menuFor = (r: AdminMemberRow): MenuItem[] => {
    const items: MenuItem[] = [
      { key: 'open', label: L('فتح السجل', 'Open the record'), href: `/dashboard/members/${r.id}` },
    ];
    if (!canManage) return items;
    if (r.leaveRequest) {
      items.push({
        key: 'la',
        label: L('الموافقة على المغادرة', 'Approve leaving'),
        onSelect: () => {
          setTargets([{ ...toTarget(r), actionId: r.leaveRequest!.id }]);
          setAction('leave_approve');
        },
      });
      items.push({
        key: 'ld',
        label: L('رفض طلب المغادرة', 'Decline leaving'),
        onSelect: () => {
          setTargets([{ ...toTarget(r), actionId: r.leaveRequest!.id }]);
          setAction('leave_decline');
        },
      });
    }
    if (r.status === 'active' || r.status === 'expired')
      items.push({
        key: 'renew',
        label: L('تجديد', 'Renew'),
        icon: <RefreshCw size={15} aria-hidden="true" />,
        onSelect: () => start('renew', [r]),
      });
    if (r.status === 'active')
      items.push({
        key: 'suspend',
        label: L('إيقاف مؤقت', 'Suspend'),
        icon: <Pause size={15} aria-hidden="true" />,
        onSelect: () => start('suspend', [r]),
      });
    if (r.status === 'suspended')
      items.push({
        key: 'reinstate',
        label: L('إعادة العضوية', 'Reinstate'),
        icon: <Play size={15} aria-hidden="true" />,
        onSelect: () => start('reinstate', [r]),
      });
    if (r.status !== 'ended')
      items.push({
        key: 'end',
        label: L('إنهاء العضوية', 'End membership'),
        icon: <UserRoundX size={15} aria-hidden="true" />,
        tone: 'danger',
        onSelect: () => start('end', [r]),
      });
    return items;
  };

  const bulk = leaveTab ? (
    <>
      <Button
        size="sm"
        onClick={() => {
          setTargets(chosen.filter((r) => r.leaveRequest).map(toTarget));
          setAction('leave_approve');
        }}
      >
        {L('موافقة', 'Approve')}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setTargets(chosen.filter((r) => r.leaveRequest).map(toTarget));
          setAction('leave_decline');
        }}
      >
        {L('رفض', 'Decline')}
      </Button>
    </>
  ) : (
    <>
      <Button
        size="sm"
        iconStart={<RefreshCw size={14} aria-hidden="true" />}
        onClick={() =>
          start(
            'renew',
            chosen.filter((r) => r.status === 'active' || r.status === 'expired'),
          )
        }
        disabled={!chosen.some((r) => r.status === 'active' || r.status === 'expired')}
      >
        {L('تجديد', 'Renew')}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        iconStart={<Pause size={14} aria-hidden="true" />}
        onClick={() =>
          start(
            'suspend',
            chosen.filter((r) => r.status === 'active'),
          )
        }
        disabled={!chosen.some((r) => r.status === 'active')}
      >
        {L('إيقاف', 'Suspend')}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        iconStart={<Play size={14} aria-hidden="true" />}
        onClick={() =>
          start(
            'reinstate',
            chosen.filter((r) => r.status === 'suspended'),
          )
        }
        disabled={!chosen.some((r) => r.status === 'suspended')}
      >
        {L('إعادة', 'Reinstate')}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        iconStart={<Mail size={14} aria-hidden="true" />}
        onClick={() =>
          start(
            'message',
            chosen.filter((r) => r.linked),
          )
        }
        disabled={!chosen.some((r) => r.linked)}
      >
        {L('رسالة', 'Message')}
      </Button>
      {canCreate && (
        <Button
          size="sm"
          variant="secondary"
          iconStart={<KeyRound size={14} aria-hidden="true" />}
          onClick={() =>
            start(
              'resend',
              chosen.filter((r) => r.linked && !r.activated),
            )
          }
          disabled={!chosen.some((r) => r.linked && !r.activated)}
        >
          {L('إعادة التفعيل', 'Resend activation')}
        </Button>
      )}
      <Button
        size="sm"
        variant="destructive"
        iconStart={<LogOut size={14} aria-hidden="true" />}
        onClick={() =>
          start(
            'end',
            chosen.filter((r) => r.status !== 'ended'),
          )
        }
        disabled={!chosen.some((r) => r.status !== 'ended')}
      >
        {L('إنهاء', 'End')}
      </Button>
    </>
  );

  const th = 'px-4 py-3 text-start text-xs font-medium';
  const termCell = (r: AdminMemberRow) =>
    r.termEndsAt ? (
      <span
        className={cn(
          'tabular-nums',
          r.status === 'active' && r.endingSoon
            ? 'font-bold text-warning'
            : r.status !== 'active'
              ? 'text-muted'
              : '',
        )}
      >
        {r.status === 'expired' || r.status === 'ended'
          ? ar
            ? `انتهت ${formatDate(r.termEndsAt, lang)}`
            : `Ended ${formatDate(r.termEndsAt, lang)}`
          : formatDate(r.termEndsAt, lang)}
      </span>
    ) : (
      <span className="text-muted">—</span>
    );

  return (
    <div className="flex flex-col gap-3">
      {canManage && tab === 'ending_soon' && ending.length > 0 && (
        <div className="m-enter flex flex-wrap items-center justify-between gap-3 rounded-shape-xl bg-warning-soft p-4">
          <p className="text-sm font-medium">
            {L(
              `${ending.length} عضواً تنتهي مدتهم خلال 30 يوماً.`,
              `${ending.length} members' terms end within 30 days.`,
            )}
          </p>
          <Button
            iconStart={<RefreshCw size={15} aria-hidden="true" />}
            onClick={() => start('renew', ending)}
          >
            {L(`تجديد الـ ${ending.length}`, `Renew all ${ending.length}`)}
          </Button>
        </div>
      )}
      {canManage && (
        <BulkBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          hint={L('حدّد عدة أعضاء لإجراء جماعي', 'Select several members for a bulk action')}
          actions={bulk}
        />
      )}

      {/* Phones: cards */}
      <ul className="flex flex-col gap-3 pb-24 md:hidden">
        {rows.map((r) => {
          const st = stateOf(r, ar, lang);
          return (
            <li
              key={r.id}
              onClick={openRow(r.id)}
              data-selected={selected.has(r.id) || undefined}
              className="cursor-pointer rounded-shape-xl border border-line bg-surface p-3 data-[selected]:border-accent data-[selected]:bg-accent-soft/40"
            >
              <div className="flex items-start gap-3">
                {canManage && r.status !== 'ended' && (
                  <input
                    type="checkbox"
                    aria-label={L(`تحديد ${nameOf(r)}`, `Select ${nameOf(r)}`)}
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    className="mt-3 size-5 shrink-0 accent-[var(--accent)]"
                  />
                )}
                <Link
                  href={`/dashboard/members/${r.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <Avatar name={nameOf(r)} src={memberThumbUrl(r.photoPath)} size={56} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{nameOf(r)}</span>
                    <span
                      dir="ltr"
                      className="block truncate text-start font-mono text-xs text-muted"
                    >
                      {r.memberNo}
                    </span>
                    <span className="block truncate text-sm text-muted">
                      {[ar ? r.committeeAr : r.committeeEn, ar ? r.roleAr : r.roleEn]
                        .filter(Boolean)
                        .join(' · ') || L('بلا لجنة', 'No committee')}
                    </span>
                  </span>
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone={st.tone}>{st.text}</Badge>
                {st.sub && (
                  <span
                    className={cn(
                      'text-xs font-medium',
                      st.subTone === 'warning'
                        ? 'text-warning'
                        : st.subTone === 'info'
                          ? 'text-info'
                          : 'text-muted',
                    )}
                  >
                    {st.sub}
                  </span>
                )}
                {r.termEndsAt && r.status !== 'ended' && (
                  <span className="ms-auto text-xs text-muted tabular-nums">
                    {L('حتى', 'until')} {formatDate(r.termEndsAt, lang)}
                  </span>
                )}
              </div>
              {r.leaveRequest && canManage && (
                <div className="mt-3 rounded-shape-lg bg-info-soft p-3">
                  <p className="text-sm">
                    {r.leaveRequest.reason ?? L('لم يذكر سبباً.', 'No reason given.')}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setTargets([{ ...toTarget(r), actionId: r.leaveRequest!.id }]);
                        setAction('leave_approve');
                      }}
                    >
                      {L('موافقة', 'Approve')}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setTargets([{ ...toTarget(r), actionId: r.leaveRequest!.id }]);
                        setAction('leave_decline');
                      }}
                    >
                      {L('رفض', 'Decline')}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Wide screens: table */}
      <div className="hidden overflow-x-auto rounded-shape-xl border border-line bg-surface md:block">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="border-b border-line bg-surface-raised text-muted">
            <tr>
              {canManage && (
                <th scope="col" className="w-12 ps-4">
                  <input
                    type="checkbox"
                    aria-label={L('تحديد الكل', 'Select all')}
                    checked={allSelected}
                    onChange={() =>
                      setSelected(allSelected ? new Set() : new Set(selectable.map((r) => r.id)))
                    }
                    className="size-4 accent-[var(--accent)]"
                  />
                </th>
              )}
              <th scope="col" className={th}>
                {L('العضو', 'Member')}
              </th>
              <th scope="col" className={th}>
                {L('اللجنة والمنصب', 'Committee and position')}
              </th>
              <th scope="col" className={th}>
                {L('الحالة', 'Status')}
              </th>
              <th scope="col" className={th}>
                {L('نهاية المدة', 'Term end')}
              </th>
              <th scope="col" className={th}>
                {L('اكتمال الملف', 'Profile')}
              </th>
              <th scope="col" className={th}>
                {L('الدليل', 'Directory')}
              </th>
              <th scope="col" className="w-24">
                <span className="sr-only">{L('إجراءات', 'Actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="m-stagger">
            {rows.map((r, i) => {
              const st = stateOf(r, ar, lang);
              return (
                <Fragment key={r.id}>
                  <tr
                    onClick={openRow(r.id)}
                    style={{ ['--i' as string]: Math.min(i, 9) }}
                    data-selected={selected.has(r.id) || undefined}
                    className={cn(
                      'cursor-pointer align-middle transition-colors hover:bg-surface-raised data-[selected]:bg-accent-soft/40',
                      !(r.leaveRequest && canManage) && 'border-b border-line last:border-0',
                    )}
                  >
                    {canManage && (
                      <td className="ps-4">
                        <input
                          type="checkbox"
                          aria-label={L(`تحديد ${nameOf(r)}`, `Select ${nameOf(r)}`)}
                          checked={selected.has(r.id)}
                          disabled={r.status === 'ended' && !leaveTab}
                          onChange={() => toggle(r.id)}
                          className="size-4 accent-[var(--accent)]"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={nameOf(r)} src={memberThumbUrl(r.photoPath)} size={40} />
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/members/${r.id}`}
                            className="block max-w-[15rem] truncate font-semibold hover:text-accent-text focus-visible:outline-2 focus-visible:outline-focus-ring"
                          >
                            {nameOf(r)}
                          </Link>
                          <p dir="ltr" className="truncate text-start font-mono text-xs text-muted">
                            {r.memberNo}
                            {canContact && r.email ? ` · ${r.email}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {r.committeeAr || r.roleAr ? (
                        <>
                          <p>{(ar ? r.committeeAr : r.committeeEn) ?? '—'}</p>
                          <p className="text-xs text-muted">{ar ? r.roleAr : r.roleEn}</p>
                        </>
                      ) : (
                        <span className="text-muted">{L('بلا لجنة', 'No committee')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={st.tone}>{st.text}</Badge>
                      {st.sub && (
                        <p
                          className={cn(
                            'mt-1 text-xs font-medium',
                            st.subTone === 'warning'
                              ? 'text-warning'
                              : st.subTone === 'info'
                                ? 'text-info'
                                : 'text-muted',
                          )}
                        >
                          {st.sub}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{termCell(r)}</td>
                    <td className="w-48 px-4 py-3">
                      <CompletenessBar
                        percent={r.completeness}
                        label={L('اكتمال الملف', 'Profile completeness')}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        {r.listed ? (
                          <Eye aria-hidden="true" className="size-4" />
                        ) : (
                          <EyeOff aria-hidden="true" className="size-4" />
                        )}
                        {r.listed ? L('ظاهر', 'Visible') : L('مخفي', 'Hidden')}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {r.leaveRequest && canManage && leaveTab ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setTargets([{ ...toTarget(r), actionId: r.leaveRequest!.id }]);
                                setAction('leave_approve');
                              }}
                            >
                              {L('موافقة', 'Approve')}
                            </Button>
                          </>
                        ) : null}
                        {!r.linked && canManage && (
                          <MemberActions
                            compact
                            subject={{
                              id: r.id,
                              nameAr: r.nameAr,
                              nameEn: r.nameEn,
                              status: r.status,
                            }}
                            linked={false}
                            claimEmail={null}
                            canManage
                          />
                        )}
                        <ActionMenu
                          label={L(`إجراءات ${nameOf(r)}`, `Actions for ${nameOf(r)}`)}
                          items={menuFor(r)}
                        />
                        {!canManage && (
                          <Link
                            href={`/dashboard/members/${r.id}`}
                            aria-label={`${L('فتح', 'Open')} ${nameOf(r)}`}
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-muted hover:bg-surface-raised hover:text-text"
                          >
                            <Arrow aria-hidden="true" className="size-5" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                  {r.leaveRequest && canManage && (
                    <tr className="border-b border-line last:border-0">
                      <td colSpan={canManage ? 8 : 7} className="px-4 pb-4 pt-0">
                        <div className="m-pop flex flex-wrap items-center gap-3 rounded-shape-lg bg-info-soft p-4">
                          <LogOut size={18} aria-hidden="true" className="shrink-0 text-info" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold">
                              {L(
                                'طلب مغادرة بانتظار قرارك',
                                'Leave request waiting for your decision',
                              )}
                              <span className="ms-2 font-normal text-muted">
                                {L('منذ', 'since')} {dayOf(r.leaveRequest.createdAt)}
                                {r.leaveRequest.preferredLastDay
                                  ? ` · ${L('يفضّل آخر يوم', 'prefers the last day')} ${dayOf(r.leaveRequest.preferredLastDay)}`
                                  : ''}
                              </span>
                            </p>
                            <p className="mt-0.5 text-sm">
                              {r.leaveRequest.reason ?? L('لم يذكر سبباً.', 'No reason given.')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => decideLeave(r, 'leave_approve')}>
                              {L('موافقة', 'Approve')}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => decideLeave(r, 'leave_decline')}
                            >
                              {L('رفض', 'Decline')}
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <MemberActionDialogs
        action={action}
        targets={targets}
        onClose={() => setAction(null)}
        onDone={() => setSelected(new Set())}
      />
    </div>
  );
}
