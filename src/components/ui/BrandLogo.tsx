import React from 'react';
import Image from 'next/image';

type BrandLogoProps = {
  size?: number;
  className?: string;
  showText?: boolean;
  priority?: boolean;
};

/** Official VR Men's Wear Luxury Emblem & Typography */
export function BrandLogo({ size = 44, className = '', showText = false, priority = false }: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official VR Men's Wear Emblem */}
      <div
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1315] via-[#13383B] to-[#E87A36]/30 p-[1.5px] shadow-lg shadow-black/20 ring-1 ring-orange-500/20 group-hover:ring-orange-400 transition-all duration-300 overflow-hidden shrink-0"
      >
        <Image
          src="/vr-logo.png"
          alt="VR Men's Wear"
          width={size}
          height={size}
          priority={priority}
          className="w-full h-full object-contain p-0.5 rounded-[10px]"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-heading font-black tracking-tight text-slate-900 dark:text-white text-base md:text-lg">
            VR MEN&apos;S
          </span>
          <span className="text-[10px] tracking-[0.25em] font-extrabold bg-gradient-to-r from-orange-500 via-amber-500 to-teal-600 bg-clip-text text-transparent uppercase">
            WEAR
          </span>
        </div>
      )}
    </div>
  );
}
