import { createBrowserClient } from '@supabase/ssr'
import {
  SupabaseAppointmentRepository,
  SupabaseServiceRepository,
  SupabaseStaffRepository,
  SupabaseCustomerRepository,
} from './src/infrastructure/repositories/SupabaseRepositories.ts'

const SUPABASE_URL = 'https://jezrogioagnuworbmgue.supabase.co'
const ANON_KEY = 'sb_publishable_LXONyNNZVrLsk9-ldu7sHA_8OyldzJy'

let cookieStore = {}
const client = createBrowserClient(SUPABASE_URL, ANON_KEY, {
  cookies: {
    getAll() {
      return Object.entries(cookieStore).map(([name, value]) => ({ name, value }))
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => {
        cookieStore[name] = value
      })
    }
  }
})

async function testAppointmentListFlow() {
  console.log('Logging in...')
  const { data: loginData, error: loginErr } = await client.auth.signInWithPassword({
    email: 'owner@fadeandedge.co.za',
    password: 'password123'
  })
  if (loginErr) throw loginErr

  const tenantId = '11111111-1111-1111-1111-111111111111'
  const apptRepo = new SupabaseAppointmentRepository(client)
  const serviceRepo = new SupabaseServiceRepository(client)
  const staffRepo = new SupabaseStaffRepository(client)
  const customerRepo = new SupabaseCustomerRepository(client)

  console.log('Running Promise.all([apptRepo, serviceRepo, staffRepo])...')
  const start = Date.now()
  const [appts, servicesList, staffList] = await Promise.all([
    apptRepo.listByTenant(tenantId),
    serviceRepo.list(tenantId, true),
    staffRepo.list(tenantId, true),
  ])
  console.log(`Initial batch done in ${Date.now() - start}ms:`)
  console.log(`- Appts: ${appts.length}`)
  console.log(`- Services: ${servicesList.length}`)
  console.log(`- Staff: ${staffList.length}`)

  console.log('Fetching unique customers...')
  const uniqueCustomerIds = Array.from(new Set(appts.map(a => a.customerId).filter(Boolean)))
  console.log(`- Unique customer IDs to fetch: ${uniqueCustomerIds.length}`)

  const startCust = Date.now()
  const customers = await Promise.all(uniqueCustomerIds.map(id => customerRepo.findById(id)))
  console.log(`Customer batch done in ${Date.now() - startCust}ms. Fetched: ${customers.filter(Boolean).length}`)

  console.log('Everything resolved smoothly!')
}

testAppointmentListFlow().catch(console.error)
