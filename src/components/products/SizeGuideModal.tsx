'use client';

import React, { useState } from 'react';
import { X, Ruler, Check } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

export function SizeGuideModal({ isOpen, onClose, category = 'shirts' }: SizeGuideModalProps) {
  const [unit, setUnit] = useState<'in' | 'cm'>('in');
  const [activeTab, setActiveTab] = useState<'tops' | 'bottoms'>(
    category.includes('trouser') || category.includes('jean') ? 'bottoms' : 'tops'
  );

  if (!isOpen) return null;

  const topSizesInches = [
    { size: 'S (38)', chest: '38', length: '28', shoulder: '17.5', sleeve: '24.5' },
    { size: 'M (40)', chest: '40', length: '29', shoulder: '18.0', sleeve: '25.0' },
    { size: 'L (42)', chest: '42', length: '30', shoulder: '18.5', sleeve: '25.5' },
    { size: 'XL (44)', chest: '44', length: '31', shoulder: '19.0', sleeve: '26.0' },
    { size: 'XXL (46)', chest: '46', length: '31.5', shoulder: '19.5', sleeve: '26.5' },
    { size: '3XL (48)', chest: '48', length: '32', shoulder: '20.0', sleeve: '27.0' },
  ];

  const topSizesCm = [
    { size: 'S (38)', chest: '96.5', length: '71.1', shoulder: '44.5', sleeve: '62.2' },
    { size: 'M (40)', chest: '101.6', length: '73.7', shoulder: '45.7', sleeve: '63.5' },
    { size: 'L (42)', chest: '106.7', length: '76.2', shoulder: '47.0', sleeve: '64.8' },
    { size: 'XL (44)', chest: '111.8', length: '78.7', shoulder: '48.3', sleeve: '66.0' },
    { size: 'XXL (46)', chest: '116.8', length: '80.0', shoulder: '49.5', sleeve: '67.3' },
    { size: '3XL (48)', chest: '121.9', length: '81.3', shoulder: '50.8', sleeve: '68.6' },
  ];

  const bottomSizesInches = [
    { size: '28', waist: '28 - 29', length: '39.5', hip: '36', thigh: '21' },
    { size: '30', waist: '30 - 31', length: '40.0', hip: '38', thigh: '22' },
    { size: '32', waist: '32 - 33', length: '40.5', hip: '40', thigh: '23' },
    { size: '34', waist: '34 - 35', length: '41.0', hip: '42', thigh: '24' },
    { size: '36', waist: '36 - 37', length: '41.5', hip: '44', thigh: '25' },
    { size: '38', waist: '38 - 39', length: '42.0', hip: '46', thigh: '26' },
  ];

  const bottomSizesCm = [
    { size: '28', waist: '71 - 74', length: '100.3', hip: '91.4', thigh: '53.3' },
    { size: '30', waist: '76 - 79', length: '101.6', hip: '96.5', thigh: '55.9' },
    { size: '32', waist: '81 - 84', length: '102.9', hip: '101.6', thigh: '58.4' },
    { size: '34', waist: '86 - 89', length: '104.1', hip: '106.7', thigh: '61.0' },
    { size: '36', waist: '91 - 94', length: '105.4', hip: '111.8', thigh: '63.5' },
    { size: '38', waist: '96 - 99', length: '106.7', hip: '116.8', thigh: '66.0' },
  ];

  const topRows = unit === 'in' ? topSizesInches : topSizesCm;
  const bottomRows = unit === 'in' ? bottomSizesInches : bottomSizesCm;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0B1518] rounded-2xl shadow-2xl border border-[#16383D] overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#16383D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Size &amp; Measurement Guide</h3>
              <p className="text-xs text-slate-400">VR Men&apos;s Wear Tailored Fits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Unit Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-[#071113] border-b border-[#16383D]">
          <div className="flex rounded-xl p-1 bg-[#0E2226] border border-[#194046]">
            <button
              onClick={() => setActiveTab('tops')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'tops'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Shirts, T-Shirts &amp; Kurtas
            </button>
            <button
              onClick={() => setActiveTab('bottoms')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'bottoms'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Trousers &amp; Jeans
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span>Unit:</span>
            <div className="flex rounded-lg p-0.5 bg-[#0E2226] border border-[#194046]">
              <button
                onClick={() => setUnit('in')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  unit === 'in' ? 'bg-orange-500 text-white' : 'hover:text-white text-slate-400'
                }`}
              >
                Inches
              </button>
              <button
                onClick={() => setUnit('cm')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  unit === 'cm' ? 'bg-orange-500 text-white' : 'hover:text-white text-slate-400'
                }`}
              >
                CM
              </button>
            </div>
          </div>
        </div>

        {/* Measurement Table */}
        <div className="p-6 overflow-x-auto max-h-[60vh]">
          {activeTab === 'tops' ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#16383D] text-xs font-bold uppercase tracking-wider text-orange-400 bg-[#071113]">
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Chest ({unit})</th>
                  <th className="py-3 px-3">Length ({unit})</th>
                  <th className="py-3 px-3">Shoulder ({unit})</th>
                  <th className="py-3 px-3">Sleeve ({unit})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#16383D]">
                {topRows.map((r, i) => (
                  <tr key={i} className="hover:bg-orange-500/10 transition">
                    <td className="py-3 px-3 font-bold text-white">{r.size}</td>
                    <td className="py-3 px-3 text-slate-300">{r.chest}</td>
                    <td className="py-3 px-3 text-slate-300">{r.length}</td>
                    <td className="py-3 px-3 text-slate-300">{r.shoulder}</td>
                    <td className="py-3 px-3 text-slate-300">{r.sleeve}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#16383D] text-xs font-bold uppercase tracking-wider text-orange-400 bg-[#071113]">
                  <th className="py-3 px-3">Waist Size</th>
                  <th className="py-3 px-3">Waist ({unit})</th>
                  <th className="py-3 px-3">Length ({unit})</th>
                  <th className="py-3 px-3">Hip ({unit})</th>
                  <th className="py-3 px-3">Thigh ({unit})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#16383D]">
                {bottomRows.map((r, i) => (
                  <tr key={i} className="hover:bg-orange-500/10 transition">
                    <td className="py-3 px-3 font-bold text-white">{r.size}</td>
                    <td className="py-3 px-3 text-slate-300">{r.waist}</td>
                    <td className="py-3 px-3 text-slate-300">{r.length}</td>
                    <td className="py-3 px-3 text-slate-300">{r.hip}</td>
                    <td className="py-3 px-3 text-slate-300">{r.thigh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Measuring tips */}
          <div className="mt-5 p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-200">
            <span className="font-bold text-orange-400">💡 Fit Tip: </span>
            For a relaxed fit, order one size up. If you are between sizes, we recommend choosing the larger size for maximum comfort.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#071113] border-t border-[#16383D] text-xs text-slate-400">
          <span>Hassle-free 7-day size exchange available</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl transition cursor-pointer shadow-md"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
