import { AccountTabs } from '@/modules/account/components/AccountTabs';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AccountTabs />
      {children}
    </>
  );
}
