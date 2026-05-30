import { useEffect, useState } from 'react'
import { SiteHeader } from './components/SiteHeader'
import { SiteFooter } from './components/SiteFooter'
import { HomePage } from './pages/HomePage'
import { BookingPage } from './pages/BookingPage'
import { BarberDashboard } from './components/BarberDashboard'
import { isSupabaseConfigured } from './lib/supabase'

function getRoute() {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

export default function App() {
  const [route, setRoute] = useState(getRoute)
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('barber_lang') || 'sq'
  })

  useEffect(() => {
    const handleNavigation = () => setRoute(getRoute())
    window.addEventListener('popstate', handleNavigation)
    return () => window.removeEventListener('popstate', handleNavigation)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    localStorage.setItem('barber_lang', language)
  }, [language])

  const isBarberRoute = route === '/barber'
  const isBookingRoute = route === '/booking'

  // SPA router renderer
  const renderContent = () => {
    switch (route) {
      case '/':
        return <HomePage language={language} />
      case '/booking':
        return <BookingPage language={language} />
      case '/barber':
        return <BarberDashboard />
      default:
        // Fallback to Home
        return <HomePage language={language} />
    }
  }

  // Dashboard has its own structure (no global header/footer)
  if (isBarberRoute) {
    return (
      <main className="min-h-screen bg-[#0a0805] text-[#f5f3ef]">
        {!isSupabaseConfigured && <SupabaseWarning language={language} />}
        {renderContent()}
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0805] text-[#f5f3ef] flex flex-col justify-between">
      <div>
        <SiteHeader 
          currentRoute={route} 
          language={language} 
          setLanguage={setLanguage} 
        />
        
        {!isSupabaseConfigured && <SupabaseWarning language={language} />}
        
        {renderContent()}
      </div>

      <SiteFooter language={language} />
    </main>
  )
}

function SupabaseWarning({ language }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-4">
      <div className="rounded-xl border border-amber-500/30 bg-[#12100d]/90 p-4 text-xs font-bold text-amber-400">
        {language === 'sq' ? (
          <>
            Supabase nuk është konfiguruar! Vendosni vlerat tuaja në skedarin <code>.env</code>, pastaj ekzekutoni SQL në <code>database/schema.sql</code>.
          </>
        ) : (
          <>
            Supabase is not configured! Add your connection details to <code>.env</code>, then run the queries in <code>database/schema.sql</code>.
          </>
        )}
      </div>
    </div>
  )
}
