import { Barber, ServiceItem, ShopInfo, Booking } from '../types';

export const SHOP_INFO: ShopInfo = {
  name: "The Royal Crown Barbershop",
  tagline: "Master craftsmanship, timeless precision, and modern South African gentleman's grooming.",
  address: "84 Kloof Street, Gardens, Cape Town, 8001",
  phone: "+27 (0)21 422 9901",
  hours: "Tue - Sat: 08:30 – 18:30 • Sun: 09:00 – 15:00",
  rating: 4.96,
  reviewsCount: 412,
};

export const BARBERS: Barber[] = [
  {
    id: "barber-1",
    name: "Sizwe 'The Blade' Khumalo",
    role: "Head Master Barber & Founder",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&auto=format&fit=crop&q=80",
    rating: 4.98,
    reviewsCount: 194,
    experienceYears: 12,
    specialties: ["0.5mm Skin Fades", "Straight Razor Shaves", "Precision Line-Ups"],
    bio: "Passionate about traditional barbershop culture with contemporary street flair. Known for surgical metric tapers and razor-sharp perimeter lines.",
    availableDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
  },
  {
    id: "barber-2",
    name: "Liam van der Merwe",
    role: "Senior Stylist & Texture Specialist",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80",
    rating: 4.93,
    reviewsCount: 128,
    experienceYears: 9,
    specialties: ["Scissor Work", "Textured Crops", "Beard Sculpting", "Taper Fades"],
    bio: "Scissor artisan specializing in graduated shear cuts, natural flow styling, and bespoke beard maintenance.",
    availableDays: [2, 3, 4, 5, 6, 0], // Tue-Sun
  },
  {
    id: "barber-3",
    name: "Tariq Hendricks",
    role: "Precision Fade & Beard Artist",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80",
    rating: 4.95,
    reviewsCount: 106,
    experienceYears: 7,
    specialties: ["Chiskop / Razor Clean", "Low/Mid Skin Fades", "Hot Steam Shaves"],
    bio: "High-energy barbering perfectionist. Sharp geometric lines and seamless zero-foil transitions are Tariq's hallmark.",
    availableDays: [1, 2, 4, 5, 6], // Mon, Tue, Thu-Sat
  }
];

export const SERVICES: ServiceItem[] = [
  {
    id: "srv-fade",
    name: "Signature Skin Fade & Style",
    category: "haircuts",
    durationMinutes: 45,
    price: 220,
    description: "Zero/0.5mm foil skin fade with shear texturizing on top, metric neck razor clean-up, and styled with premium matte pomade.",
    popular: true,
  },
  {
    id: "srv-classic",
    name: "Classic Gentleman's Scissor Cut",
    category: "haircuts",
    durationMinutes: 40,
    price: 190,
    description: "Timeless tapered scissor cut with neck razor finish, revitalizing herbal tonic, and blow-dry styling.",
    popular: false,
  },
  {
    id: "srv-buzz",
    name: "Executive Buzz & Edge-Up",
    category: "haircuts",
    durationMinutes: 25,
    price: 150,
    description: "Even clipper cut with 3mm - 6mm uniform length, sharp straight razor perimeter edge-up, and scalp refresher.",
    popular: false,
  },
  {
    id: "srv-chiskop",
    name: "Smooth Chiskop (Razor Head Shave)",
    category: "haircuts",
    durationMinutes: 30,
    price: 160,
    description: "Traditional hot lather head shave with straight razor pass, soothing tea-tree cold towel, and scalp moisturizing balm.",
    popular: true,
  },
  {
    id: "srv-beard-trim",
    name: "Sculpted Beard Trim & Shape",
    category: "beards",
    durationMinutes: 30,
    price: 150,
    description: "Precision clipper and shear shaping, hot steam towel, cheek straight razor alignment, and 30ml Marula beard oil finish.",
    popular: true,
  },
  {
    id: "srv-hot-shave",
    name: "Royal Hot Towel Straight Razor Shave",
    category: "beards",
    durationMinutes: 40,
    price: 190,
    description: "Dual hot lather shave with eucalyptus pre-shave oil, straight razor pass, chilled towel compress, and calming aftershave.",
    popular: false,
  },
  {
    id: "srv-combo-royal",
    name: "The Full Lekker Combo (Cut + Beard)",
    category: "combos",
    durationMinutes: 70,
    price: 340,
    description: "Full haircut of choice, complete beard sculpt or hot towel shave, hair wash, 5-minute pressure point scalp massage, and styling.",
    popular: true,
  },
  {
    id: "srv-combo-father-son",
    name: "Father & Son Duet",
    category: "combos",
    durationMinutes: 65,
    price: 370,
    description: "Two haircuts back-to-back with styling, razor neck clean-up for the gent, and gentle clipper cut for the young gentleman.",
    popular: false,
  },
  {
    id: "srv-scalp-spa",
    name: "Deep Cleansing Scalp Detox & Wash",
    category: "treatments",
    durationMinutes: 20,
    price: 120,
    description: "South African Rooibos & tea-tree exfoliating scalp scrub, clarifying shampoo wash, and head massage.",
    popular: false,
  },
  {
    id: "srv-black-mask",
    name: "Charcoal Face Mask & Steam Clean",
    category: "treatments",
    durationMinutes: 20,
    price: 130,
    description: "Deep pore peel-off activated charcoal mask, facial steamer session, and refreshing cold splash moisturizer.",
    popular: false,
  }
];

export const TIME_SLOTS: string[] = [
  "08:30 AM",
  "09:15 AM",
  "10:00 AM",
  "10:45 AM",
  "11:30 AM",
  "12:15 PM",
  "01:00 PM",
  "01:45 PM",
  "02:30 PM",
  "03:15 PM",
  "04:00 PM",
  "04:45 PM",
  "05:30 PM",
];

// Helper to get today's date formatted as YYYY-MM-DD
export function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "bk-101",
    barberId: "barber-1",
    serviceIds: ["srv-fade", "srv-beard-trim"],
    date: getTodayDateString(0),
    timeSlot: "10:00 AM",
    clientName: "Thabo Mokoena",
    clientPhone: "082 345 8891",
    clientEmail: "thabo.m@example.co.za",
    notes: "Low 0.5mm skin taper, keep the moustache natural with clean line-up.",
    paymentMethod: "shop",
    status: "confirmed",
    totalPrice: 370,
    totalDuration: 75,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bk-102",
    barberId: "barber-2",
    serviceIds: ["srv-classic"],
    date: getTodayDateString(0),
    timeSlot: "01:00 PM",
    clientName: "Dylan Coetzee",
    clientPhone: "071 984 1290",
    clientEmail: "dylan.c@example.co.za",
    notes: "Parted to the left, scissors only, about 15mm off the top.",
    paymentMethod: "card",
    status: "confirmed",
    totalPrice: 190,
    totalDuration: 40,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bk-103",
    barberId: "barber-1",
    serviceIds: ["srv-combo-royal"],
    date: getTodayDateString(1),
    timeSlot: "11:30 AM",
    clientName: "Kagiso Molefe",
    clientPhone: "083 412 3412",
    clientEmail: "kagiso.m@example.co.za",
    notes: "First time at the shop! Keen for the Full Lekker combo.",
    paymentMethod: "cash",
    status: "confirmed",
    totalPrice: 340,
    totalDuration: 70,
    createdAt: new Date().toISOString(),
  }
];
