import React from 'react';
import Header from '@/components/Header/Header';
import HeroSection from '@/components/HeroSection/HeroSection';
import CommunitySections from '@/components/CommunitySections/CommunitySections';
import ArticlesSection from '@//components/ArticlesSection/ArticlesSection';
import MembersSection from '@//components/MembersSection/MembersSection';
import { listPublicArticles } from '@/modules/articles/public';
import { listPublicEvents } from '@/modules/events/public';
import { listPublicPartners } from '@/modules/admin/public';
import Footer from '@//components/Footer/Footer';

// The events and threads blocks read the same public data as /events and /articles (revalidated every minute).
export const revalidate = 60;

export default async function Home() {
  const [events, articles, partners] = await Promise.all([
    listPublicEvents(3),
    listPublicArticles(6),
    listPublicPartners(),
  ]);
  return (
    <main style={{ backgroundColor: '#0D0E12', minHeight: '100vh' }}>
      <Header />
      <HeroSection />
      <ArticlesSection events={events} articles={articles} />
      <CommunitySections />
      <MembersSection partners={partners} />
      <Footer />
    </main>
  );
}
