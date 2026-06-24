// Gera um "ding" de alerta via Web Audio — não precisa de arquivo de som.

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

export function tocarAlerta() {
  const ac = getCtx()
  if (!ac) return
  if (ac.state === 'suspended') void ac.resume()
  const notas = [880, 1174.66] // dó# / ré agudos
  notas.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const t0 = ac.currentTime + i * 0.18
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.17)
    osc.connect(gain).connect(ac.destination)
    osc.start(t0)
    osc.stop(t0 + 0.2)
  })
}

// Desbloqueia o áudio após o primeiro clique (exigência dos navegadores).
export function destravarAudio() {
  const ac = getCtx()
  if (ac && ac.state === 'suspended') void ac.resume()
}
