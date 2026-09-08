import React from 'react';
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { TIME_SLOTS } from '../data/mockData';
import { Barber, Booking } from '../types';

interface DateTimeSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  selectedTimeSlot: string;
  onSelectTimeSlot: (slot: string) => void;
  selectedBarber: Barber | undefined;
  existingBookings: Booking[];
}

export const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  selectedDate,
  onSelectDate,
  selectedTimeSlot,
  onSelectTimeSlot,
  selectedBarber,
  existingBookings,
}) => {
  // Generate next 14 days
  const daysList = Array.from({ length: 14 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay(); // 0 for Sun, 1 for Mon...
    const dayName = idx === 0 ? 'Today' : idx === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Check if barber is available on this day of week
    const isBarberAvailable = selectedBarber ? selectedBarber.availableDays.includes(dayOfWeek) : true;
    
    return {
      dateStr,
      dayName,
      monthDay,
      dayOfWeek,
      isBarberAvailable,
    };
  });

  // Check booked slots for this barber & date
  const bookedSlots = existingBookings
    .filter((b) => b.barberId === selectedBarber?.id && b.date === selectedDate && b.status !== 'cancelled')
    .map((b) => b.timeSlot);

  // Group slots into Morning (< 12:00 PM), Afternoon (12:00 PM - 04:00 PM), Evening (>= 04:00 PM)
  const isMorning = (slot: string) => slot.includes('AM');
  const isAfternoon = (slot: string) => {
    if (!slot.includes('PM')) return false;
    const hour = parseInt(slot.split(':')[0], 10);
    return hour === 12 || hour < 4;
  };
  const isEvening = (slot: string) => {
    if (!slot.includes('PM')) return false;
    const hour = parseInt(slot.split(':')[0], 10);
    return hour >= 4 && hour !== 12;
  };

  const currentDayInfo = daysList.find((d) => d.dateStr === selectedDate);
  const isDayOff = currentDayInfo ? !currentDayInfo.isBarberAvailable : false;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
          <span>3. Choose Date & Time</span>
          {selectedDate && selectedTimeSlot && (
            <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {selectedTimeSlot}
            </span>
          )}
        </h2>
        <p className="text-sm text-stone-400">
          Pick your preferred day and available chair time slot.
        </p>
      </div>

      {/* Date Horizon Slider */}
      <div>
        <div className="text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />
          <span>Available Dates</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {daysList.map((day) => {
            const isSelected = selectedDate === day.dateStr;
            return (
              <button
                key={day.dateStr}
                id={`date-btn-${day.dateStr}`}
                onClick={() => onSelectDate(day.dateStr)}
                disabled={!day.isBarberAvailable}
                className={`shrink-0 flex flex-col items-center justify-center min-w-[76px] py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                  !day.isBarberAvailable
                    ? 'opacity-40 bg-stone-900 border-stone-800 cursor-not-allowed'
                    : isSelected
                    ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-md font-semibold ring-2 ring-amber-400/50'
                    : 'bg-stone-850/80 border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-stone-800'
                }`}
              >
                <span className="text-[11px] font-medium uppercase tracking-wider">
                  {day.dayName}
                </span>
                <span className="text-base font-bold my-0.5">
                  {day.monthDay.split(' ')[1]}
                </span>
                <span className="text-[10px] opacity-80">
                  {day.monthDay.split(' ')[0]}
                </span>
                {!day.isBarberAvailable && (
                  <span className="text-[9px] text-red-400 font-medium mt-1">
                    Off
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots Area */}
      {isDayOff ? (
        <div className="p-6 rounded-xl bg-stone-850/80 border border-stone-800 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-base font-semibold text-stone-200">
            {selectedBarber?.name || 'Selected barber'} is off on this date
          </h4>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Please choose another date or switch to another barber to view open appointment slots.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Select Time Slot</span>
          </div>

          <div className="space-y-3">
            {/* Morning */}
            <div>
              <div className="text-[11px] font-medium text-stone-400 mb-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Morning (9:00 AM – 12:00 PM)</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {TIME_SLOTS.filter(isMorning).map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = selectedTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      id={`time-slot-${slot.replace(/[^a-zA-Z0-9]/g, '')}`}
                      disabled={isBooked}
                      onClick={() => onSelectTimeSlot(slot)}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isBooked
                          ? 'bg-stone-900/60 border-stone-800 text-stone-600 line-through cursor-not-allowed'
                          : isSelected
                          ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm ring-1 ring-amber-400'
                          : 'bg-stone-850 border-stone-800 text-stone-200 hover:border-amber-500/50 hover:bg-stone-800'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Afternoon */}
            <div>
              <div className="text-[11px] font-medium text-stone-400 mb-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Afternoon (12:00 PM – 4:00 PM)</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {TIME_SLOTS.filter(isAfternoon).map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = selectedTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      id={`time-slot-${slot.replace(/[^a-zA-Z0-9]/g, '')}`}
                      disabled={isBooked}
                      onClick={() => onSelectTimeSlot(slot)}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isBooked
                          ? 'bg-stone-900/60 border-stone-800 text-stone-600 line-through cursor-not-allowed'
                          : isSelected
                          ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm ring-1 ring-amber-400'
                          : 'bg-stone-850 border-stone-800 text-stone-200 hover:border-amber-500/50 hover:bg-stone-800'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Evening */}
            <div>
              <div className="text-[11px] font-medium text-stone-400 mb-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                <span>Evening (4:00 PM – 7:00 PM)</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {TIME_SLOTS.filter(isEvening).map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = selectedTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      id={`time-slot-${slot.replace(/[^a-zA-Z0-9]/g, '')}`}
                      disabled={isBooked}
                      onClick={() => onSelectTimeSlot(slot)}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isBooked
                          ? 'bg-stone-900/60 border-stone-800 text-stone-600 line-through cursor-not-allowed'
                          : isSelected
                          ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm ring-1 ring-amber-400'
                          : 'bg-stone-850 border-stone-800 text-stone-200 hover:border-amber-500/50 hover:bg-stone-800'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
