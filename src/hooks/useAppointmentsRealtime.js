import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAppointmentsRealtime({ barberId, appointmentDate, onChange }) {
  useEffect(() => {
    if (!barberId || !onChange) return undefined

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
          if (!appointmentDate || changedDate === appointmentDate) onChange(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [appointmentDate, barberId, onChange])
}
