import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Phone,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Wallet
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAppointmentsRealtime } from '../hooks/useAppointmentsRealtime'
import { buildAvailableSlots, dayOfWeek, todayISO, toTime } from '../utils/time'

const COPY = {
  sq: {
    locale: 'sq-AL',
    heroEyebrow: 'Rezervime live',
    heroTitle: 'Rezervo prerjen pa pritje.',
    heroText:
      'Zgjidh shërbimin, berberin dhe orarin. Nuk nevojitet llogari dhe pagesa bëhet në dyqan.',
    heroPrimary: 'Hap rezervimin',
    heroSecondary: '10:00 - 21:00',
    liveBadge: 'Live',
    cashBadge: 'Vetëm cash',
    noLogin: 'Pa llogari',
    stepLabels: ['Shërbimi', 'Berberi', 'Data', 'Ora', 'Të dhënat'],
    required: 'E detyrueshme',
    chooseService: 'Zgjidh shërbimin',
    chooseBarber: 'Zgjidh berberin',
    chooseDate: 'Zgjidh datën',
    availableTimes: 'Orarët e lirë',
    customerDetails: 'Të dhënat e klientit',
    servicesEmpty: 'Shërbimet do të shfaqen pasi Supabase të jetë konfiguruar.',
    noBarbers: 'Asnjë berber nuk është caktuar për këtë shërbim.',
    chooseBarberFirst: 'Zgjidh një berber për të parë orarët e lirë.',
    noSlots: 'Nuk ka orare të lira për këtë zgjedhje.',
    firstName: 'Emri',
    lastName: 'Mbiemri',
    phone: 'Numri i telefonit',
    confirm: 'Konfirmo rezervimin',
    confirming: 'Duke konfirmuar...',
    confirmed: 'Rezervimi u konfirmua. Pagesa bëhet cash në dyqan.',
    unavailable: 'Ky orar nuk është më i lirë.',
    summary: 'Përmbledhje',
    service: 'Shërbimi',
    barber: 'Berberi',
    date: 'Data',
    time: 'Ora',
    total: 'Totali',
    nextStep: 'Hapi tjetër',
    duration: 'min',
    paidInPerson: 'paguhet në dyqan',
    cash: 'cash',
    today: 'Sot',
    closed: 'Mbyllur',
    barberRole: 'Berber',
    next: {
      service: 'Zgjidh shërbimin',
      barber: 'Zgjidh berberin',
      date: 'Zgjidh datën',
      time: 'Zgjidh orën',
      details: 'Plotëso të dhënat',
      confirm: 'Konfirmo'
    },
    sections: {
      standardsTitle: 'Standardi i vizitës',
      standards: [
        ['Orar i qartë', 'Rezervimet hapen çdo 30 minuta nga 10:00 deri në 21:00.'],
        ['Berber i zgjedhur', 'Çdo klient zgjedh vetë berberin para se të zgjedhë orën.'],
        ['Pagesë në dyqan', 'Nuk ka pagesa online. Totali paguhet cash pas shërbimit.']
      ],
      visitTitle: 'Para se të vish',
      visitItems: [
        'Mbërrij 5 minuta më herët për kontrollin e orarit.',
        'Nëse vonohesh, telefono dyqanin që berberi ta dijë.',
        'Rezervimet live përditësohen menjëherë kur një orar zëhet.'
      ],
      shopTitle: 'Dyqani',
      shopLines: ['Hapur çdo ditë pune', 'Rezervime 10:00 - 21:00', 'Shërbim pa pagesë online']
    }
  },
  en: {
    locale: 'en',
    heroEyebrow: 'Live reservations',
    heroTitle: 'Book your cut without waiting.',
    heroText:
      'Choose the service, barber, and time. No account is needed and payment happens in the shop.',
    heroPrimary: 'Start booking',
    heroSecondary: '10:00 - 21:00',
    liveBadge: 'Live',
    cashBadge: 'Cash only',
    noLogin: 'No account',
    stepLabels: ['Service', 'Barber', 'Date', 'Time', 'Details'],
    required: 'Required',
    chooseService: 'Choose service',
    chooseBarber: 'Choose barber',
    chooseDate: 'Choose date',
    availableTimes: 'Available times',
    customerDetails: 'Customer details',
    servicesEmpty: 'Services will appear here after Supabase is configured.',
    noBarbers: 'No barber is assigned to this service yet.',
    chooseBarberFirst: 'Choose a barber to see available times.',
    noSlots: 'No open times for this selection.',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone number',
    confirm: 'Confirm appointment',
    confirming: 'Confirming...',
    confirmed: 'Appointment confirmed. Pay in cash at the shop.',
    unavailable: 'This time is no longer available.',
    summary: 'Summary',
    service: 'Service',
    barber: 'Barber',
    date: 'Date',
    time: 'Time',
    total: 'Total',
    nextStep: 'Next step',
    duration: 'min',
    paidInPerson: 'paid in person',
    cash: 'cash',
    today: 'Today',
    closed: 'Closed',
    barberRole: 'Barber',
    next: {
      service: 'Choose service',
      barber: 'Choose barber',
      date: 'Choose date',
      time: 'Choose time',
      details: 'Add details',
      confirm: 'Confirm'
    },
    sections: {
      standardsTitle: 'Visit standard',
      standards: [
        ['Clear timing', 'Reservations open every 30 minutes from 10:00 to 21:00.'],
        ['Your barber', 'Every client chooses a barber before selecting a time.'],
        ['Pay in shop', 'No online payments. The total is paid in cash after the service.']
      ],
      visitTitle: 'Before you arrive',
      visitItems: [
        'Arrive 5 minutes early so the schedule stays clean.',
        'If you are running late, call the shop so the barber knows.',
        'Live reservations update instantly when a slot is taken.'
      ],
      shopTitle: 'The shop',
      shopLines: ['Open on working days', 'Reservations 10:00 - 21:00', 'No online payment']
    }
  }
}

