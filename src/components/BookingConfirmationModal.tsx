import React from 'react';
import { CheckCircle2, Calendar, Clock, MapPin, User, Scissors, Download, Eye, X } from 'lucide-react';
import { Booking, Barber, ServiceItem, ShopInfo } from '../types';

interface BookingConfirmationModalProps {
  booking: Booking;
  barber: Barber | undefined;
  services: ServiceItem[];
  shopInfo: ShopInfo;
  onClose: () => void;
  onViewMyBookings: () => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  booking,
  barber,
  services,
  shopInfo,
  onClose,
  onViewMyBookings,
}) => {
  const formattedDate = new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Generate Google Calendar Link
  const createGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`Haircut Appointment with ${barber?.name || 'Barber'} at ${shopInfo.name}`);
    const details = encodeURIComponent(
      `Appointment at ${shopInfo.name}\nBarber: ${barber?.name}\nServices: ${services.map(s => s.name).join(', ')}\nTotal: R${booking.totalPrice}`
    );
    const location = encodeURIComponent(shopInfo.address);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-stone-900 border border-amber-500/40 rounded-2xl shadow-2xl p-6 text-stone-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold font-display text-stone-100">
            Booking Confirmed!
          </h3>
          <p className="text-xs text-stone-400">
            A confirmation message has been reserved under reference{' '}
            <span className="text-amber-400 font-mono font-bold">{booking.id}</span>.
          </p>
        </div>

        {/* Ticket Styled Card */}
        <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden mb-6 relative">
          <div className="bg-gradient-to-r from-amber-600/30 via-amber-500/20 to-amber-600/30 p-4 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-amber-400 -rotate-45" />
              <span className="font-display font-bold text-sm tracking-wide text-amber-200">
                {shopInfo.name}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900/90 text-amber-400 border border-amber-500/30">
              {booking.id}
            </span>
          </div>

          <div className="p-4 space-y-4 text-xs">
            {/* Barber info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={barber?.avatar}
                  alt={barber?.name}
                  className="w-10 h-10 rounded-full object-cover border border-stone-700"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="text-stone-400 text-[11px]">Assigned Barber</div>
                  <div className="text-stone-100 font-semibold text-sm">{barber?.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-stone-400 text-[11px]">Client</div>
                <div className="text-stone-200 font-semibold">{booking.clientName}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-stone-800/80">
              <div>
                <span className="text-stone-400 block mb-1">Appointment Date</span>
                <div className="flex items-center gap-1.5 text-stone-200 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>{formattedDate}</span>
                </div>
              </div>
              <div>
                <span className="text-stone-400 block mb-1">Scheduled Time</span>
                <div className="flex items-center gap-1.5 text-stone-200 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{booking.timeSlot} ({booking.totalDuration} min)</span>
                </div>
              </div>
            </div>

            {/* Services List */}
            <div>
              <span className="text-stone-400 block mb-1">Services Booked</span>
              <ul className="space-y-1">
                {services.map((s) => (
                  <li key={s.id} className="flex justify-between text-stone-300">
                    <span>• {s.name}</span>
                    <span className="text-stone-400 font-mono">R{s.price}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Total Price & Payment Method */}
            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between font-medium">
              <span className="text-stone-400">Payment ({booking.paymentMethod === 'shop' ? 'Pay at Shop' : booking.paymentMethod === 'card' ? 'Card / EFT' : 'Cash (ZAR)'})</span>
              <span className="text-base font-bold text-amber-400 font-display">R{booking.totalPrice}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-stone-400 pt-1">
              <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span className="truncate">{shopInfo.address}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <a
            href={createGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-stone-700 transition-colors"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Add to Google Calendar</span>
          </a>

          <button
            onClick={onViewMyBookings}
            className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>View All My Bookings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
