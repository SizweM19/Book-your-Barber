import { createBrowserClient } from '@supabase/ssr'
import { createSupabaseContainer } from './src/infrastructure/repositories/container.ts'
import { FinancialService } from './src/application/services/FinancialService.ts'

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

async function testFinancials() {
  console.log('Logging in...')
  const { error: loginErr } = await client.auth.signInWithPassword({
    email: 'owner@fadeandedge.co.za',
    password: 'password123'
  })
  if (loginErr) throw loginErr

  const tenantId = '11111111-1111-1111-1111-111111111111'
  const repos = createSupabaseContainer(client)
  const finService = new FinancialService(repos)

  console.log('Testing getFinancialOverview for Month...')
  const overviewMonth = await finService.getFinancialOverview(tenantId, 'Month')
  console.log('Month Overview:', overviewMonth)

  console.log('Testing getPaymentRecords for Month...')
  const payments = await finService.getPaymentRecords(tenantId, { period: 'Month' })
  console.log('Payments count:', payments.length)
}

testFinancials().catch(console.error)
