import type { OpsAppointment, OpsCustomer, OpsStaff, OpsService, RefundRecord, ExpenseRecord } from "./types"

export const OPS_SALON_NAME    = "Fade & Edge Barbershop"
export const TODAY             = "2026-09-08"
export const TODAY_LABEL       = "Tuesday, 8 September 2026"

export const OPS_STAFF: OpsStaff[] = [
  { id:"t1", name:"Themba Ndlovu",  role:"Master Barber",    photo:"photo-1507003211169-0a1dd7228f2d", active:true,  todayRevenue:600,  monthRevenue:7800, monthAppointments:52, completionRate:96, noShowCount:2 },
  { id:"t2", name:"Devon Williams", role:"Senior Stylist",   photo:"photo-1472099645785-5658abf4ff4e", active:true,  todayRevenue:450,  monthRevenue:5850, monthAppointments:39, completionRate:92, noShowCount:3 },
  { id:"t3", name:"Aisha Jacobs",   role:"Style Specialist", photo:"photo-1494790108377-be9c29b29330", active:true,  todayRevenue:800,  monthRevenue:9600, monthAppointments:64, completionRate:98, noShowCount:1 },
  { id:"t4", name:"Ntombi Dlamini", role:"Senior Barber",    photo:"photo-1438761681033-6461ffad8d80", active:false, todayRevenue:0,    monthRevenue:0,    monthAppointments:0,  completionRate:0,  noShowCount:0 },
]

export const OPS_CUSTOMERS: OpsCustomer[] = [
  { id:"c1", name:"Thabo Mokoena",  phone:"082 345 6789", email:"thabo@gmail.com",  notes:"Prefers Themba. Short sides.",  since:"Jan 2025", visits:14, lastVisit:"12 Sep 2026", totalSpend:2100, outstandingBalance:0,   segment:"regular"   },
  { id:"c2", name:"Lerato Dlamini", phone:"071 234 5678", email:"lerato@gmail.com", notes:"",                              since:"Apr 2025", visits:8,  lastVisit:"1 Sep 2026",  totalSpend:960,  outstandingBalance:120, segment:"returning"  },
  { id:"c3", name:"Sanele Khumalo", phone:"083 456 7890", email:"sanele@gmail.com", notes:"Regular. Beard + cut combo.",   since:"Oct 2024", visits:22, lastVisit:"8 Sep 2026",  totalSpend:3300, outstandingBalance:0,   segment:"vip"        },
  { id:"c4", name:"Busisiwe Nkosi", phone:"074 567 8901", email:"busi@outlook.com", notes:"First visit Dec. Very satisfied.",since:"Mar 2026",visits:5,  lastVisit:"25 Aug 2026", totalSpend:750,  outstandingBalance:100, segment:"new"        },
  { id:"c5", name:"Mpho Sithole",   phone:"079 678 9012", email:"mpho@gmail.com",   notes:"",                              since:"Jun 2026", visits:3,  lastVisit:"15 Aug 2026", totalSpend:450,  outstandingBalance:0,   segment:"atRisk"     },
]

