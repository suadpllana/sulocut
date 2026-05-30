# Barber Shop PWA

Mobile-first React + Vite + Tailwind CSS + Supabase starter for live barber reservations.

## What is built

- Client booking flow with no login: choose service, barber, date, 30-minute slot, then enter first name, last name, and phone.
- Public interface defaults to Albanian and includes an English switch.
- Barber dashboard is hidden from public navigation and is reachable at `/barber`.
- Barber dashboard with email/password login through Supabase Auth.
- Realtime appointment sync for the client grid and barber timeline.
- Cash-only workflow: no online payment objects, providers, or checkout code.
- PWA setup through `vite-plugin-pwa`, install prompt hook, standalone manifest, and app icons.
- PostgreSQL overlap prevention using a GiST exclusion constraint.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and add your Supabase project URL and anon key.

3. Run `database/schema.sql` in the Supabase SQL Editor.

4. In Supabase Auth, create one user per barber. Then insert a `profiles` row with that user's `auth_user_id` and `role = 'barber'`.

5. Start the app:

   ```bash
   npm run dev
   ```

## Key files

- `vite.config.js` - PWA manifest, auto-updating service worker, Tailwind Vite plugin.
- `src/hooks/usePWAInstall.js` - captures `beforeinstallprompt` for the custom install button.
- `src/hooks/useAppointmentsRealtime.js` - Supabase Realtime subscription for `appointments`.
- `src/components/ClientBooking.jsx` - live client slot picker.
- `src/components/BarberDashboard.jsx` - barber-only reservation dashboard.
- `database/schema.sql` - tables, RLS, RPC booking functions, and double-booking prevention.
