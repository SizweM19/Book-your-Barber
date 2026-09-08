import React from 'react';
import { Barber, ServiceItem } from '../types';
import { Clock, ArrowRight, CheckCircle } from 'lucide-react';

interface BookingSummaryStickyBarProps {
  selectedBarber: Barber | undefined;
  selectedServices: ServiceItem[];
  selectedDate: string;
  selectedTimeSlot: string;
  onProceedToDetails: () => void;
}

export const BookingSummaryStickyBar: React.FC<BookingSummaryStickyBarProps> = ({
  selectedBarber,
  selectedServices,
  selectedDate,
  selectedTimeSlot,
  onProceedToDetails,
}) => {
  const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);
  const totalDuration = selectedServices.reduce((acc, s) => acc + s.durationMinutes, 0);

  const isReady =
    selectedBarber &&
    selectedServices.length > 0 &&
    Boolean(selectedDate) &&
    Boolean(selectedTimeSlot);

  return (
    <div className="sticky bottom-0 z-30 bg-stone-950/95 backdrop-blur-md border-t border-stone-800 p-4 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left Side: Summary overview */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {selectedBarber && (
            <img
              src={selectedBarber.avatar}
              alt={selectedBarber.name}
              className="w-10 h-10 rounded-full object-cover border border-amber-500/40 hidden sm:block shrink-0"
              referrerPolicy="no-referrer"
            />
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-stone-300">
              <span className="font-semibold text-stone-100">
                {selectedBarber ? selectedBarber.name : 'Select Barber'}
              </span>
              <span>•</span>
              <span>{selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'}</span>
              {selectedTimeSlot && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-medium">{selectedTimeSlot}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 mt-0.5">
              <div className="text-xl font-bold text-amber-400 font-display">
                R{totalPrice}
              </div>
              <div className="flex items-center gap-1 text-xs text-stone-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{totalDuration} mins estimated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Primary CTA */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          {!isReady && (
            <span className="text-xs text-stone-400 hidden md:inline">
              {!selectedServices.length
                ? 'Select at least 1 service'
                : !selectedTimeSlot
                ? 'Select an open time slot'
                : 'Complete selections to proceed'}
            </span>
          )}

          <button
            id="proceed-booking-btn"
            disabled={!isReady}
            onClick={onProceedToDetails}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
              isReady
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 ring-2 ring-amber-400/50 transform active:scale-98'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
            }`}
          >
            <span>Proceed to Reservation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
