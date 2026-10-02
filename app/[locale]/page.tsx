import React from 'react';
import Header from '@/components/Header/Header';
import HeroSection from '@/components/HeroSection/HeroSection';
import CommunitySections from '@/components/CommunitySections/CommunitySections';
import ArticlesSection from '@//components/ArticlesSection/ArticlesSection';
import MembersSection from '@//components/MembersSection/MembersSection';
import { listPublicEvents } from '@/modules/events/public';
import Footer from '@//components/Footer/Footer';

// The upcoming-events block reads the same public data as /events (revalidated every minute).
export const revalidate = 60;

export default async function Home() {
  const events = await listPublicEvents(3);
  return (
    <main style={{ backgroundColor: '#0D0E12', minHeight: '100vh' }}>
      <Header />
      <HeroSection />
      <ArticlesSection events={events} />
      <CommunitySections />
      <MembersSection />
      <Footer />
    </main>
  );
}
