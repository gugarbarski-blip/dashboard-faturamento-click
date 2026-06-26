import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StoreProvider } from './lib/store.tsx'
import { AuthProvider, useAuth } from './lib/auth.tsx'
import { Login } from './components/Login.tsx'

// Decide o que mostrar conforme o estado de login. No modo demonstração
// (sem Supabase) o login é dispensado e o app abre direto.
function Raiz() {
  const { authEnabled, session, loading } = useAuth()

  if (authEnabled && loading) {
    return <div className="grid h-full place-items-center text-muted">Carregando…</div>
  }
  if (authEnabled && !session) {
    return <Login />
  }
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Raiz />
    </AuthProvider>
  </StrictMode>,
)
