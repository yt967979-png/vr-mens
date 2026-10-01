'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { isAdminShopPreview } from '@/lib/adminShopPreview';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Header } from '@/components/layout/Header';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryPicker } from '@/components/home/CategoryPicker';
import { ProductGrid } from '@/components/home/ProductGrid';
import { WhyChoose } from '@/components/home/WhyChoose';
import { FAQSection } from '@/components/home/FAQSection';
import { TrustBar } from '@/components/home/TrustBar';
import { Footer } from '@/components/layout/Footer';
import { ContactSection } from '@/components/home/ContactSection';
import { PromoSection } from '@/components/home/PromoSection';
import { HomeCouponsSection } from '@/components/home/HomeCouponsSection';
import { serializeJsonLd } from '@/lib/jsonLd';

export default function Home() {
  const router = useRouter();
  const { user } = useStore();

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin') && !isAdminShopPreview()) {
      router.replace('/admin');
    }
  }, [user, router]);

  // Deep links like /#products or /#why
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const t = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
    return () => clearTimeout(t);
  }, []);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vrmenswear.in';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: "VR Men's Wear",
    legalName: "VR MEN'S WEAR",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      "Premium Men's Clothing Store — Shirts, T-Shirts, Trousers, Kurtas & 3-in-1 Combo Packs with dynamic per-size pricing and doorstep delivery.",
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Shop No. 4, Commercial Complex, Main Bazaar Road, Anna Nagar',
      addressLocality: 'Chennai',
      addressRegion: 'Tamil Nadu',
      postalCode: '600040',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-9486017820',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Tamil', 'Hindi'],
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: "VR Men's Wear",
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col page-mobile-nav">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteSchema) }}
      />
      <AnnouncementBar />
      <Header />
      <HeroSection />
      <CategoryPicker />
      <ProductGrid />
      <PromoSection />
      <HomeCouponsSection />
      <WhyChoose />
      <ContactSection />
      <FAQSection />
      <TrustBar />
      <Footer />
    </main>
  );
}
