import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export const supabaseAuthClient = createClient(
  requireEnv('SUPABASE_URL', supabaseUrl),
  requireEnv('SUPABASE_ANON_KEY', supabaseAnonKey),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export const supabaseAdmin = createClient(
  requireEnv('SUPABASE_URL', supabaseUrl),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
