import { createBrowserClient } from '@supabase/ssr'
import { createSupabaseContainer } from './src/infrastructure/repositories/container.ts'

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

async function testDashboard() {
  console.log('Logging in...')
  const { error: loginErr } = await client.auth.signInWithPassword({
    email: 'owner@fadeandedge.co.za',
    password: 'password123'
  })
  if (loginErr) throw loginErr

  const tenantId = '11111111-1111-1111-1111-111111111111'
  const repos = createSupabaseContainer(client)

  const today = new Date().toISOString().slice(0, 10)
  console.log('Fetching today appointments and active staff for date:', today)
  const [appts, staff] = await Promise.all([
    repos.appointments.listByDate(tenantId, today),
    repos.staff.list(tenantId, true)
  ])
  console.log('Today appointments count:', appts.length)
  console.log('Active staff count:', staff.length)
  console.log('Dashboard data resolves successfully!')
}

testDashboard().catch(console.error)
