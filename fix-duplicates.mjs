import fs from 'fs'

// 1. Fix layout.tsx
let layout = fs.readFileSync('src/app/app/layout.tsx', 'utf-8')
const oldLayoutLine = '  const { user, tenantContext, currentRole, logout } = useAuth()'
const newLayoutLine = '  const { user, tenantContext, currentRole, logout, isLoading } = useAuth()'
if (layout.includes(oldLayoutLine) && layout.includes(newLayoutLine)) {
  layout = layout.replace(oldLayoutLine + '\r\n', '').replace(oldLayoutLine + '\n', '')
  fs.writeFileSync('src/app/app/layout.tsx', layout, 'utf-8')
  console.log('Fixed layout.tsx!')
} else {
  console.log('Layout check:', { old: layout.includes(oldLayoutLine), new: layout.includes(newLayoutLine) })
}

// 2. Fix AuthService.ts
let auth = fs.readFileSync('src/application/auth/AuthService.ts', 'utf-8')
const oldAuthLine = "import { createBrowserSupabaseClient } from '@/infrastructure/supabase/client'"
const newAuthLine = "import { createBrowserSupabaseClient, isSupabaseConfigured } from '@/infrastructure/supabase/client'"
if (auth.includes(oldAuthLine) && auth.includes(newAuthLine)) {
  auth = auth.replace(oldAuthLine + '\r\n', '').replace(oldAuthLine + '\n', '')
  fs.writeFileSync('src/application/auth/AuthService.ts', auth, 'utf-8')
  console.log('Fixed AuthService.ts!')
} else {
  console.log('Auth check:', { old: auth.includes(oldAuthLine), new: auth.includes(newAuthLine) })
}
