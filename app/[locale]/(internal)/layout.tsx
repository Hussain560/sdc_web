import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';

// Frame for signed-in pages. Sprint 03 uses the public chrome; Sprint 04 replaces it with the
// permission-driven dashboard shell (docs/10-design-system/INTERNAL-SCREENS/01-shell-layout.md).
export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-text">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">{children}</main>
      <Footer />
    </div>
  );
}
