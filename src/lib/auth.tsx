import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from './supabaseClient'

interface AuthCtx {
  // true quando o Supabase está configurado e, portanto, o login é exigido.
  authEnabled: boolean
  loading: boolean
  session: Session | null
  user: User | null
  entrar: (email: string, senha: string) => Promise<string | null>
  sair: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

// Traduz as mensagens de erro do Supabase (em inglês) para o usuário final.
function traduzErro(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.'
  if (/email not confirmed/i.test(msg)) return 'E-mail ainda não confirmado.'
  if (/rate limit|too many requests/i.test(msg)) return 'Muitas tentativas. Aguarde um instante.'
  return msg
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  // Só há o que carregar quando o login está ligado (modo nuvem).
  const [loading, setLoading] = useState(supabaseConfigured)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const entrar = useCallback(async (email: string, senha: string) => {
    if (!supabase) return 'Login indisponível no modo demonstração.'
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    })
    return error ? traduzErro(error.message) : null
  }, [])

  const sair = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const value: AuthCtx = {
    authEnabled: supabaseConfigured,
    loading,
    session,
    user: session?.user ?? null,
    entrar,
    sair,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth deve estar dentro de <AuthProvider>')
  return ctx
}
