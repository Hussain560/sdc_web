export type Metrics = {
  eventsHeld: number;
  registrations: number;
  accepted: number;
  rejected: number;
  acceptanceRate: number | null;
  attendanceRate: number | null;
  attendanceEvents: number;
  memberShare: number | null;
  articlesPublished: number;
  certificatesSent: number;
  activeMembers: number | null;
  newMembers: number | null;
  committeeSize: number | null;
};

export type MonthRow = { month: string; registrations: number; attendance: number | null };

export type CommitteeRow = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string | null;
  status: string;
  metrics: Metrics;
};

export type Breakdown = { key: string; label?: { ar: string; en: string }; count: number | null };

export type CommunityStats = {
  period: { from: string; to: string };
  current: Metrics;
  previous: Metrics;
  funnel: {
    submitted: number;
    accepted: number;
    rejected: number;
    waitlisted: number;
    withdrawn: number;
    inReview: number;
  };
  monthly: MonthRow[];
  committees: CommitteeRow[];
  academicStatus: Breakdown[];
  universities: Breakdown[];
};

export type CommitteeEventRow = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  status: string;
  lastDate: string;
  registrations: number;
  accepted: number;
  attendance: number | null;
};

export type CommitteeStats = {
  period: { from: string; to: string };
  committee: { id: string; slug: string; nameAr: string; nameEn: string | null };
  current: Metrics;
  previous: Metrics;
  events: CommitteeEventRow[];
};

export type QueueItem = {
  kind: 'event' | 'article' | 'event_changes';
  id: string;
  titleAr: string;
  titleEn: string | null;
  at: string | null;
};

export type PendingQueues = {
  eventsPendingReview: number;
  articlesInReview: number;
  applicationsOpen: number;
  registrationsPending: number;
  changesRequested: number;
  failedEmails: number;
  items: QueueItem[];
};

export type DashboardSummary = {
  activeMembers: number | null;
  newMembersYear: number | null;
  upcomingEvents: number;
  upcoming: Array<{
    id: string;
    slug: string;
    titleAr: string;
    titleEn: string | null;
    committeeAr: string;
    committeeEn: string | null;
    startDate: string | null;
    seats: number | null;
    accepted: number;
  }>;
  openCycle: { nameAr: string; nameEn: string | null; closesAt: string } | null;
};

export type MyActivity = {
  registrations: Array<{
    id: string;
    status: string;
    slug: string;
    titleAr: string;
    titleEn: string | null;
    startDate: string | null;
    attendancePercent: number | null;
    certificateId: string | null;
  }>;
  application: {
    status: string;
    cycleAr: string;
    cycleEn: string | null;
    submittedAt: string | null;
  } | null;
  member: { status: string; joinedAt: string } | null;
  threads: number;
};
