import React, { useState } from 'react';
import { X, Calendar, Clock, User, Scissors, CheckCircle, ShieldCheck, CreditCard, Banknote, Store } from 'lucide-react';
import { Barber, ServiceItem, Booking } from '../types';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  barber: Barber;
  services: ServiceItem[];
  date: string;
  timeSlot: string;
  totalPrice: number;
  totalDuration: number;
  onConfirmBooking: (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => void;
}

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  barber,
  services,
  date,
  timeSlot,
  totalPrice,
  totalDuration,
  onConfirmBooking,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'shop' | 'card' | 'cash'>('shop');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setError('Please provide your name.');
      return;
    }
    if (!clientPhone.trim()) {
      setError('Please provide a contact phone number for SMS confirmation.');
      return;
    }

    setError('');
    setSubmitted(true);

    onConfirmBooking({
      barberId: barber.id,
      serviceIds: services.map((s) => s.id),
      date,
      timeSlot,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim() || `${clientName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      notes: notes.trim(),
      paymentMethod,
      totalPrice,
      totalDuration,
    });
  };

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 text-stone-100 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Scissors className="w-4 h-4 -rotate-45" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-display text-stone-100">
              Complete Your Reservation
            </h3>
            <p className="text-xs text-stone-400">
              Confirm appointment details and lock in your chair time.
            </p>
          </div>
        </div>

        {/* Appointment Recap Card */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 mb-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800/80">
            <div className="flex items-center gap-3">
              <img
                src={barber.avatar}
                alt={barber.name}
                className="w-10 h-10 rounded-full object-cover border border-stone-700"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="text-sm font-semibold text-stone-100">{barber.name}</div>
                <div className="text-xs text-amber-400">{barber.role}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-amber-400 font-display">R{totalPrice}</div>
              <div className="text-xs text-stone-400 flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" />
                {totalDuration} mins
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-stone-300">
              <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-stone-300">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{timeSlot}</span>
            </div>
          </div>

          <div className="text-xs pt-1">
            <span className="text-stone-400">Services: </span>
            <span className="text-stone-200 font-medium">
              {services.map((s) => s.name).join(', ')}
            </span>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-950/50 border border-red-500/40 text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="client-name-input"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Jordan Miller"
                className="w-full px-3 py-2 text-sm bg-stone-950 border border-stone-800 rounded-lg text-stone-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="client-phone-input"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="e.g. 082 123 4567 or +27 82 123 4567"
                className="w-full px-3 py-2 text-sm bg-stone-950 border border-stone-800 rounded-lg text-stone-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
              Email Address (For Calendar Invite)
            </label>
            <input
              type="email"
              id="client-email-input"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="e.g. yourname@example.co.za"
              className="w-full px-3 py-2 text-sm bg-stone-950 border border-stone-800 rounded-lg text-stone-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
              Barber Notes & Style Preferences
            </label>
            <textarea
              rows={2}
              id="client-notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 0.5mm skin fade, 10mm scissor trim on top, clean razor line-up..."
              className="w-full px-3 py-2 text-sm bg-stone-950 border border-stone-800 rounded-lg text-stone-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          {/* Payment Method Choice */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="payment-shop-btn"
                onClick={() => setPaymentMethod('shop')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === 'shop'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Pay at Shop</span>
              </button>

              <button
                type="button"
                id="payment-card-btn"
                onClick={() => setPaymentMethod('card')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Card / EFT</span>
              </button>

              <button
                type="button"
                id="payment-cash-btn"
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash (ZAR)</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="submit-booking-btn"
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm & Book Appointment (R{totalPrice})</span>
            </button>
            <p className="text-[11px] text-stone-500 text-center mt-2 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Free cancellation up to 2 hours before scheduled chair time.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
