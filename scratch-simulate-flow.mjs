import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = 'https://jezrogioagnuworbmgue.supabase.co'
const ANON_KEY = 'sb_publishable_LXONyNNZVrLsk9-ldu7sHA_8OyldzJy'

// Mock cookie store for node environment to simulate browser cookies in createBrowserClient
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

async function simulateBrowserFlow() {
  console.log('=== STEP 1: Client initial state ===')
  const { data: { user: initialUser } } = await client.auth.getUser()
  console.log('Initial user:', initialUser ? initialUser.id : 'null (not logged in)')

  console.log('\n=== STEP 2: Client logs in via Supabase ===')
  const { data: loginData, error: loginErr } = await client.auth.signInWithPassword({
    email: 'owner@fadeandedge.co.za',
    password: 'password123'
  })

  if (loginErr) {
    console.error('Login error:', loginErr.message)
    return
  }
  console.log('Login success! User ID:', loginData.user.id)
  console.log('Cookies stored by @supabase/ssr:', Object.keys(cookieStore))

  console.log('\n=== STEP 3: Client fetches current user & profile ===')
  const { data: { user: verifiedUser } } = await client.auth.getUser()
  console.log('Verified user from session:', verifiedUser?.id)

  const { data: profile } = await client.from('profiles').select('*').eq('id', verifiedUser.id).single()
  console.log('Profile:', profile?.full_name)

  const { data: memberships } = await client.from('tenant_memberships').select('*').eq('user_id', verifiedUser.id)
  console.log('Memberships count:', memberships?.length)
  const tenantId = memberships?.[0]?.tenant_id
  console.log('Resolved tenantId:', tenantId)

  console.log('\n=== STEP 4: Client queries salon management data ===')
  const [appts, staff, services, customers] = await Promise.all([
    client.from('appointments').select('*').eq('tenant_id', tenantId),
    client.from('staff').select('*').eq('tenant_id', tenantId),
    client.from('services').select('*').eq('tenant_id', tenantId),
    client.from('customers').select('*').eq('tenant_id', tenantId),
  ])

  console.log('Appointments returned:', appts.data?.length, 'error:', appts.error?.message)
  console.log('Staff returned:', staff.data?.length, 'error:', staff.error?.message)
  console.log('Services returned:', services.data?.length, 'error:', services.error?.message)
  console.log('Customers returned:', customers.data?.length, 'error:', customers.error?.message)

  console.log('\n=== STEP 5: What happens if login was the mock dev-owner without Supabase auth? ===')
  const anonClient = createBrowserClient(SUPABASE_URL, ANON_KEY)
  const [anonAppts, anonStaff, anonServices, anonCustomers] = await Promise.all([
    anonClient.from('appointments').select('*').eq('tenant_id', '11111111-1111-1111-1111-111111111111'),
    anonClient.from('staff').select('*').eq('tenant_id', '11111111-1111-1111-1111-111111111111'),
    anonClient.from('services').select('*').eq('tenant_id', '11111111-1111-1111-1111-111111111111'),
    anonClient.from('customers').select('*').eq('tenant_id', '11111111-1111-1111-1111-111111111111'),
  ])
  console.log('UNAUTHENTICATED Appointments returned:', anonAppts.data?.length, 'error:', anonAppts.error?.message)
  console.log('UNAUTHENTICATED Staff returned:', anonStaff.data?.length, 'error:', anonStaff.error?.message)
  console.log('UNAUTHENTICATED Services returned:', anonServices.data?.length, 'error:', anonServices.error?.message)
  console.log('UNAUTHENTICATED Customers returned:', anonCustomers.data?.length, 'error:', anonCustomers.error?.message)
}

simulateBrowserFlow().catch(console.error)
