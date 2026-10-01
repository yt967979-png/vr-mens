'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/ui/BrandLogo';
import {
  OFFICE_ADDRESS_LINES,
  OFFICE_COMPANY_NAME,
  OFFICE_MAPS_SEARCH_URL,
} from '@/lib/officeLocation';

export const Footer = () => {
  return (
    <footer id="footer" className="bg-gradient-to-b from-[#071113] via-[#09171A] to-[#040A0C] text-slate-400 text-xs pt-14 border-t border-[#143337]">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-12">
        {/* Col 1: Brand & Social */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2.5">
            <BrandLogo size={42} className="w-11 h-11" showText={true} />
          </div>
          
          <p className="text-slate-400 text-xs leading-relaxed font-medium">
            Handcrafted menswear engineered for modern masculinity, supreme durability, and breathable all-day comfort. Featuring pure cotton shirts, stretch chinos, festival kurtas, and triple-value 3-in-1 combo packs.
          </p>

          <div className="pt-1">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">
              CONNECT &amp; DIRECT WHATSAPP SUPPORT
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="https://wa.me/919486017820"
                target="_blank"
                rel="noreferrer"
                className="bg-[#25D366]/15 hover:bg-[#25D366] border border-[#25D366]/30 text-[#25D366] hover:text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-xs hover:scale-105 active:scale-95 group"
                aria-label="WhatsApp Support"
              >
                <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.285-.143-1.689-.834-1.95-.929-.261-.095-.451-.143-.641.143-.19.285-.737.929-.903 1.119-.166.19-.333.214-.618.071-.285-.143-1.205-.444-2.296-1.417-.848-.757-1.421-1.692-1.587-1.977-.166-.285-.018-.439.125-.581.128-.128.285-.333.428-.499.143-.166.19-.285.285-.475.095-.19.048-.356-.024-.499-.071-.143-.641-1.545-.879-2.116-.231-.555-.466-.48-.641-.489-.166-.008-.356-.008-.546-.008s-.5.071-.76.356c-.261.285-1.001.978-1.001 2.384 0 1.406 1.024 2.766 1.166 2.956.143.19 2.016 3.078 4.885 4.316.682.295 1.214.471 1.629.603.684.217 1.307.186 1.8.113.551-.082 1.689-.69 1.926-1.356.237-.666.237-1.236.166-1.356-.07-.12-.26-.192-.545-.335z"/>
                </svg>
                <span>WhatsApp Desk</span>
              </a>

              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noreferrer"
                className="bg-gradient-to-r from-orange-500/15 via-rose-500/15 to-amber-500/15 hover:from-orange-500 hover:to-rose-600 border border-orange-500/30 text-orange-400 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-xs hover:scale-105 active:scale-95 group"
                aria-label="Instagram Profile"
              >
                <svg className="w-4 h-4 fill-current group-hover:rotate-12 transition-transform" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>Instagram</span>
              </a>
            </div>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div className="lg:col-span-2">
          <h4 className="font-heading font-black text-xs text-white uppercase tracking-widest mb-4 border-b border-[#143337] pb-2">
            COLLECTIONS
          </h4>
          <ul className="space-y-2.5 font-semibold text-slate-300 text-xs">
            <li>
              <Link href="/" className="hover:text-orange-400 transition-colors flex items-center gap-1.5">
                <span>•</span> All Menswear
              </Link>
            </li>
            <li>
              <Link href="/search?q=shirt" prefetch={false} className="hover:text-orange-400 transition-colors flex items-center gap-1.5">
                <span>•</span> Cotton Shirts
              </Link>
            </li>
            <li>
              <Link href="/search?q=trouser" prefetch={false} className="hover:text-orange-400 transition-colors flex items-center gap-1.5">
                <span>•</span> Trousers &amp; Chinos
              </Link>
            </li>
            <li>
              <Link href="/search?q=combo" prefetch={false} className="hover:text-orange-400 transition-colors flex items-center gap-1.5 text-orange-400 font-bold">
                <span>•</span> 3-in-1 Combo Packs
              </Link>
            </li>
            <li>
              <Link href="/orders" prefetch={false} className="hover:text-orange-400 transition-colors flex items-center gap-1.5">
                <span>•</span> Track My Order
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Policies & Support */}
        <div className="lg:col-span-3">
          <h4 className="font-heading font-black text-xs text-white uppercase tracking-widest mb-4 border-b border-[#143337] pb-2">
            POLICIES &amp; ASSURANCES
          </h4>
          <ul className="space-y-2.5 font-semibold text-slate-300 text-xs">
            <li>
              <Link href="/shipping-policy" prefetch={false} className="hover:text-orange-400 transition-colors flex items-center gap-1.5">
                <span>•</span> Fast Doorstep Shipping
              </Link>
            </li>
            <li>
              <Link href="/help" prefetch={false} className="hover:text-orange-400 transition-colors flex items-center gap-1.5">
                <span>•</span> 7-Day Size Exchange Guide
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" prefetch={false} className="hover:text-orange-400 transition-colors flex items-center gap-1.5">
                <span>•</span> Privacy &amp; Data Security
              </Link>
            </li>
            <li>
              <Link href="/terms-of-service" prefetch={false} className="hover:text-orange-400 transition-colors flex items-center gap-1.5">
                <span>•</span> Terms of Service
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Contact & Office */}
        <div className="lg:col-span-3 space-y-2.5">
          <h4 className="font-heading font-black text-xs text-white uppercase tracking-widest mb-4 border-b border-[#143337] pb-2">
            STORE &amp; DISPATCH
          </h4>
          <div className="space-y-2 font-medium text-slate-300 text-xs">
            <p className="font-bold text-white text-xs">
              {OFFICE_COMPANY_NAME}
            </p>
            <p className="text-slate-400 text-[11px]">
              {OFFICE_ADDRESS_LINES[1]}
            </p>
            <a
              href={OFFICE_MAPS_SEARCH_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-extrabold transition-colors pt-1"
            >
              <span>📍 View on Google Maps</span>
            </a>
            <div className="pt-2 space-y-1">
              <p className="text-orange-300 font-black text-xs flex items-center gap-1.5">
                <span>📞</span> +91 94860 17820 / +91 63829 63350
              </p>
              <p className="text-slate-300 font-medium text-[11px] flex items-center gap-1.5">
                <span>✉️</span> support@vrmenswear.in
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Payment Badges Bar */}
      <div className="border-t border-[#143337] bg-[#040A0C] pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:py-5">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-3 text-slate-400 text-xs font-semibold text-center md:text-left">
          <div>
            <span>© 2026 VR Men&apos;s Wear. All Rights Reserved.</span>
            <span className="text-slate-500 block sm:inline sm:ml-2">Premium Apparel &amp; Tailored Fits.</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <span className="bg-[#09171A] border border-[#143337] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
              🔒 100% Safe Razorpay Checkout
            </span>
            <span className="bg-[#09171A] border border-[#143337] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
              🚚 ST Courier Express
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