function formatCash(value, copy) {
  if (value === undefined || value === null || value === '') return '-'
  return `${Number(value).toLocaleString(copy.locale)} ${copy.cash}`
}

function buildDateOptions(copy, language) {
  return Array.from({ length: 8 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() + index)
    const iso = date.toISOString().slice(0, 10)
    const sqWeekdays = ['Die', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht']
    const sqMonths = ['jan', 'shk', 'mar', 'pri', 'maj', 'qer', 'kor', 'gush', 'sht', 'tet', 'nën', 'dhj']

    return {
      iso,
      dayOfWeek: date.getDay(),
      weekday:
        language === 'sq'
          ? sqWeekdays[date.getDay()]
          : date.toLocaleDateString(copy.locale, { weekday: 'short' }),
      day:
        language === 'sq'
          ? `${date.getDate()} ${sqMonths[date.getMonth()]}`
          : date.toLocaleDateString(copy.locale, { day: 'numeric', month: 'short' }),
      isToday: index === 0
    }
  })
}

function StepHeader({ number, eyebrow, title, required, locked = false }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wide text-[#8c2f39]">
          {number}. {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-black tracking-tight text-[#171a21]">{title}</h2>
      </div>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
          locked ? 'bg-[#e8ece8] text-[#7b817b]' : 'bg-[#171a21] text-white'
        }`}
      >
        {required}
      </span>
    </div>
  )
}

export function ClientBooking({ language = 'sq' }) {
  const copy = COPY[language] || COPY.sq
  const [services, setServices] = useState([])
  const [barberServices, setBarberServices] = useState([])
  const [barberSchedule, setBarberSchedule] = useState([])
  const [schedules, setSchedules] = useState([])
  const [appointments, setAppointments] = useState([])
  const [serviceId, setServiceId] = useState('')
  const [barberId, setBarberId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadCatalog() {
      const [{ data: serviceRows }, { data: assignmentRows }] = await Promise.all([
        supabase
          .from('services')
          .select('id, name, duration_minutes, price')
          .eq('active', true)
          .order('name'),
        supabase
          .from('barber_services')
          .select('barber_id, service_id, barber:profiles(id, full_name)')
      ])

      setServices(serviceRows || [])
      setBarberServices(assignmentRows || [])
      if (serviceRows?.[0]) setServiceId(serviceRows[0].id)
    }

    loadCatalog()
  }, [])

  const selectedService = services.find((service) => service.id === serviceId)

  const eligibleBarbers = useMemo(() => {
    const seen = new Set()
    return barberServices
      .filter((item) => item.service_id === serviceId && item.barber)
      .filter((item) => {
        if (seen.has(item.barber_id)) return false
        seen.add(item.barber_id)
        return true
      })
      .map((item) => item.barber)
  }, [barberServices, serviceId])

  const selectedBarber = eligibleBarbers.find((barber) => barber.id === barberId)

  useEffect(() => {
    if (!barberId) return
    const stillEligible = eligibleBarbers.some((barber) => barber.id === barberId)
    if (!stillEligible) {
      setBarberId('')
      setSelectedSlot(null)
    }
  }, [barberId, eligibleBarbers])

  useEffect(() => {
    if (!barberId) {
      setBarberSchedule([])
      setSchedules([])
      setAppointments([])
      return
    }

    async function loadSchedule() {
      const { data } = await supabase
        .from('schedules')
        .select('id, day_of_week, start_time, end_time')
        .eq('barber_id', barberId)

      setBarberSchedule(data || [])
    }

    loadSchedule()
  }, [barberId])

  const loadSlotsContext = useCallback(async () => {
    if (!barberId || !date) return

    const [{ data: scheduleRows }, { data: bookedRows }] = await Promise.all([
      supabase
        .from('schedules')
        .select('id, start_time, end_time')
        .eq('barber_id', barberId)
        .eq('day_of_week', dayOfWeek(date)),
      supabase
        .from('appointments')
        .select('id, start_time, end_time, status, appointment_date')
        .eq('barber_id', barberId)
        .eq('appointment_date', date)
        .in('status', ['pending', 'confirmed', 'walk_in', 'completed'])
    ])

    setSchedules(scheduleRows || [])
    setAppointments(bookedRows || [])
  }, [barberId, date])

  useEffect(() => {
    loadSlotsContext()
    setSelectedSlot(null)
  }, [loadSlotsContext])

  useAppointmentsRealtime({
    barberId,
    appointmentDate: date,
    onChange: loadSlotsContext
  })

  const minimumStart = useMemo(() => {
    if (date !== todayISO()) return '10:00'
    const now = new Date()
    return toTime(Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30)
  }, [date])

  const availableSlots = useMemo(
    () =>
      buildAvailableSlots({
        schedules,
        appointments,
        serviceDuration: selectedService?.duration_minutes,
        minimumStart
      }),
    [appointments, minimumStart, schedules, selectedService]
  )

  const openWeekdays = useMemo(
    () => new Set(barberSchedule.map((schedule) => schedule.day_of_week)),
    [barberSchedule]
  )
  const dateOptions = useMemo(() => buildDateOptions(copy, language), [copy, language])

  const nextStep = useMemo(() => {
    if (!selectedService) return copy.next.service
    if (!selectedBarber) return copy.next.barber
    if (!date) return copy.next.date
    if (!selectedSlot) return copy.next.time
    if (!form.firstName || !form.lastName || !form.phone) return copy.next.details
    return copy.next.confirm
  }, [copy, date, form.firstName, form.lastName, form.phone, selectedBarber, selectedService, selectedSlot])

  async function bookAppointment(event) {
    event.preventDefault()
    if (!selectedSlot || !selectedService || !selectedBarber) return

    setLoading(true)
    setStatus('')
    const { error } = await supabase.rpc('book_client_appointment', {
      p_barber_id: barberId,
      p_service_id: serviceId,
      p_appointment_date: date,
      p_start_time: selectedSlot.start,
      p_full_name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      p_phone: form.phone.trim()
    })

    setLoading(false)
    if (error) {
      setStatus(error.message || copy.unavailable)
      return
    }

    setStatus(copy.confirmed)
    setForm({ firstName: '', lastName: '', phone: '' })
    setSelectedSlot(null)
    loadSlotsContext()
  }

  return (
    <>
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-8 pt-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <div className="mb-5 rounded-[1.75rem] bg-[#171a21] p-5 text-white shadow-xl shadow-[#171a21]/15 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#c0841a] px-3 py-1 text-xs font-black text-[#171a21]">
                {copy.heroEyebrow}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">
                {copy.noLogin}
              </span>
              <span className="rounded-full bg-[#0f766e] px-3 py-1 text-xs font-black text-white">
                {copy.cashBadge}
              </span>
            </div>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
              {copy.heroTitle}
            </h1>
            <p className="mt-3 max-w-xl text-base font-semibold leading-7 text-[#dfe6df]">
              {copy.heroText}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InfoTile icon={<Clock3 size={18} />} label={copy.heroSecondary} />
              <InfoTile icon={<ShieldCheck size={18} />} label={copy.cashBadge} />
              <InfoTile icon={<Sparkles size={18} />} label={copy.liveBadge} />
            </div>
          </div>

          <div id="booking" className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {copy.stepLabels.map((label, index) => (
              <span
                key={label}
                className="shrink-0 rounded-full border border-[#d6dfdb] bg-white px-3 py-2 text-xs font-black text-[#56615b]"
              >
                {index + 1}. {label}
              </span>
            ))}
          </div>

          <div className="grid gap-4 overflow-x-hidden">
            <BookingPanel>
              <StepHeader
                number={1}
                eyebrow={copy.service}
                title={copy.chooseService}
                required={copy.required}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setServiceId(service.id)
                      setSelectedSlot(null)
                    }}
                    className={`flex min-h-24 items-start justify-between gap-3 rounded-2xl border p-4 text-left active:scale-[0.99] ${
                      serviceId === service.id
                        ? 'border-[#171a21] bg-[#171a21] text-white'
                        : 'border-[#d6dfdb] bg-[#f8faf7] text-[#171a21]'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block font-black">{service.name}</span>
                      <span className="mt-1 block text-sm opacity-75">
                        {service.duration_minutes} {copy.duration}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[#c0841a] px-3 py-1 text-xs font-black text-[#171a21]">
                      {formatCash(service.price, copy)}
                    </span>
                  </button>
                ))}
              </div>
              {!services.length && <EmptyMessage>{copy.servicesEmpty}</EmptyMessage>}
            </BookingPanel>

            <BookingPanel>
              <StepHeader
                number={2}
                eyebrow={copy.barber}
                title={copy.chooseBarber}
                required={copy.required}
                locked={!selectedService}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {eligibleBarbers.map((barber) => (
                  <button
                    key={barber.id}
                    type="button"
                    onClick={() => {
                      setBarberId(barber.id)
                      setSelectedSlot(null)
                    }}
                    className={`flex min-h-20 items-center gap-3 rounded-2xl border p-4 text-left active:scale-[0.99] ${
                      barberId === barber.id
                        ? 'border-[#8c2f39] bg-[#fff1f2] text-[#8c2f39]'
                        : 'border-[#d6dfdb] bg-[#f8faf7] text-[#171a21]'
                    }`}
                    disabled={!selectedService}
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-[#0f766e] text-white">
                      <Scissors size={19} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-black">{barber.full_name}</span>
                      <span className="text-sm font-semibold text-[#6e776f]">
                        {copy.barberRole}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              {selectedService && !eligibleBarbers.length && <EmptyMessage>{copy.noBarbers}</EmptyMessage>}
            </BookingPanel>

            <BookingPanel>
              <StepHeader
                number={3}
                eyebrow={copy.date}
                title={copy.chooseDate}
                required={copy.required}
                locked={!selectedBarber}
              />
              <div className="flex gap-2 overflow-x-auto pb-1">
                {dateOptions.map((option) => {
                  const closed = selectedBarber && !openWeekdays.has(option.dayOfWeek)
                  return (
                    <button
                      key={option.iso}
                      type="button"
                      disabled={!selectedBarber || closed}
                      onClick={() => {
                        setDate(option.iso)
                        setSelectedSlot(null)
                      }}
                      className={`min-w-24 rounded-2xl border px-3 py-3 text-left active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${
                        date === option.iso
                          ? 'border-[#171a21] bg-[#171a21] text-white'
                          : 'border-[#d6dfdb] bg-[#f8faf7] text-[#171a21]'
                      }`}
                    >
                      <span className="block text-xs font-black uppercase opacity-70">
                        {option.isToday ? copy.today : option.weekday}
                      </span>
                      <span className="mt-1 block font-black">{option.day}</span>
                      {closed && (
                        <span className="mt-1 block text-xs font-bold text-[#8c2f39]">
                          {copy.closed}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </BookingPanel>

            <BookingPanel>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#8c2f39]">
                    4. {copy.time}
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-[#171a21]">
                    {copy.availableTimes}
                  </h2>
                </div>
                <span className="rounded-full bg-[#dff4ed] px-3 py-1 text-xs font-black text-[#0f766e]">
                  {copy.liveBadge}
                </span>
              </div>

              {!selectedBarber && <EmptyMessage>{copy.chooseBarberFirst}</EmptyMessage>}

              {selectedBarber && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {availableSlots.map((slot) => (
                    <button
                      key={`${slot.start}-${slot.end}`}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-2xl border px-3 py-4 text-center text-sm font-black shadow-sm active:scale-[0.98] ${
                        selectedSlot?.start === slot.start
                          ? 'border-[#8c2f39] bg-[#8c2f39] text-white'
                          : 'border-[#d6dfdb] bg-[#f8faf7] text-[#171a21]'
                      }`}
                    >
                      {slot.start}
                    </button>
                  ))}
                </div>
              )}

              {selectedBarber && !availableSlots.length && <EmptyMessage>{copy.noSlots}</EmptyMessage>}
            </BookingPanel>

            <BookingPanel>
              <div className="mb-3">
                <p className="text-xs font-black uppercase tracking-wide text-[#8c2f39]">
                  5. {copy.stepLabels[4]}
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-[#171a21]">
                  {copy.customerDetails}
                </h2>
              </div>

              <form onSubmit={bookAppointment} className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InputField
                    icon={<UserRound size={18} />}
                    required
                    disabled={!selectedSlot}
                    value={form.firstName}
                    onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                    placeholder={copy.firstName}
                  />
                  <InputField
                    icon={<UserRound size={18} />}
                    required
                    disabled={!selectedSlot}
                    value={form.lastName}
                    onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                    placeholder={copy.lastName}
                  />
                </div>
                <InputField
                  icon={<Phone size={18} />}
                  required
                  disabled={!selectedSlot}
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder={copy.phone}
                />
                <button
                  disabled={loading || !selectedSlot}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#171a21] px-5 py-4 font-black text-white shadow-lg shadow-[#171a21]/15 disabled:opacity-50"
                >
                  <CheckCircle2 size={20} />
                  {loading ? copy.confirming : copy.confirm}
                </button>
              </form>
            </BookingPanel>
          </div>
        </div>

        <aside className="fixed inset-x-3 bottom-3 z-20 mx-auto max-w-md rounded-[1.5rem] border border-[#d6dfdb] bg-white p-4 shadow-2xl shadow-[#171a21]/15 safe-bottom lg:sticky lg:top-20 lg:bottom-auto lg:mx-0 lg:max-w-none lg:self-start lg:shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-[#171a21]">{copy.summary}</h2>
            <span className="rounded-full bg-[#dff4ed] px-3 py-1 text-xs font-black text-[#0f766e]">
              {copy.cashBadge}
            </span>
          </div>
          <div className="grid gap-3 text-sm">
            <SummaryRow icon={<Scissors size={16} />} label={copy.service} value={selectedService?.name || '-'} />
            <SummaryRow icon={<UserRound size={16} />} label={copy.barber} value={selectedBarber?.full_name || '-'} />
            <SummaryRow icon={<CalendarDays size={16} />} label={copy.date} value={date || '-'} />
            <SummaryRow icon={<Clock3 size={16} />} label={copy.time} value={selectedSlot?.start || '-'} />
            <div className="border-t border-[#d6dfdb] pt-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-black text-[#6e776f]">{copy.total}</span>
                <span className="text-lg font-black text-[#171a21]">
                  {selectedService ? formatCash(selectedService.price, copy) : '-'}
                </span>
              </div>
              {selectedService && (
                <p className="mt-1 text-xs font-semibold text-[#6e776f]">
                  {selectedService.duration_minutes} {copy.duration} - {copy.paidInPerson}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#171a21] px-4 py-3 text-white">
            <span className="text-sm font-black">{copy.nextStep}</span>
            <span className="inline-flex items-center gap-1 text-sm font-black">
              {nextStep} <ChevronRight size={16} />
            </span>
          </div>
        </aside>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-36 lg:pb-12">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-wide text-[#8c2f39]">
            Barber Studio
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-[#171a21]">
            {copy.sections.standardsTitle}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {copy.sections.standards.map(([title, text], index) => (
            <article key={title} className="rounded-[1.25rem] border border-[#d6dfdb] bg-white p-5">
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-[#f5dfb3] text-[#7a520f]">
                {index === 0 && <Clock3 size={19} />}
                {index === 1 && <Star size={19} />}
                {index === 2 && <Wallet size={19} />}
              </span>
              <h3 className="text-lg font-black text-[#171a21]">{title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#66736c]">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <section className="rounded-[1.5rem] border border-[#d6dfdb] bg-white p-5">
            <h2 className="text-2xl font-black text-[#171a21]">{copy.sections.visitTitle}</h2>
            <div className="mt-4 grid gap-3">
              {copy.sections.visitItems.map((item) => (
                <p key={item} className="flex gap-3 text-sm font-semibold leading-6 text-[#66736c]">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-[#0f766e]" size={18} />
                  {item}
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-[#0f766e] p-5 text-white">
            <MapPin className="mb-4 text-[#f5dfb3]" size={28} />
            <h2 className="text-2xl font-black">{copy.sections.shopTitle}</h2>
            <div className="mt-4 grid gap-3">
              {copy.sections.shopLines.map((line) => (
                <p key={line} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black">
                  {line}
                </p>
              ))}
            </div>
          </section>
        </div>
      </section>

      {status && (
        <p className="fixed inset-x-4 bottom-36 z-30 mx-auto max-w-md rounded-2xl bg-[#171a21] px-4 py-3 text-sm font-semibold text-white shadow-xl lg:bottom-6">
          {status}
        </p>
      )}
    </>
  )
}

function BookingPanel({ children }) {
  return (
    <section className="rounded-[1.5rem] border border-[#d6dfdb] bg-white p-4 shadow-sm">
      {children}
    </section>
  )
}

function EmptyMessage({ children }) {
  return (
    <p className="rounded-2xl bg-[#eef3f0] px-4 py-3 text-sm font-semibold text-[#66736c]">
      {children}
    </p>
  )
}

function InfoTile({ icon, label }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black">
      {icon}
      {label}
    </div>
  )
}

function InputField({ icon, ...props }) {
  return (
    <label className="relative">
      <span className="pointer-events-none absolute left-3 top-3.5 text-[#8d958f]">{icon}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-[#d6dfdb] bg-white py-3 pl-10 pr-4 font-semibold text-[#171a21] placeholder:text-[#8d958f] disabled:bg-[#eef3f0]"
      />
    </label>
  )
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 font-black text-[#6e776f]">
        {icon}
        {label}
      </span>
      <span className="max-w-40 truncate text-right font-black text-[#171a21]">{value}</span>
    </div>
  )
}
