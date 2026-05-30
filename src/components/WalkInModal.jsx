import { useState } from 'react'
import { CheckCircle2, Phone, UserRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { nextHalfHour, todayISO } from '../utils/time'

export function WalkInModal({ services, onClose, onBooked }) {
  const [serviceId, setServiceId] = useState(services[0]?.id || '')
  const [startTime, setStartTime] = useState(nextHalfHour())
  const [form, setForm] = useState({ fullName: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function bookWalkIn(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const { error: rpcError } = await supabase.rpc('book_walk_in_appointment', {
      p_service_id: serviceId,
      p_appointment_date: todayISO(),
      p_start_time: startTime,
      p_full_name: form.fullName.trim(),
      p_phone: form.phone.trim()
    })

    setLoading(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    onBooked()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#0a0805]/80 backdrop-blur-sm px-3 sm:items-center sm:justify-center animate-fade-in">
      <form onSubmit={bookWalkIn} className="w-full max-w-md rounded-t-2xl border border-white/5 bg-[#12100d] p-6 shadow-2xl safe-bottom sm:rounded-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/5 sm:hidden" />
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-wider text-white uppercase">Walk-in</h2>
            <p className="text-xs text-[var(--text-muted)] font-medium">Create a quick cash appointment.</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-lg border border-white/5 bg-white/5 px-3 py-1 text-xs font-bold font-display uppercase tracking-wider text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4">
          <div className="relative">
            <select 
              value={serviceId} 
              onChange={(event) => setServiceId(event.target.value)} 
              className="w-full rounded-lg border border-white/5 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-[var(--accent-gold)] focus:bg-white/10 transition-all"
            >
              {services.map((service) => (
                <option key={service.id} value={service.id} className="bg-[#12100d] text-white">
                  {service.name} — €{Number(service.price).toFixed(2)} cash
                </option>
              ))}
            </select>
          </div>
          
          <input 
            type="time" 
            step="1800" 
            min="10:00" 
            max="20:30" 
            value={startTime} 
            onChange={(event) => setStartTime(event.target.value)} 
            className="w-full rounded-lg border border-white/5 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-[var(--accent-gold)] focus:bg-white/10 transition-all" 
          />
          
          <label className="relative block">
            <UserRound className="pointer-events-none absolute left-3 top-3 text-[var(--text-muted)]" size={16} />
            <input 
              required 
              value={form.fullName} 
              onChange={(event) => setForm({ ...form, fullName: event.target.value })} 
              placeholder="Client Name and Surname" 
              className="w-full rounded-lg border border-white/5 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-gold)] focus:bg-white/10 transition-all" 
            />
          </label>
          
          <label className="relative block">
            <Phone className="pointer-events-none absolute left-3 top-3 text-[var(--text-muted)]" size={16} />
            <input 
              required 
              value={form.phone} 
              onChange={(event) => setForm({ ...form, phone: event.target.value })} 
              placeholder="Phone Number" 
              className="w-full rounded-lg border border-white/5 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-gold)] focus:bg-white/10 transition-all" 
            />
          </label>
          
          <button 
            disabled={loading} 
            className="btn-gold w-full mt-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={18} /> {loading ? 'Saving...' : 'Add walk-in'}
          </button>
          
          {error && <p className="text-xs font-bold text-center text-red-400 tracking-wide">{error}</p>}
        </div>
      </form>
    </div>
  )
}
