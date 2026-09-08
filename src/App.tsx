import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroHeader } from './components/HeroHeader';
import { BarberSelector } from './components/BarberSelector';
import { ServiceSelector } from './components/ServiceSelector';
import { DateTimeSelector } from './components/DateTimeSelector';
import { BookingSummaryStickyBar } from './components/BookingSummaryStickyBar';
import { BookingFormModal } from './components/BookingFormModal';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';
import { MyBookingsView } from './components/MyBookingsView';
import { BarberScheduleView } from './components/BarberScheduleView';
import { SHOP_INFO, BARBERS, SERVICES, INITIAL_BOOKINGS, getTodayDateString } from './data/mockData';
import { Booking } from './types';

export function App() {
  const [activeView, setActiveView] = useState<'book' | 'my-bookings' | 'schedule'>('book');

  // Persistent bookings from LocalStorage with initial fallback
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem('bookyourbarber_bookings_zar');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_BOOKINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('bookyourbarber_bookings_zar', JSON.stringify(bookings));
    } catch {
      // ignore
    }
  }, [bookings]);

  // Booking Flow State
  const [selectedBarberId, setSelectedBarberId] = useState<string>(BARBERS[0].id);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([SERVICES[0].id]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString(0));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:00 AM');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const selectedBarber = BARBERS.find((b) => b.id === selectedBarberId);
  const selectedServices = SERVICES.filter((s) => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(serviceId)) {
        // Keep at least one or allow unselecting
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleCreateBooking = (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: `BK-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);
    setIsFormModalOpen(false);
    setConfirmedBooking(newBooking);
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    );
  };

  const handleUpdateBookingStatus = (bookingId: string, status: Booking['status']) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col selection:bg-amber-500 selection:text-stone-950 font-sans">
      {/* Navigation Header */}
      <Navbar
        shopInfo={SHOP_INFO}
        activeView={activeView}
        onSelectView={setActiveView}
        bookingCount={bookings.filter((b) => b.status === 'confirmed').length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeView === 'book' && (
          <div className="space-y-10 pb-20">
            {/* Hero Banner with Shop Highlights */}
            <HeroHeader
              shopInfo={SHOP_INFO}
              onQuickBookClick={() => {
                const el = document.getElementById('step-barber-select');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Step 1: Select Barber */}
            <section id="step-barber-select">
              <BarberSelector
                barbers={BARBERS}
                selectedBarberId={selectedBarberId}
                onSelectBarber={setSelectedBarberId}
              />
            </section>

            {/* Step 2: Select Services */}
            <section id="step-service-select">
              <ServiceSelector
                services={SERVICES}
                selectedServiceIds={selectedServiceIds}
                onToggleService={handleToggleService}
              />
            </section>

            {/* Step 3: Date & Time Picker */}
            <section id="step-datetime-select">
              <DateTimeSelector
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                selectedTimeSlot={selectedTimeSlot}
                onSelectTimeSlot={setSelectedTimeSlot}
                selectedBarber={selectedBarber}
                existingBookings={bookings}
              />
            </section>

            {/* Bottom sticky reservation summary bar */}
            <BookingSummaryStickyBar
              selectedBarber={selectedBarber}
              selectedServices={selectedServices}
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
              onProceedToDetails={() => setIsFormModalOpen(true)}
            />
          </div>
        )}

        {activeView === 'my-bookings' && (
          <MyBookingsView
            bookings={bookings}
            barbers={BARBERS}
            services={SERVICES}
            shopInfo={SHOP_INFO}
            onCancelBooking={handleCancelBooking}
            onNewBookingClick={() => setActiveView('book')}
          />
        )}

        {activeView === 'schedule' && (
          <BarberScheduleView
            barbers={BARBERS}
            bookings={bookings}
            services={SERVICES}
            onUpdateBookingStatus={handleUpdateBookingStatus}
          />
        )}
      </main>

      {/* Booking Form Modal */}
      {selectedBarber && (
        <BookingFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          barber={selectedBarber}
          services={selectedServices}
          date={selectedDate}
          timeSlot={selectedTimeSlot}
          totalPrice={totalPrice}
          totalDuration={totalDuration}
          onConfirmBooking={handleCreateBooking}
        />
      )}

      {/* Booking Confirmation Ticket Modal */}
      {confirmedBooking && (
        <BookingConfirmationModal
          booking={confirmedBooking}
          barber={BARBERS.find((b) => b.id === confirmedBooking.barberId)}
          services={SERVICES.filter((s) => confirmedBooking.serviceIds.includes(s.id))}
          shopInfo={SHOP_INFO}
          onClose={() => setConfirmedBooking(null)}
          onViewMyBookings={() => {
            setConfirmedBooking(null);
            setActiveView('my-bookings');
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-stone-950 py-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold text-stone-300">BookYourBarber</span>
            <span>•</span>
            <span>{SHOP_INFO.name}</span>
          </div>

          <div className="flex items-center gap-4 text-stone-400">
            <span>{SHOP_INFO.address}</span>
            <span>•</span>
            <span>{SHOP_INFO.phone}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
