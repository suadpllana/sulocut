import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Keeps a view in sync with the `appointments` table.
 *
 * Supabase Realtime is the primary, instant channel, but it can silently fail
 * (table not added to the realtime publication, RLS edge cases, dropped
 * websocket, etc.). To guarantee that a freshly booked reservation always shows
 * up for the barber, we also:
 *   - poll on an interval as a fallback, and
 *   - refetch whenever the tab regains focus.
 */
export function useAppointmentsRealtime({
  barberId,
  appointmentDate,
  onChange,
  pollMs = 15000
}) {
  // Keep the latest onChange without forcing the effect to re-subscribe.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!barberId) return undefined

    const fire = (payload) => {
      const handler = onChangeRef.current
      if (handler) handler(payload)
    }

    // 1. Realtime websocket subscription (instant when it works).
    const channel = supabase
      .channel(`appointments:${barberId}:${appointmentDate || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `barber_id=eq.${barberId}`
        },
        (payload) => {
          const changedDate = payload.new?.appointment_date || payload.old?.appointment_date
          if (!appointmentDate || changedDate === appointmentDate) fire(payload)
        }
      )
      .subscribe()

    // 2. Polling fallback so new reservations appear even if realtime is down.
    const interval = setInterval(() => fire(), pollMs)

    // 3. Refresh when the barber comes back to the tab.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fire()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [appointmentDate, barberId, pollMs])
}
