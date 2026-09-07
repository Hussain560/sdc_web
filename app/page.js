import React from 'react';
import Header from '../src/components/Header/Header';
import HeroSection from '../src/components/HeroSection/HeroSection';
import CommunitySections from '../src/components/CommunitySections/CommunitySections';
import ArticlesSection from '../src//components/ArticlesSection/ArticlesSection';
import MembersSection from '../src//components/MembersSection/MembersSection';
import Footer from '../src//components/Footer/Footer';

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