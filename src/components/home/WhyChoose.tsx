'use client';

import React from 'react';
import {
  Sparkles,
  Scissors,
  Palette,
  Layers,
  Tag,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const WhyChoose = () => {
  return (
    <section id="why" className="py-14 bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-[#0F172A] border border-amber-400/20 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-white">
          {/* Glass ambient highlights */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-8 relative z-10">
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3.5 py-1 rounded-full inline-block mb-3 backdrop-blur-md">
              THE VR SIGNATURE DIFFERENCE
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight uppercase">
              WHY MEN CHOOSE VR COLLECTION
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm font-medium mt-2">
              Every shirt, trouser, and ethnic wear item is engineered for impeccable fit, premium breathability, and lasting everyday elegance.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 relative z-10">
            {[
              { icon: Sparkles, title: 'Combed Cotton', desc: 'Breathable, ultra-soft yarns' },
              { icon: Scissors, title: 'Precision Tailored', desc: 'Flattering slim & regular fits' },
              { icon: Palette, title: 'Color-Lock Tech', desc: 'No fade after multiple washes' },
              { icon: Layers, title: '3-in-1 Combo Value', desc: '3 styles in 1 box, save up to 50%' },
              { icon: Tag, title: 'Per-Size Pricing', desc: 'Flipkart style: pay exact size price' },
              { icon: ShieldCheck, title: 'Reinforced Seams', desc: 'High tensile durable stitching' },
              { icon: RefreshCw, title: '7-Day Size Swap', desc: 'Instant WhatsApp exchange' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/50 p-3.5 sm:p-4 rounded-2xl text-center transition-all duration-300 backdrop-blur-md hover:-translate-y-1 hover:shadow-xl group last:col-span-2 sm:last:col-span-1"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-black text-xs text-white leading-snug mb-1">
                  {item.title}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium leading-tight hidden sm:block">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
