import React from 'react';
import { Star, Award, CheckCircle2, User } from 'lucide-react';
import { Barber } from '../types';

interface BarberSelectorProps {
  barbers: Barber[];
  selectedBarberId: string;
  onSelectBarber: (barberId: string) => void;
}

export const BarberSelector: React.FC<BarberSelectorProps> = ({
  barbers,
  selectedBarberId,
  onSelectBarber,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <span>1. Choose Your Barber</span>
            <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {barbers.length} Master Craftsmen
            </span>
          </h2>
          <p className="text-sm text-stone-400">
            Select a specialist or pick any available chair for faster scheduling.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {barbers.map((barber) => {
          const isSelected = selectedBarberId === barber.id;
          return (
            <div
              key={barber.id}
              id={`barber-card-${barber.id}`}
              onClick={() => onSelectBarber(barber.id)}
              className={`relative rounded-xl p-4 transition-all cursor-pointer border text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-950/20 border-amber-500 shadow-md ring-1 ring-amber-500'
                  : 'bg-stone-850/70 border-stone-800 hover:border-stone-700 hover:bg-stone-800/60'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 text-amber-500">
                  <CheckCircle2 className="w-5 h-5 fill-amber-500/20" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-3.5 mb-3">
                  <img
                    src={barber.avatar}
                    alt={barber.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-stone-700 shadow"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-semibold text-stone-100 text-base leading-tight">
                      {barber.name}
                    </h3>
                    <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                      {barber.role}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-stone-400 mt-1">
                      <span className="flex items-center text-amber-400 gap-0.5 font-semibold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {barber.rating}
                      </span>
                      <span>•</span>
                      <span>{barber.reviewsCount} reviews</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Award className="w-3 h-3 text-stone-400" />
                        {barber.experienceYears}y exp
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-stone-300 line-clamp-2 mb-3 italic">
                  "{barber.bio}"
                </p>
              </div>

              <div>
                <div className="text-[11px] font-medium text-stone-400 mb-1.5 uppercase tracking-wider">
                  Specialties
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {barber.specialties.map((spec) => (
                    <span
                      key={spec}
                      className={`text-[11px] px-2 py-0.5 rounded-md border ${
                        isSelected
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-stone-800 text-stone-300 border-stone-700/60'
                      }`}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
