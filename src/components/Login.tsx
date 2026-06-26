import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import { Botao, Campo, inputCls } from './ui'

export function Login() {
  const { entrar } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const submeter = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    const falha = await entrar(email, senha)
    if (falha) {
      setErro(falha)
      setEnviando(false)
    }
    // Em caso de sucesso, o onAuthStateChange troca de tela automaticamente.
  }

  return (
    <div className="grid min-h-full place-items-center p-4">
      <form
        onSubmit={submeter}
        className="entrada w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-2">
          <span className="text-3xl">🏭</span>
          <div>
            <h1 className="text-lg font-extrabold leading-tight text-accent">Controle de Produção</h1>
            <span className="text-xs text-muted">Click Impresso</span>
          </div>
        </div>

        <div className="space-y-4">
          <Campo label="E-mail">
            <input
              type="email"
              autoComplete="username"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              required
              autoFocus
            />
          </Campo>
          <Campo label="Senha">
            <input
              type="password"
              autoComplete="current-password"
              className={inputCls}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Campo>
        </div>

        {erro && (
          <div className="mt-4 rounded-lg border border-crit/30 bg-crit/10 px-3 py-2 text-sm text-crit">
            ⚠️ {erro}
          </div>
        )}

        <Botao type="submit" variante="primario" className="mt-6 w-full" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </Botao>

        <p className="mt-4 text-center text-xs text-muted">Acesso restrito à equipe.</p>
      </form>
    </div>
  )
}
