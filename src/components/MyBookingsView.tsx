import React, { useState } from 'react';
import { Calendar, Clock, User, Scissors, XCircle, CheckCircle2, Search, AlertTriangle, ArrowRight } from 'lucide-react';
import { Booking, Barber, ServiceItem, ShopInfo } from '../types';

interface MyBookingsViewProps {
  bookings: Booking[];
  barbers: Barber[];
  services: ServiceItem[];
  shopInfo: ShopInfo;
  onCancelBooking: (bookingId: string) => void;
  onNewBookingClick: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  bookings,
  barbers,
  services,
  shopInfo,
  onCancelBooking,
  onNewBookingClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const getBarber = (id: string) => barbers.find((b) => b.id === id);
  const getServices = (ids: string[]) => services.filter((s) => ids.includes(s.id));

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.clientPhone.includes(searchTerm);

    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-stone-100 flex items-center gap-2">
            <span>My Appointments</span>
            <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {bookings.length} Total
            </span>
          </h2>
          <p className="text-sm text-stone-400 mt-0.5">
            Review your upcoming visits, manage appointments, or book a new slot.
          </p>
        </div>

        <button
          onClick={onNewBookingClick}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Scissors className="w-4 h-4 -rotate-45" />
          <span>Book New Appointment</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            id="bookings-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone or reference ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {(['all', 'confirmed', 'completed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer border ${
                filterStatus === status
                  ? 'bg-stone-100 text-stone-900 border-stone-100 font-semibold'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 px-4 bg-stone-900/60 border border-stone-800 rounded-2xl space-y-4">
          <Calendar className="w-10 h-10 text-stone-600 mx-auto" />
          <h3 className="text-lg font-semibold text-stone-300">No appointments found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchTerm || filterStatus !== 'all'
              ? 'No appointments match your active search or status filters.'
              : 'You have not booked any appointments yet. Secure your chair with your favorite barber today!'}
          </p>
          <button
            onClick={onNewBookingClick}
            className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Book Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredBookings.map((b) => {
            const barber = getBarber(b.barberId);
            const bookedServices = getServices(b.serviceIds);
            const isConfirmed = b.status === 'confirmed';
            const isCancelled = b.status === 'cancelled';
            const isCompleted = b.status === 'completed';

            const formattedDate = new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={b.id}
                id={`booking-item-${b.id}`}
                className="bg-stone-900 border border-stone-800 rounded-xl p-4 sm:p-5 transition-all hover:border-stone-700 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800/80">
                  <div className="flex items-center gap-3">
                    <img
                      src={barber?.avatar}
                      alt={barber?.name}
                      className="w-12 h-12 rounded-full object-cover border border-stone-700"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-stone-100 text-base">
                          {barber?.name || 'Barber'}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-800 text-amber-400 border border-stone-700">
                          {b.id}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400">{barber?.role}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isConfirmed && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirmed
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/60 text-red-400 border border-red-500/30 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelled
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-400 border border-blue-500/30">
                        Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-stone-400 block">Date & Time</span>
                    <div className="flex items-center gap-1.5 text-stone-200 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-200 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{b.timeSlot} ({b.totalDuration} min)</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-stone-400 block">Services ({bookedServices.length})</span>
                    <div className="text-stone-200 font-medium">
                      {bookedServices.map((s) => s.name).join(', ')}
                    </div>
                    <div className="text-amber-400 font-bold font-display text-sm">
                      Total: R{b.totalPrice} ({b.paymentMethod === 'shop' ? 'Pay at Shop' : b.paymentMethod === 'card' ? 'Card / EFT' : 'Cash (ZAR)'})
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-stone-400 block">Client Contact</span>
                    <div className="text-stone-200 font-medium">{b.clientName}</div>
                    <div className="text-stone-400">{b.clientPhone}</div>
                    {b.notes && (
                      <div className="text-[11px] text-stone-400 italic">
                        Notes: "{b.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {isConfirmed && (
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-800/80">
                    {confirmCancelId === b.id ? (
                      <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/40 p-2 rounded-lg text-xs">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-red-200">Cancel this appointment?</span>
                        <button
                          onClick={() => {
                            onCancelBooking(b.id);
                            setConfirmCancelId(null);
                          }}
                          className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer transition-colors"
                        >
                          Yes, Cancel
                        </button>
                        <button
                          onClick={() => setConfirmCancelId(null)}
                          className="px-2.5 py-1 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 cursor-pointer transition-colors"
                        >
                          Keep
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancelId(b.id)}
                        className="px-3 py-1.5 rounded-lg text-xs text-stone-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
                      >
                        Cancel Appointment
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
