import React from 'react';
import { Scissors, Star, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { ShopInfo } from '../types';

interface HeroHeaderProps {
  shopInfo: ShopInfo;
  onQuickBookClick: () => void;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({ shopInfo, onQuickBookClick }) => {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 mb-8">
      {/* Background with ambient glow and subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-900/90 to-amber-950/20 z-0" />
      <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Grooming & Classic Barbering</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-stone-100 leading-tight">
            Book Your Chair. <br className="hidden sm:inline" />
            <span className="text-amber-400 italic">Experience Pure Precision.</span>
          </h1>

          <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-xl">
            {shopInfo.tagline} Choose your preferred master barber, explore tailored haircut & beard packages, and schedule in seconds.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-stone-400">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-stone-200 font-bold">{shopInfo.rating}</span>
              <span>({shopInfo.reviewsCount} verified clients)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-stone-300">Sanitized tools & warm towel service</span>
            </div>
          </div>
        </div>

        {/* Quick Highlights Box */}
        <div className="w-full md:w-auto bg-stone-900/90 border border-stone-800/90 rounded-xl p-4 sm:p-5 text-xs space-y-3 shrink-0 backdrop-blur-sm">
          <div className="font-semibold text-stone-200 uppercase tracking-wider text-[11px] pb-1 border-b border-stone-800">
            Shop Information
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2 text-stone-300">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium block text-stone-200">{shopInfo.name}</span>
                <span className="text-stone-400 text-[11px]">{shopInfo.address}</span>
              </div>
            </div>

            <div className="text-[11px] text-stone-400 pt-1">
              <span className="text-amber-400 font-medium">Walk-ins Welcome</span> • Appointments prioritized
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
