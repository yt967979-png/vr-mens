import type { Metadata } from 'next';
import React from 'react';
import { Header } from '@/components/layout/Header';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Footer } from '@/components/layout/Footer';
import { FileText, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vrmenswear.in';

export const metadata: Metadata = {
  title: "Terms of Service | VR Men's Wear",
  description:
    "Terms and conditions for purchasing premium menswear from VR Men's Wear online store.",
  alternates: {
    canonical: `${siteUrl}/terms-of-service`,
  },
  openGraph: {
    title: "Terms of Service | VR Men's Wear",
    description:
      "Terms and conditions for purchasing premium menswear from VR Men's Wear.",
    url: `${siteUrl}/terms-of-service`,
    siteName: "VR Men's Wear",
    type: 'website',
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 page-mobile-nav">
      <AnnouncementBar />
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          <div className="border-b border-slate-100 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <FileText className="w-4 h-4" /> Customer Agreement
            </div>
            <h1 className="font-black text-2xl sm:text-3xl text-slate-900">Terms of Service</h1>
            <p className="text-xs text-slate-500 mt-1">Effective Date: October 2026 • VR Men's Wear Retail & Dispatch</p>
          </div>

          <section className="space-y-3 text-xs sm:text-sm leading-relaxed text-slate-600">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1. Acceptance of Terms
            </h2>
            <p>
              By browsing, creating an account, or purchasing garments from VR Men's Wear (vrmenswear.in), you agree to be bound by these terms and conditions. All apparel, fabrics, sizing specifications, and combo bundles are crafted with stringent quality inspection.
            </p>
          </section>

          <section className="space-y-3 text-xs sm:text-sm leading-relaxed text-slate-600">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" /> 2. Pricing & Orders
            </h2>
            <p>
              Prices listed are in Indian Rupees (INR) inclusive of applicable taxes. Pricing is dynamic and tied to your chosen size and pack configuration. Payments are securely processed via Razorpay. Order confirmation receipts and tracking IDs are provided upon dispatch.
            </p>
          </section>

          <section className="space-y-3 text-xs sm:text-sm leading-relaxed text-slate-600">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> 3. Brand & Quality Standard
            </h2>
            <p>
              All apparel designs, product imagery, and logos displayed on this site are the exclusive property of VR Men's Wear. Unauthorized replication of our custom garment designs is prohibited.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
