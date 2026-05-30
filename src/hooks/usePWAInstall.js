import { useCallback, useEffect, useMemo, useState } from 'react'

function isStandaloneMode() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(() =>
    typeof window === 'undefined' ? false : isStandaloneMode()
  )
  const [choice, setChoice] = useState(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }

    const handleInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      setChoice('accepted')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const installApp = useCallback(async () => {
    if (!installPrompt) return { outcome: 'unavailable' }

    await installPrompt.prompt()
    const result = await installPrompt.userChoice
    setChoice(result.outcome)
    setInstallPrompt(null)
    return result
  }, [installPrompt])

  return useMemo(
    () => ({
      canInstall: Boolean(installPrompt) && !isInstalled,
      isInstalled,
      choice,
      installApp
    }),
    [choice, installApp, installPrompt, isInstalled]
  )
}
