import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { Link } from '@/i18n/navigation';

/** Public chrome of /join: the existing Header and Footer, a page banner with breadcrumb and a card (max 720px). */
export function JoinFrame({ ar, children }: { ar: boolean; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-text">
      <Header />
      <main className="flex-1">
        <section className="border-b border-line bg-surface-raised">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <nav
              className="mb-4 flex items-center gap-2 text-sm text-muted"
              aria-label="breadcrumb"
            >
              <Link href="/" className="hover:text-text">
                {ar ? 'الرئيسية' : 'Home'}
              </Link>
              <span aria-hidden="true">&gt;</span>
              <span className="text-accent">{ar ? 'انضم إلينا' : 'Join us'}</span>
            </nav>
            <h1 className="text-3xl font-extrabold">
              {ar ? 'انضم إلى المجتمع السعودي للمطورين' : 'Join the Saudi Developer Community'}
            </h1>
          </div>
        </section>
        <div className="mx-auto max-w-[720px] px-4 py-10">
          <div className="rounded-2xl border border-line border-t-2 border-t-accent bg-surface p-6 sm:p-8">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
