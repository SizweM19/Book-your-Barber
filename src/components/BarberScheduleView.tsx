import React, { useState } from 'react';
import { Barber, Booking, ServiceItem } from '../types';
import { Calendar, Clock, DollarSign, User, CheckCircle2, XCircle, Phone, FileText } from 'lucide-react';

interface BarberScheduleViewProps {
  barbers: Barber[];
  bookings: Booking[];
  services: ServiceItem[];
  onUpdateBookingStatus: (bookingId: string, status: Booking['status']) => void;
}

export const BarberScheduleView: React.FC<BarberScheduleViewProps> = ({
  barbers,
  bookings,
  services,
  onUpdateBookingStatus,
}) => {
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const getBarber = (id: string) => barbers.find((b) => b.id === id);
  const getServices = (ids: string[]) => services.filter((s) => ids.includes(s.id));

  // Filter bookings by barber & date
  const scheduleBookings = bookings.filter((b) => {
    const matchesBarber = selectedBarberId === 'all' || b.barberId === selectedBarberId;
    const matchesDate = !selectedDate || b.date === selectedDate;
    return matchesBarber && matchesDate;
  }).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  // Daily statistics
  const activeBookings = scheduleBookings.filter((b) => b.status !== 'cancelled');
  const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const completedCount = scheduleBookings.filter((b) => b.status === 'completed').length;
  const confirmedCount = scheduleBookings.filter((b) => b.status === 'confirmed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-stone-100 flex items-center gap-2">
            <span>Barber Roster & Daily Schedule</span>
            <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Staff Portal
            </span>
          </h2>
          <p className="text-sm text-stone-400 mt-0.5">
            Real-time chair queue, appointment management, and daily turnover stats.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-400 font-medium">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
          <div className="text-xs text-stone-400">Total Bookings</div>
          <div className="text-2xl font-bold text-stone-100 mt-1">{scheduleBookings.length}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">{confirmedCount} active in queue</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
          <div className="text-xs text-stone-400">Completed Cuts</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5">Ready for review</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
          <div className="text-xs text-stone-400">Projected Revenue</div>
          <div className="text-2xl font-bold text-amber-400 font-display mt-1">R{totalRevenue}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">For selected day</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
          <div className="text-xs text-stone-400">Active Barbers</div>
          <div className="text-2xl font-bold text-stone-100 mt-1">{barbers.length}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Fully staffed</div>
        </div>
      </div>

      {/* Barber Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedBarberId('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
            selectedBarberId === 'all'
              ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold'
              : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
          }`}
        >
          All Chairs ({scheduleBookings.length})
        </button>

        {barbers.map((barber) => {
          const barberBookingCount = bookings.filter(
            (b) => b.barberId === barber.id && b.date === selectedDate
          ).length;
          return (
            <button
              key={barber.id}
              onClick={() => setSelectedBarberId(barber.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border flex items-center gap-1.5 ${
                selectedBarberId === barber.id
                  ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              <span>{barber.name.split(' ')[0]}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedBarberId === barber.id ? 'bg-stone-950 text-amber-400' : 'bg-stone-800 text-stone-300'
              }`}>
                {barberBookingCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Schedule Table / Cards */}
      {scheduleBookings.length === 0 ? (
        <div className="text-center py-16 px-4 bg-stone-900/60 border border-stone-800 rounded-2xl space-y-3">
          <Calendar className="w-10 h-10 text-stone-600 mx-auto" />
          <h4 className="text-base font-semibold text-stone-300">No scheduled appointments for this day</h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            All chairs are open. New bookings created by clients will instantly show up in this timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scheduleBookings.map((b) => {
            const barber = getBarber(b.barberId);
            const bookedServices = getServices(b.serviceIds);

            return (
              <div
                key={b.id}
                className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors hover:border-stone-700"
              >
                <div className="flex items-center gap-4">
                  {/* Time Badge */}
                  <div className="w-20 text-center py-2 px-2 bg-stone-950 rounded-lg border border-stone-800 shrink-0">
                    <div className="text-xs font-bold text-amber-400 font-mono">{b.timeSlot}</div>
                    <div className="text-[10px] text-stone-500">{b.totalDuration}m</div>
                  </div>

                  {/* Client and Barber info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-stone-100 text-sm">{b.clientName}</h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-800 text-stone-400">
                        {b.id}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400 mt-1">
                      <span className="flex items-center gap-1 text-stone-300">
                        <User className="w-3 h-3 text-amber-500" />
                        Chair: {barber?.name}
                      </span>
                      <span>•</span>
                      <a href={`tel:${b.clientPhone}`} className="flex items-center gap-1 text-stone-400 hover:text-amber-400">
                        <Phone className="w-3 h-3" />
                        {b.clientPhone}
                      </a>
                    </div>

                    <div className="text-xs text-stone-300 mt-1.5 font-medium">
                      Services: {bookedServices.map(s => s.name).join(', ')}
                    </div>

                    {b.notes && (
                      <div className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
                        <FileText className="w-3 h-3 shrink-0" />
                        <span className="italic">"{b.notes}"</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price and Status Controls */}
                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-stone-800">
                  <div className="text-left md:text-right">
                    <div className="text-base font-bold text-amber-400 font-display">R{b.totalPrice}</div>
                    <div className="text-[10px] text-stone-500 capitalize">{b.paymentMethod === 'shop' ? 'Pay in shop' : b.paymentMethod === 'card' ? 'Card / EFT' : 'Cash (ZAR)'}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => onUpdateBookingStatus(b.id, 'completed')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>
                    )}

                    {b.status === 'completed' && (
                      <span className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                        Completed
                      </span>
                    )}

                    {b.status !== 'cancelled' ? (
                      <button
                        onClick={() => onUpdateBookingStatus(b.id, 'cancelled')}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-red-950/40 text-stone-400 hover:text-red-300 hover:border-red-500/30 border border-stone-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-semibold">
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
