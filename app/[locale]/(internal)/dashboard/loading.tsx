import { CardsPageSkeleton } from '@/components/layout/PageHeader';

// Shown inside the shell while a dashboard route streams; the sidebar and header stay visible.
export default function DashboardLoading() {
  return <CardsPageSkeleton />;
}
