export type ServiceCategory = 'all' | 'haircuts' | 'beards' | 'combos' | 'treatments';

export interface ServiceItem {
  id: string;
  name: string;
  category: 'haircuts' | 'beards' | 'combos' | 'treatments';
  durationMinutes: number;
  price: number;
  description: string;
  popular?: boolean;
}

export interface Barber {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  experienceYears: number;
  specialties: string[];
  bio: string;
  availableDays: number[]; // 0 for Sun, 1 for Mon, etc.
}

export interface Booking {
  id: string;
  barberId: string;
  serviceIds: string[];
  date: string; // YYYY-MM-DD
  timeSlot: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes?: string;
  paymentMethod: 'shop' | 'card' | 'cash';
  status: 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  totalDuration: number;
  createdAt: string;
}

export interface ShopInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  hours: string;
  rating: number;
  reviewsCount: number;
}
