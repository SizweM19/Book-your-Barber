import React from 'react';
import { Scissors, Calendar, UserCheck, Clock, MapPin, Sparkles } from 'lucide-react';
import { ShopInfo } from '../types';

interface NavbarProps {
  shopInfo: ShopInfo;
  activeView: 'book' | 'my-bookings' | 'schedule';
  onSelectView: (view: 'book' | 'my-bookings' | 'schedule') => void;
  bookingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  shopInfo,
  activeView,
  onSelectView,
  bookingCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur border-b border-stone-800 text-stone-100">
      {/* Top micro-bar */}
      <div className="hidden md:flex justify-between items-center px-4 lg:px-8 py-1.5 text-xs text-stone-400 bg-stone-950 border-b border-stone-800/60">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            {shopInfo.address}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {shopInfo.hours}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-medium">★ {shopInfo.rating} ({shopInfo.reviewsCount} reviews)</span>
          <span className="text-stone-600">|</span>
          <a href={`tel:${shopInfo.phone}`} className="hover:text-amber-400 transition-colors">
            {shopInfo.phone}
          </a>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button
          onClick={() => onSelectView('book')}
          className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
            <Scissors className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <div className="font-display text-lg sm:text-xl font-bold tracking-tight text-stone-100 group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
              BookYourBarber
              <span className="text-xs font-sans px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold tracking-normal">PRO</span>
            </div>
            <p className="text-xs text-stone-400 -mt-0.5 hidden sm:block">{shopInfo.name}</p>
          </div>
        </button>

        {/* View Switchers */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="nav-book-btn"
            onClick={() => onSelectView('book')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'book'
                ? 'bg-amber-500 text-stone-950 shadow-md font-semibold'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Book Now</span>
          </button>

          <button
            id="nav-bookings-btn"
            onClick={() => onSelectView('my-bookings')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 relative cursor-pointer ${
              activeView === 'my-bookings'
                ? 'bg-amber-500 text-stone-950 shadow-md font-semibold'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>My Bookings</span>
            {bookingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeView === 'my-bookings'
                  ? 'bg-stone-950 text-amber-400'
                  : 'bg-amber-500 text-stone-950'
              }`}>
                {bookingCount}
              </span>
            )}
          </button>

          <button
            id="nav-schedule-btn"
            onClick={() => onSelectView('schedule')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'schedule'
                ? 'bg-amber-500 text-stone-950 shadow-md font-semibold'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Barber Roster</span>
            <span className="sm:hidden">Roster</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
