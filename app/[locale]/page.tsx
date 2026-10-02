import React from 'react';
import Header from '@/components/Header/Header';
import HeroSection from '@/components/HeroSection/HeroSection';
import CommunitySections from '@/components/CommunitySections/CommunitySections';
import ArticlesSection from '@//components/ArticlesSection/ArticlesSection';
import MembersSection from '@//components/MembersSection/MembersSection';
import Footer from '@//components/Footer/Footer';

export default function Home() {
  return (
    <main style={{ backgroundColor: '#0D0E12', minHeight: '100vh' }}>
      <Header />
      <HeroSection />
      <ArticlesSection />
      <CommunitySections />
      <MembersSection />
      <Footer />
    </main>
  );
}
