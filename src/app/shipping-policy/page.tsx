import type { Metadata } from 'next';
import React from 'react';
import { Header } from '@/components/layout/Header';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Footer } from '@/components/layout/Footer';
import { Truck, CheckCircle, Clock } from 'lucide-react';
import { getShopPhoneDisplay } from '@/lib/shopContact';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vrmenswear.in';

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | VR Men's Wear",
  description:
    "ST Courier Express shipping timelines and 7-day size exchange policies for VR Men's Wear across Tamil Nadu, South India, and PAN India.",
  alternates: {
    canonical: `${siteUrl}/shipping-policy`,
  },
  openGraph: {
    title: "Shipping & Delivery Policy | VR Men's Wear",
    description:
      "ST Courier Express shipping timelines and delivery policies for VR Men's Wear.",
    url: `${siteUrl}/shipping-policy`,
    siteName: "VR Men's Wear",
    type: 'website',
  },
};

export default function ShippingPolicyPage() {
  const shopPhone = getShopPhoneDisplay();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 page-mobile-nav">
      <AnnouncementBar />
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          <div className="border-b border-slate-100 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Truck className="w-4 h-4" /> Shipping & Delivery
            </div>
            <h1 className="font-black text-2xl sm:text-3xl text-slate-900">Shipping & Exchange Policy</h1>
            <p className="text-xs text-slate-500 mt-1">VR Men's Wear · Premium Apparel & Combos</p>
          </div>

          <section className="space-y-3 text-xs sm:text-sm leading-relaxed text-slate-600">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" /> Shipping Partners & Timelines
            </h2>
            <p>
              We ship all garment packages via <strong>ST Courier Express</strong> directly from our Chennai fulfillment hub.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Chennai & Tamil Nadu:</strong> 1 to 2 working days.</li>
              <li><strong>Puducherry, Karnataka, Kerala, AP & Telangana:</strong> 2 to 4 working days.</li>
              <li><strong>Rest of India:</strong> 3 to 6 working days.</li>
            </ul>
          </section>

          <section className="space-y-3 text-xs sm:text-sm leading-relaxed text-slate-600">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> 7-Day Hassle-Free Size Exchange
            </h2>
            <p>
              We want you to look your best. If the shirt, t-shirt, or trousers you received don't fit right, we offer a <strong>7-Day Size Exchange</strong>.
            </p>
            <p>
              Simply notify our team on WhatsApp at <strong>{shopPhone}</strong> within 7 days of delivery with your Order ID and the replacement size needed. The item must be unused, unwashed, with all original tags attached.
            </p>
          </section>

          <section className="space-y-3 text-xs sm:text-sm leading-relaxed text-slate-600">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" /> Customer Support Desk
            </h2>
            <p>
              Track your parcel anytime on My Orders or the Track page. For delivery inquiries or fabric sizing assistance, contact{' '}
              <strong>{shopPhone}</strong> or <strong>support@vrmenswear.in</strong>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
