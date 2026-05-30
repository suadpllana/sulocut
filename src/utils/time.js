export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function toMinutes(time) {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}

export function toTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(
    minutes % 60
  ).padStart(2, '0')}`
}

export function dayOfWeek(dateISO) {
  const date = new Date(`${dateISO}T12:00:00`)
  return date.getDay()
}

export function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

export function buildAvailableSlots({
  schedules,
  appointments,
  serviceDuration,
  minimumStart = '10:00'
}) {
  if (!serviceDuration) return []

  const booked = appointments
    .filter((item) => ['pending', 'confirmed', 'walk_in', 'completed'].includes(item.status))
    .map((item) => ({
      start: toMinutes(item.start_time),
      end: toMinutes(item.end_time)
    }))

  return schedules.flatMap((schedule) => {
    const dayStart = Math.max(
      toMinutes(schedule.start_time),
      toMinutes('10:00'),
      toMinutes(minimumStart)
    )
    const dayEnd = Math.min(toMinutes(schedule.end_time), toMinutes('21:00'))
    const slots = []

    for (let start = dayStart; start + serviceDuration <= dayEnd; start += 30) {
      const end = start + serviceDuration
      const blocked = booked.some((bookedSlot) =>
        intervalsOverlap(start, end, bookedSlot.start, bookedSlot.end)
      )
      if (!blocked) slots.push({ start: toTime(start), end: toTime(end) })
    }

    return slots
  })
}

export function nextHalfHour() {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  const rounded = Math.ceil(minutes / 30) * 30
  return toTime(Math.min(Math.max(rounded, toMinutes('10:00')), toMinutes('20:30')))
}
