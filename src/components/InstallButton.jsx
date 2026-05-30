import { Download } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'

export function InstallButton() {
  const { canInstall, installApp } = usePWAInstall()
  if (!canInstall) return null

  return (
    <button
      type="button"
      onClick={installApp}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-gold)] bg-white/5 backdrop-blur px-3 py-1.5 text-xs font-bold text-[var(--accent-gold)] hover:bg-[var(--accent-gold)] hover:text-[#0a0805] transition-all duration-250 active:scale-95 cursor-pointer font-display uppercase tracking-wider"
    >
      <Download size={14} aria-hidden="true" />
      Install
    </button>
  )
}
