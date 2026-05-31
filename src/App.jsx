import { useEffect, useState } from 'react'
import { SiteHeader } from './components/SiteHeader'
import { SiteFooter } from './components/SiteFooter'
import { HomePage } from './pages/HomePage'
import { BookingPage } from './pages/BookingPage'
import { BarberDashboard } from './components/BarberDashboard'
import { AdminDashboard } from './components/AdminDashboard'
import { isSupabaseConfigured, supabase } from './lib/supabase'

function getRoute() {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

export default function App() {
  const [route, setRoute] = useState(getRoute)
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('barber_lang') || 'sq'
  })
  const [hasSession, setHasSession] = useState(false)
  const [profileRole, setProfileRole] = useState(null)
  const [profileRoleLoaded, setProfileRoleLoaded] = useState(false)

  useEffect(() => {
    const handleNavigation = () => setRoute(getRoute())
    window.addEventListener('popstate', handleNavigation)
    return () => window.removeEventListener('popstate', handleNavigation)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadProfileRole(session) {
      if (cancelled) return
      setHasSession(Boolean(session?.user))

      if (!session?.user) {
        setProfileRole(null)
        setProfileRoleLoaded(true)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('auth_user_id', session.user.id)
        .single()

      if (cancelled) return

      setProfileRole(error ? null : data?.role ?? null)
      setProfileRoleLoaded(true)
    }

    supabase.auth.getSession().then(({ data }) => {
      loadProfileRole(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setProfileRoleLoaded(false)
      loadProfileRole(nextSession)
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    localStorage.setItem('barber_lang', language)
  }, [language])

  const isBarberRoute = route === '/barber'
  const isAdminRoute = route === '/admin'
  const isProtectedRoute = isBarberRoute || isAdminRoute

  // Admins (and owners) can use the barber view too.
  const canAccessBarberArea =
    profileRole === 'barber' || profileRole === 'admin' || profileRole === 'owner'
  const canAccessAdminArea = profileRole === 'admin' || profileRole === 'owner'
  const allowedHere = isBarberRoute ? canAccessBarberArea : isAdminRoute ? canAccessAdminArea : true

  useEffect(() => {
    if (route === '/') {
      window.history.replaceState({}, '', '/home')
      setRoute('/home')
    }
  }, [route])

  // Kick a SIGNED-IN user off a protected route they may not enter. When signed
  // out we keep them so the dashboard can show its login form.
  useEffect(() => {
    if (!profileRoleLoaded) return
    if (isProtectedRoute && hasSession && !allowedHere) {
      window.history.replaceState({}, '', '/home')
      setRoute('/home')
    }
  }, [allowedHere, hasSession, isProtectedRoute, profileRoleLoaded])

  const renderProtected = () => (isAdminRoute ? <AdminDashboard /> : <BarberDashboard />)

  // SPA router renderer for public pages.
  const renderPublic = () => {
    switch (route) {
      case '/booking':
        return <BookingPage language={language} />
      case '/':
      case '/home':
      default:
        return <HomePage language={language} />
    }
  }

  // Protected dashboards own the full screen (no global header/footer). Render
  // them whenever the visitor is signed out (to show the login) or allowed in.
  if (isProtectedRoute && (!hasSession || allowedHere)) {
    return (
      <main className="min-h-screen bg-[#0a0805] text-[#f5f3ef]">
        {!isSupabaseConfigured && <SupabaseWarning language={language} />}
        {renderProtected()}
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
          canAccessBarberArea={canAccessBarberArea}
          canAccessAdminArea={canAccessAdminArea}
        />

        {!isSupabaseConfigured && <SupabaseWarning language={language} />}

        {renderPublic()}
      </div>

      <SiteFooter
        language={language}
        canAccessBarberArea={canAccessBarberArea}
        canAccessAdminArea={canAccessAdminArea}
      />
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
