import React from "react"
import type { Service, StaffMember } from "./types"

export const SALON_NAME = "Fade & Edge Barbershop"
export const SALON_ADDRESS = "15 Loader Street, De Waterkant, Cape Town, 8001"
export const SALON_MAPS_URL = "https://maps.google.com/?q=15+Loader+Street+De+Waterkant+Cape+Town"
export const SALON_PHONE = "011 555 0192"

export const MAX_ADVANCE_DAYS = 60      // how many days ahead customers may book
export const CLOSED_DAYS: number[] = [] // day-of-week indices (0=Sun … 6=Sat); empty = open every day
export const SLOT_HOLD_SECONDS = 10 * 60 // 10-minute reservation window for online payments

export const SERVICES: Service[] = [
  { id: "s1", name: "Classic Haircut",      description: "Precision cut, style and finish",        duration: 45, price: 150, category: "Haircuts" },
  { id: "s2", name: "Line-up and Edge",     description: "Sharp lines and clean fades only",        duration: 20, price: 80,  category: "Haircuts" },
  { id: "s3", name: "Kids Cut (Under 12)",  description: "Gentle cut for the little ones",          duration: 30, price: 100, category: "Haircuts" },
  { id: "s4", name: "Beard Trim and Shape", description: "Sculpted edges and hot towel finish",     duration: 30, price: 120, category: "Beard"    },
  { id: "s5", name: "Hot Towel Shave",      description: "Traditional straight-razor shave",        duration: 60, price: 200, category: "Shaving"  },
  { id: "s6", name: "Hair and Beard Combo", description: "Full cut plus beard sculpt",              duration: 75, price: 250, category: "Combos"   },
]

export const STAFF: StaffMember[] = [
  { id: "t1", name: "Themba Ndlovu",  role: "Master Barber",    photo: "photo-1507003211169-0a1dd7228f2d", nextAvailable: "09:00" },
  { id: "t2", name: "Devon Williams", role: "Senior Stylist",   photo: "photo-1472099645785-5658abf4ff4e", nextAvailable: "10:30" },
  { id: "t3", name: "Aisha Jacobs",   role: "Style Specialist", photo: "photo-1494790108377-be9c29b29330", nextAvailable: "11:00" },
  { id: "t4", name: "Ntombi Dlamini", role: "Senior Barber",    photo: "photo-1438761681033-6461ffad8d80", nextAvailable: "14:00" },
]

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

export const REMINDER_OPTIONS = [
  {
    id: "whatsapp" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
    label: "WhatsApp",
    desc: "Message sent to your WhatsApp number",
    badge: "Most popular",
  },
  {
    id: "sms" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
    label: "SMS",
    desc: "Text message reminder to your phone",
  },
  {
    id: "email" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    label: "Email",
    desc: "Reminder delivered to your inbox",
  },
  {
    id: "none" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
        <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
        <path d="M18 8a6 6 0 0 0-9.33-5" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ),
    label: "No reminder",
    desc: "Booking confirmed, no reminder sent",
  },
]
