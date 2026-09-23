import type { SalonEntity } from "@byb/database"

type Step =
  | "salon" | "service" | "staff" | "date" | "time"
  | "info" | "reminder" | "summary"
  | "paymentMethod" | "payment"
  | "paymentSuccessProcessing" | "paymentDuplicate"
  | "paymentFailed" | "confirmed" | "notificationFailure"
  | "unavailable" | "slotHoldExpired"
  | "fullyBooked" | "staffUnavailable" | "serviceUnavailable" | "salonUnavailable"
  | "bookingLookup" | "bookingDetails"
  | "rescheduleSuccess" | "rescheduleFailure"
  | "cancellationReview" | "cancellationConfirmed"
  | "salonCancelled"
  | "refundProcessing" | "refundCompleted" | "refundFailed"
  | "sessionExpired" | "rateLimited"
  | "loading" | "error"

interface Service {
  id: string; name: string; description: string; duration: number; price: number; category: string
}
interface StaffMember {
  id: string; name: string; role: string; photo: string; nextAvailable: string
}
interface BookingData {
  appointmentId?: string
  service?: Service
  staff?: StaffMember | null
  date?: string
  time?: string
  name?: string
  phone?: string
  email?: string
  reminder?: "whatsapp" | "sms" | "email" | "none"
  paymentMethod?: "card" | "cash"
  reference?: string
  notificationFailed?: boolean
  cancellationResult?: {
    feePercent: number
    feeAmount: number
    refundAmount: number
    reference: string
  }
  lookupRecord?: {
    reference: string
    salon: string
    address: string
    service: string
    staff: string
    date: string
    time: string
    duration: string
    paymentStatus: string
    bookingStatus: string
    appointmentId: string
    totalPaid: number
    price: number
  }
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// ─── CONSTANTS & HELPERS ──────────────────────────────────────────────────────

const SALON_NAME = "Fade & Edge Barbershop"
const SALON_ADDRESS = "15 Loader Street, De Waterkant, Cape Town, 8001"
const SALON_MAPS_URL = "https://maps.google.com/?q=15+Loader+Street+De+Waterkant+Cape+Town"
const SALON_PHONE = "011 555 0192"

export function downloadIcsCalendar(
  title: string,
  description: string,
  location: string,
  dateStr: string,
  timeStr: string,
  durationMinutes: number = 45
) {
  if (!dateStr || !timeStr) return
  const [y, m, d] = dateStr.split("-").map(Number)
  const [hh, mm] = timeStr.split(":").map(Number)
  const start = new Date(Date.UTC(y, m - 1, d, hh, mm))
  const end = new Date(start.getTime() + durationMinutes * 60000)

  const pad = (n: number) => (n < 10 ? "0" + n : "" + n)
  const formatIcsDate = (dt: Date) =>
    `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BookYourBarber//Booking//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@bookyourbarber.co.za`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `LOCATION:${location.replace(/\n/g, " ")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `barber-booking-${dateStr}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Replace these with API-driven values in production
const MAX_ADVANCE_DAYS = 60      // how many days ahead customers may book
const CLOSED_DAYS: number[] = [] // day-of-week indices (0=Sun … 6=Sat); empty = open every day

const SLOT_HOLD_SECONDS = 10 * 60 // 10-minute reservation window for online payments

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const SERVICES: Service[] = [
  { id:"s1", name:"Classic Haircut",       description:"Precision cut, style and finish",         duration:45, price:150, category:"Haircuts" },
  { id:"s2", name:"Line-up and Edge",      description:"Sharp lines and clean fades only",         duration:20, price:80,  category:"Haircuts" },
  { id:"s3", name:"Kids Cut (Under 12)",   description:"Gentle cut for the little ones",           duration:30, price:100, category:"Haircuts" },
  { id:"s4", name:"Beard Trim and Shape",  description:"Sculpted edges and hot towel finish",      duration:30, price:120, category:"Beard"    },
  { id:"s5", name:"Hot Towel Shave",       description:"Traditional straight-razor shave",         duration:60, price:200, category:"Shaving"  },
  { id:"s6", name:"Hair and Beard Combo",  description:"Full cut plus beard sculpt",               duration:75, price:250, category:"Combos"   },
]

const STAFF: StaffMember[] = [
  { id:"t1", name:"Themba Ndlovu",  role:"Master Barber",    photo:"photo-1507003211169-0a1dd7228f2d", nextAvailable:"09:00" },
  { id:"t2", name:"Devon Williams", role:"Senior Stylist",   photo:"photo-1472099645785-5658abf4ff4e", nextAvailable:"10:30" },
  { id:"t3", name:"Aisha Jacobs",   role:"Style Specialist", photo:"photo-1494790108377-be9c29b29330", nextAvailable:"11:00" },
  { id:"t4", name:"Ntombi Dlamini", role:"Senior Barber",    photo:"photo-1438761681033-6461ffad8d80", nextAvailable:"14:00" },
]


const MONTHS      = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const DAYS_SHORT  = ["Su","Mo","Tu","We","Th","Fr","Sa"]

const REMINDER_OPTIONS = [
  { id:"whatsapp" as const, icon:"💬", label:"WhatsApp",    desc:"Message sent to your WhatsApp number",   badge:"Most popular" },
  { id:"sms"      as const, icon:"📱", label:"SMS",         desc:"Text message reminder to your phone"                          },
  { id:"email"    as const, icon:"📧", label:"Email",       desc:"Reminder delivered to your inbox"                             },
  { id:"none"     as const, icon:"🔕", label:"No reminder", desc:"Booking confirmed, no reminder sent"                          },
]


// ─── UTILITIES ────────────────────────────────────────────────────────────────

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y: number, m: number)    { return new Date(y, m, 1).getDay()      }

function formatDateLong(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("en-ZA", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
}
function formatDateShort(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("en-ZA", { weekday:"short", day:"numeric", month:"short" })
}

function fmtCard(v: string) {
  return v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim()
}
function fmtExpiry(v: string) {
  const n = v.replace(/\D/g,"").slice(0,4)
  return n.length >= 3 ? n.slice(0,2) + "/" + n.slice(2) : n
}
function fmtCountdown(secs: number) {
  const m = Math.floor(secs / 60), s = secs % 60
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function StepHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3.5 bg-white sticky top-0 z-10 border-b border-gray-50">
      <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-1 flex-shrink-0">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <h2 className="font-semibold text-[15px] text-gray-900 tracking-tight">{title}</h2>
    </div>
  )
}

function CtaBar({ label, onClick, disabled = false, danger = false }: {
  label: string; onClick: () => void; disabled?: boolean; danger?: boolean
}) {
  return (
    <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 pt-3 pb-5 mt-auto">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-[15px] rounded-2xl font-semibold text-[15px] transition-all duration-150 ${
          disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : danger  ? "bg-red-600 text-white active:scale-[0.98] shadow-sm"
          :           "bg-gray-900 text-white shadow-sm active:scale-[0.98]"
        }`}
      >
