/**
 * Environment configuration and runtime validation.
 * Ensures required Supabase credentials and application variables are present.
 */


export interface EnvConfig {
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey?: string
  }
  app: {
    url: string
    isProduction: boolean
    isDevelopment: boolean
  }
}

function getEnvVar(key: string, required = true, fallback?: string): string {
  const value = process.env[key] || fallback
  if (required && (!value || value.trim() === '')) {
    throw new Error(
      `[Configuration Error] Missing required environment variable: ${key}.\n` +
      `Please ensure ${key} is defined in .env.local or your deployment environment variables.\n` +
      `Refer to .env.example for template.`
    )
  }
  return value || ''
}

export function validateEnv(): EnvConfig {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'

  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL', true)
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', true)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Validate URL structure
  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error(
      `[Configuration Error] NEXT_PUBLIC_SUPABASE_URL must be a valid URL. Received: "${supabaseUrl}".`
    )
  }

  const appUrl = getEnvVar(
    'NEXT_PUBLIC_APP_URL',
    false,
    isProduction ? 'https://bookyourbarber.co' : 'http://localhost:3000'
  )

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey,
    },
    app: {
      url: appUrl,
      isProduction,
      isDevelopment,
    },
  }
}

export const env = {
  get supabaseUrl(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  },
  get supabaseAnonKey(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  },
  get supabaseServiceRoleKey(): string | undefined {
    return process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  get appUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  },
  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  },
  get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  },
  get useSupabase(): boolean {
    return process.env.NEXT_PUBLIC_USE_SUPABASE === 'true'
  },
  get useMockRepositories(): boolean {
    return process.env.NEXT_PUBLIC_USE_MOCK_REPOSITORIES === 'true'
  },
  validate: validateEnv,
}

