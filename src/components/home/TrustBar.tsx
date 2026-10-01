'use client';

import React from 'react';
import { ShieldCheck, Truck, Sparkles, RefreshCw } from 'lucide-react';

export const TrustBar = () => {
  return (
    <div className="bg-gradient-to-r from-[#070A10] via-[#0F172A] to-[#070A10] text-white py-8 border-t border-slate-800 relative overflow-hidden">
      {/* Subtle backdrop lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 relative z-10">
        <div className="flex flex-col min-[480px]:flex-row items-start min-[480px]:items-center gap-2.5 min-[480px]:gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md hover:border-amber-400/40 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-heading font-black text-[11px] sm:text-xs text-white uppercase tracking-wider leading-tight">
              100% SECURE CHECKOUT
            </h4>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Razorpay UPI, Cards &amp; NetBanking
            </p>
          </div>
        </div>

        <div className="flex flex-col min-[480px]:flex-row items-start min-[480px]:items-center gap-2.5 min-[480px]:gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md hover:border-amber-400/40 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-heading font-black text-[11px] sm:text-xs text-white uppercase tracking-wider leading-tight">
              FAST DOORSTEP DISPATCH
            </h4>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Free Delivery on ₹999+ &amp; Combos
            </p>
          </div>
        </div>

        <div className="flex flex-col min-[480px]:flex-row items-start min-[480px]:items-center gap-2.5 min-[480px]:gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md hover:border-amber-400/40 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-heading font-black text-[11px] sm:text-xs text-white uppercase tracking-wider leading-tight">
              PREMIUM COTTON &amp; LINEN
            </h4>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Pre-shrunk, breathable, color-fast
            </p>
          </div>
        </div>

        <div className="flex flex-col min-[480px]:flex-row items-start min-[480px]:items-center gap-2.5 min-[480px]:gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md hover:border-amber-400/40 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-heading font-black text-[11px] sm:text-xs text-white uppercase tracking-wider leading-tight">
              EASY SIZE EXCHANGE
            </h4>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              7-Day swap &amp; WhatsApp support
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
