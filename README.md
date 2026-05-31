# Barber Brothers — Reservation PWA

Mobile-first React + Vite + Tailwind CSS + Supabase app for live barber reservations.

## What is built

- Client booking flow with no login: choose service, barber, date, 30-minute slot, then enter name and phone. A confirmation modal summarizes the booking.
- Public interface defaults to Albanian with an English switch.
- Barber dashboard (hidden at `/barber`) with email/password login: today's schedule, weekly overview, revenue/analytics, client history, profile, and walk-in quick-book.
- Realtime appointment sync **plus** a polling + tab-focus fallback, so new reservations always appear even if Realtime is down.
- Cash-only workflow: no online payments.
- PWA: installable, offline shell, app icons.
- Postgres double-booking prevention via a GiST exclusion constraint, returning-client dedup by phone, past-time and spam guards, and admin-only barber account functions.

## Setup (fresh Supabase project)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project. In **Project Settings → API**, copy the **Project URL** and **anon public key** into `.env`:

   ```
   VITE_SUPABASE_URL=https://YOUR-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

3. In the Supabase **SQL Editor**, run `database/schema.sql`, then `database/seed.sql`.
   Seed creates 4 services, 5 barbers (password `barber123`), and 2 admins (password `admin123`).

4. Start the app:

   ```bash
   npm run dev
   ```

5. Log in:
   - **Barber view** `/barber` — e.g. `uraniku@barberbrothers.style` / `barber123`.
   - **Admin panel** `/admin` — `suadpllana14@gmail.com` / `admin123` (admins can also open `/barber`).

## Roles

| Role | Access |
|---|---|
| `client` | Books from the public site (no login). |
| `barber` | `/barber` — own schedule, walk-ins, revenue, client history. |
| `admin` | `/admin` — shop-wide stats, all appointments, barber performance, service management. Also `/barber`. |

Nav links to `/barber` and `/admin` only appear for users whose role allows them.

### Managing barbers

See `database/add_barber.sql`. To add one:

```sql
select public.create_barber('newguy@barberbrothers.style', 'a-password', 'New Guy', '+38344000000');
```

To reset a password (works for barbers and admins):

```sql
select public.set_barber_password('uraniku@barberbrothers.style', 'new-password');
```

To add an admin:

```sql
select public.create_admin('boss@barberbrothers.style', 'a-password', 'The Boss');
```

## Before going live

- Change every barber password off `barber123` (`set_barber_password`).
- Set the shop timezone in `database/schema.sql` (currently `Europe/Tirane`) if needed.
- Confirm Realtime is enabled for `public.appointments` (schema.sql adds it to the `supabase_realtime` publication).
- Review the contact details / branding in `src/components/SiteHeader.jsx`, `SiteFooter.jsx`, and `src/pages/HomePage.jsx`.

## Key files

- `database/schema.sql` — tables, RLS, booking RPCs, barber-account functions, realtime.
- `database/seed.sql` — services + barber accounts.
- `database/add_barber.sql` — account-management command cheatsheet.
- `src/pages/BookingPage.jsx` — public booking wizard + confirmation modal.
- `src/components/BarberDashboard.jsx` — barber-only dashboard.
- `src/hooks/useAppointmentsRealtime.js` — realtime + polling + focus-refresh sync.
- `src/utils/time.js` — local-date helpers and slot building.
