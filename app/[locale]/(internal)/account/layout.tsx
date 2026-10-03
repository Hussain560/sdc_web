import { AccountTabs } from '@/modules/account/components/AccountTabs';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl">
      <AccountTabs />
      {children}
    </div>
  );
}
