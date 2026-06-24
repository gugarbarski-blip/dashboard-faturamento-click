import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && key)

// Quando as variáveis de ambiente não estão preenchidas, o app roda em modo
// demonstração (localStorage) — útil para testar sem o banco ligado.
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url as string, key as string, {
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null
