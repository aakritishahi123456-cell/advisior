import { createClient } from '@supabase/supabase-js'

function normalizeEnv(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  return value.trim().replace(/^['"]|['"]$/g, '')
}

function ensureSupabaseUrl(value: string): string {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(value)) {
    throw new Error(
      'Invalid SUPABASE_URL. Expected format: https://your-project-ref.supabase.co'
    )
  }

  return value
}

function ensureSupabaseKey(name: string, value: string): string {
  if (
    value.includes('your-supabase') ||
    value.includes('placeholder') ||
    value.includes('project-ref')
  ) {
    throw new Error(`Invalid ${name}. Replace the placeholder with the real Supabase key.`)
  }

  return value
}

const supabaseUrl = normalizeEnv(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseAnonKey = normalizeEnv(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const supabaseServiceRoleKey = normalizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export const supabaseAuthClient = createClient(
  ensureSupabaseUrl(requireEnv('SUPABASE_URL', supabaseUrl)),
  ensureSupabaseKey('SUPABASE_ANON_KEY', requireEnv('SUPABASE_ANON_KEY', supabaseAnonKey)),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export const supabaseAdmin = createClient(
  ensureSupabaseUrl(requireEnv('SUPABASE_URL', supabaseUrl)),
  ensureSupabaseKey(
    'SUPABASE_SERVICE_ROLE_KEY',
    requireEnv('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey)
  ),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