export const OPS_APPOINTMENTS: OpsAppointment[] = [
  {
    ref:"BYB-20260908-00481", customer:"Thabo Mokoena", customerId:"c1",
    phone:"082 345 6789", email:"thabo@gmail.com",
    service:"Classic Haircut", serviceId:"s1", staff:"Themba Ndlovu", staffId:"t1",
    date:TODAY, time:"09:00", duration:45, charged:150, paid:150,
    paymentMethod:"card", status:"completed", paymentStatus:"paid",
    source:"online", reminderChannel:"whatsapp",
    notifications:[
      { type:"confirmation", status:"sent", channel:"whatsapp", sentAt:"08 Sep 08:01" },
      { type:"reminder",     status:"sent", channel:"whatsapp", sentAt:"07 Sep 09:00" },
    ],
    payments:[{ id:"p1", amount:150, method:"card", recordedAt:"08 Sep 08:55", status:"successful" }],
  },
  {
    ref:"BYB-20260908-00482", customer:"Lerato Dlamini", customerId:"c2",
    phone:"071 234 5678", email:"lerato@gmail.com",
    service:"Beard Trim and Shape", serviceId:"s4", staff:"Aisha Jacobs", staffId:"t3",
    date:TODAY, time:"10:00", duration:30, charged:120, paid:0,
    paymentMethod:"payAtShop", status:"confirmed", paymentStatus:"unpaid",
    source:"online", reminderChannel:"whatsapp",
    notifications:[
      { type:"confirmation", status:"sent",   channel:"whatsapp", sentAt:"05 Sep 14:22" },
      { type:"reminder",     status:"failed",  channel:"whatsapp", sentAt:"07 Sep 10:00", failReason:"Delivery failed" },
    ],
    payments:[],
  },
  {
    ref:"BYB-20260908-00483", customer:"Sanele Khumalo", customerId:"c3",
    phone:"083 456 7890", email:"sanele@gmail.com",
    service:"Hair and Beard Combo", serviceId:"s6", staff:"Themba Ndlovu", staffId:"t1",
    date:TODAY, time:"11:00", duration:75, charged:250, paid:250,
    paymentMethod:"card", status:"inProgress", paymentStatus:"paid",
    source:"manual", reminderChannel:"sms",
    notifications:[
      { type:"confirmation", status:"sent", channel:"sms", sentAt:"06 Sep 09:10" },
    ],
    payments:[{ id:"p2", amount:250, method:"card", recordedAt:"08 Sep 10:58", status:"successful" }],
  },
  {
    ref:"BYB-20260908-00484", customer:"Busisiwe Nkosi", customerId:"c4",
    phone:"074 567 8901", email:"busi@outlook.com",
    service:"Hot Towel Shave", serviceId:"s5", staff:"Devon Williams", staffId:"t2",
    date:TODAY, time:"13:00", duration:60, charged:200, paid:100,
    paymentMethod:"payAtShop", status:"booked", paymentStatus:"partial",
    source:"online", reminderChannel:"email",
    notifications:[
      { type:"confirmation", status:"sent", channel:"email", sentAt:"04 Sep 11:00" },
      { type:"reminder",     status:"sent", channel:"email", sentAt:"07 Sep 13:00" },
    ],
    payments:[{ id:"p3", amount:100, method:"cash", recordedAt:"08 Sep 12:55", status:"successful" }],
  },
  {
    ref:"BYB-20260908-00485", customer:"Mpho Sithole", customerId:"c5",
    phone:"079 678 9012", email:"mpho@gmail.com",
    service:"Line-up and Edge", serviceId:"s2", staff:"Aisha Jacobs", staffId:"t3",
    date:TODAY, time:"14:00", duration:20, charged:80, paid:0,
    paymentMethod:"payAtShop", status:"booked", paymentStatus:"unpaid",
    source:"manual", reminderChannel:"none",
    notifications:[{ type:"confirmation", status:"notRequired", channel:"none" }],
    payments:[],
  },
  {
    ref:"BYB-20260907-00479", customer:"Lerato Dlamini", customerId:"c2",
    phone:"071 234 5678", email:"lerato@gmail.com",
    service:"Kids Cut (Under 12)", serviceId:"s3", staff:"Devon Williams", staffId:"t2",
    date:"2026-09-07", time:"14:30", duration:30, charged:100, paid:0,
    paymentMethod:"payAtShop", status:"noShow", paymentStatus:"unpaid",
    source:"online", reminderChannel:"whatsapp",
    notifications:[{ type:"confirmation", status:"sent", channel:"whatsapp", sentAt:"01 Sep 10:00" }],
    payments:[],
  },
  {
    ref:"BYB-20260910-00490", customer:"Sanele Khumalo", customerId:"c3",
    phone:"083 456 7890", email:"sanele@gmail.com",
    service:"Beard Trim and Shape", serviceId:"s4", staff:"Themba Ndlovu", staffId:"t1",
    date:"2026-09-10", time:"09:30", duration:30, charged:120, paid:0,
    paymentMethod:"payAtShop", status:"booked", paymentStatus:"unpaid",
    source:"online", reminderChannel:"whatsapp",
    notifications:[{ type:"confirmation", status:"sent", channel:"whatsapp", sentAt:"08 Sep 10:00" }],
    payments:[],
  },
  {
    ref:"BYB-20260911-00495", customer:"Busisiwe Nkosi", customerId:"c4",
    phone:"074 567 8901", email:"busi@outlook.com",
    service:"Classic Haircut", serviceId:"s1", staff:"Aisha Jacobs", staffId:"t3",
    date:"2026-09-11", time:"11:00", duration:45, charged:150, paid:150,
    paymentMethod:"card", status:"booked", paymentStatus:"paid",
    source:"manual", reminderChannel:"email",
    notifications:[{ type:"confirmation", status:"sent", channel:"email", sentAt:"08 Sep 11:05" }],
    payments:[{ id:"p4", amount:150, method:"card", recordedAt:"08 Sep 11:00", status:"successful" }],
  },
]

