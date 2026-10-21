import { CardsPageSkeleton } from '@/components/layout/PageHeader';

// Shown inside the shell while an account screen streams; the tabs and sidebar stay visible.
export default function AccountLoading() {
  return <CardsPageSkeleton cards={2} />;
}
