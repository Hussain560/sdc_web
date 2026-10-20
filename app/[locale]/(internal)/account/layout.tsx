import { AccountTabs } from '@/modules/account/components/AccountTabs';

/**
 * The account area. Pages read best in a narrow column; a page that needs room (the profile editor with its preview)
 * marks its root element with `data-wide` and spans the full width.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl">
      <AccountTabs />
      <div className="[&>*:not([data-wide])]:max-w-3xl">{children}</div>
    </div>
  );
}