export const OPS_SERVICES: OpsService[] = [
  { id:"s1", name:"Classic Haircut",      category:"Haircuts",   duration:45, price:150, active:true  },
  { id:"s2", name:"Line-up and Edge",     category:"Haircuts",   duration:20, price:80,  active:true  },
  { id:"s3", name:"Kids Cut (Under 12)",  category:"Haircuts",   duration:30, price:100, active:true  },
  { id:"s4", name:"Beard Trim and Shape", category:"Beard",      duration:30, price:120, active:true  },
  { id:"s5", name:"Hot Towel Shave",      category:"Shaving",    duration:60, price:200, active:true  },
  { id:"s6", name:"Hair and Beard Combo", category:"Combos",     duration:75, price:250, active:true  },
  { id:"s7", name:"Scalp Treatment",      category:"Treatments", duration:45, price:180, active:false },
]

export const OPS_REFUNDS: RefundRecord[] = [
  {
    id:"r1", refundRef:"REF-20260907-001", apptRef:"BYB-20260907-00479",
    customer:"Lerato Dlamini", customerId:"c2",
    originalAmount:100, cancelledBy:"customer",
    feePercent:10, feeAmount:10, refundAmount:90,
    status:"completed", requestedAt:"7 Sep 14:20", completedAt:"10 Sep 09:14",
  },
  {
    id:"r2", refundRef:"REF-20260908-002", apptRef:"BYB-20260908-00483",
    customer:"Sanele Khumalo", customerId:"c3",
    originalAmount:250, cancelledBy:"salon",
    feePercent:0, feeAmount:0, refundAmount:250,
    status:"processing", requestedAt:"8 Sep 16:05",
  },
  {
    id:"r3", refundRef:"REF-20260905-003", apptRef:"BYB-20260905-00470",
    customer:"Mpho Sithole", customerId:"c5",
    originalAmount:150, cancelledBy:"customer",
    feePercent:18, feeAmount:27, refundAmount:123,
    status:"failed", requestedAt:"5 Sep 11:30",
  },
  {
    id:"r4", refundRef:"REF-20260908-004", apptRef:"BYB-20260908-00485",
    customer:"Mpho Sithole", customerId:"c5",
    originalAmount:80, cancelledBy:"customer",
    feePercent:10, feeAmount:8, refundAmount:72,
    status:"requested", requestedAt:"8 Sep 17:45",
  },
]

export const OPS_EXPENSES: ExpenseRecord[] = [
  { id:"e1", category:"Rent",        description:"Monthly salon rent — September",  amount:8500,  date:"2026-09-01" },
  { id:"e2", category:"Products",    description:"Hair products restock — Wahl, Andis", amount:1200, date:"2026-09-03" },
  { id:"e3", category:"Electricity", description:"Municipal electricity bill",       amount:750,   date:"2026-09-05" },
  { id:"e4", category:"Marketing",   description:"Instagram promotion — September",  amount:500,   date:"2026-09-06" },
  { id:"e5", category:"Products",    description:"Shaving cream and towels",         amount:380,   date:"2026-09-07" },
  { id:"e6", category:"Transport",   description:"Staff transport allowance",        amount:600,   date:"2026-09-08" },
]

export const DAY_SLOTS = [
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30",
]
