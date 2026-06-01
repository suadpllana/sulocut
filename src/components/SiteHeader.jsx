import { useEffect, useState } from 'react'
import { Scissors, Menu, X, Globe } from 'lucide-react'
import { InstallButton } from './InstallButton'

export function SiteHeader({ currentRoute, language, setLanguage, canAccessBarberArea, canAccessAdminArea }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navigate = (to, e) => {
    if (e) e.preventDefault()
    window.history.pushState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
    setMobileMenuOpen(false)
  }

  const isHome = currentRoute === '/' || currentRoute === '/home'
  const isBooking = currentRoute === '/booking'
  const isBarber = currentRoute === '/barber'
  const isAdmin = currentRoute === '/admin'

  // Translation helpers
  const t = {
    home: language === 'sq' ? 'Kreu' : 'Home',
    booking: language === 'sq' ? 'Rezervo' : 'Book Now',
    barbers: language === 'sq' ? 'Stafi' : 'Barbers',
    contact: language === 'sq' ? 'Kontakt' : 'Contact',
    barberArea: language === 'sq' ? 'Zona Barber' : 'Barber Area',
    adminArea: language === 'sq' ? 'Admin' : 'Admin',
  }

  const links = [
    { to: '/home', label: t.home, active: isHome },
    { to: '/booking', label: t.booking, active: isBooking },
    ...(canAccessBarberArea ? [{ to: '/barber', label: t.barberArea, active: isBarber }] : []),
    ...(canAccessAdminArea ? [{ to: '/admin', label: t.adminArea, active: isAdmin }] : []),
  ]

  return (
    <header
      className={`sticky top-0 z-45 w-full border-b border-white/5 bg-[#0a0805]/80 backdrop-blur-xl transition-all duration-500 ${
        scrolled ? 'header-scrolled' : ''
      }`}
    >
      {/* animated hairline along the bottom edge */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-gold)]/50 to-transparent" />

      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8 transition-all duration-500 ${
          scrolled ? 'py-2.5' : 'py-4'
        }`}
      >
        {/* Brand Logo */}
        <a
          href="/home"
          onClick={(e) => navigate('/home', e)}
          className="flex items-center gap-3 active:scale-95 transition-transform group"
        >
          <div className="gradient-border flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-gold)] bg-gradient-to-br from-white/10 to-white/0 text-[var(--accent-gold)] shadow-[0_0_20px_-6px_rgba(200,169,126,0.4)] transition-all duration-500 group-hover:shadow-[0_0_28px_-4px_rgba(200,169,126,0.7)] group-hover:text-white">
            <Scissors size={20} className="rotate-90 transition-transform duration-700 group-hover:rotate-[200deg]" />
          </div>
          <div className="leading-none">
            <h1 className="font-display text-xl font-bold tracking-[0.18em] text-shimmer">
              SuLoCut
            </h1>
            <p className="mt-1 text-[10px] font-medium tracking-[0.3em] text-[var(--text-muted)] uppercase">
              Fushe Kosove
            </p>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-9">
          {links.map((link) => (
            <a
              key={link.to}
              href={link.to}
              onClick={(e) => navigate(link.to, e)}
              className={`group relative font-display text-sm tracking-wider transition-colors hover:text-[var(--accent-gold)] ${
                link.active ? 'text-[var(--accent-gold)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              {link.label}
              <span
                className={`absolute -bottom-1.5 left-0 h-0.5 w-full origin-left rounded-full bg-gradient-to-r from-[var(--accent-gold)] to-transparent transition-transform duration-300 ${
                  link.active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </a>
          ))}
        </nav>

        {/* Action Controls (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5 backdrop-blur">
            <button
              type="button"
              onClick={() => setLanguage('sq')}
              className={`rounded-md px-2.5 py-1 text-xs font-bold font-display cursor-pointer transition-all duration-300 ${
                language === 'sq'
                  ? 'bg-[var(--accent-gold)] text-[#0a0805] shadow-[0_0_14px_-4px_rgba(200,169,126,0.8)]'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              AL
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-md px-2.5 py-1 text-xs font-bold font-display cursor-pointer transition-all duration-300 ${
                language === 'en'
                  ? 'bg-[var(--accent-gold)] text-[#0a0805] shadow-[0_0_14px_-4px_rgba(200,169,126,0.8)]'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          <InstallButton />
        </div>

        {/* Mobile Toggle & Setup */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 p-0.5">
            <button
              onClick={() => setLanguage(language === 'sq' ? 'en' : 'sq')}
              className="flex items-center justify-center p-1 text-[var(--accent-gold)] text-xs font-bold font-display uppercase"
              aria-label="Toggle language"
            >
              <Globe size={14} className="mr-1" />
              {language === 'sq' ? 'EN' : 'AL'}
            </button>
          </div>

          <InstallButton />

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[var(--text-primary)] cursor-pointer transition-all hover:border-[var(--border-gold)] hover:text-[var(--accent-gold)]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0805]/98 px-6 py-6 animate-fade-in backdrop-blur-xl">
          <nav className="flex flex-col gap-5">
            {links.map((link, index) => (
              <a
                key={link.to}
                href={link.to}
                onClick={(e) => navigate(link.to, e)}
                style={{ animationDelay: `${index * 60}ms` }}
                className={`rise-in font-display text-lg tracking-wider transition-colors ${
                  link.active ? 'text-[var(--accent-gold)] font-bold' : 'text-[var(--text-secondary)]'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
