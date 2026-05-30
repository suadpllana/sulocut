-- ============================================================
-- Barber Brothers Database Seed Script
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor)
-- because it creates auth.users which requires superuser privileges.
-- ============================================================

-- ============================================================
-- 1. Create 5 Auth users in auth.users
-- ============================================================
-- We use fixed UUIDs for all users so we can resolve conflicts on the primary key (id)
-- Passwords: [Name]2026!
-- ============================================================

INSERT INTO auth.users (
  id, 
  instance_id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  raw_app_meta_data, 
  raw_user_meta_data, 
  aud, 
  role, 
  created_at, 
  updated_at, 
  confirmation_token
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'uraniku@barberbrothers.style',
    crypt('Uraniku2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Uraniku"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    ''
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'hysi@barberbrothers.style',
    crypt('Hysi2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Hysi"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    ''
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'ylli@barberbrothers.style',
    crypt('Ylli2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ylli"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    ''
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'edi@barberbrothers.style',
    crypt('Edi2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Edi"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    ''
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000000',
    'arti@barberbrothers.style',
    crypt('Arti2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Arti"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    ''
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Create corresponding profiles linked to the Auth users
-- ============================================================
-- We use fixed UUIDs for profiles so we can resolve conflicts on the primary key (id)
-- ============================================================
INSERT INTO public.profiles (id, auth_user_id, full_name, role, phone)
VALUES
  ('11111111-1111-1111-1111-999999999991', '11111111-1111-1111-1111-111111111111', 'Uraniku', 'barber', '+38345990079'),
  ('22222222-2222-2222-2222-999999999992', '22222222-2222-2222-2222-222222222222', 'Hysi', 'barber', '+38345990079'),
  ('33333333-3333-3333-3333-999999999993', '33333333-3333-3333-3333-333333333333', 'Ylli', 'barber', '+38345990079'),
  ('44444444-4444-4444-4444-999999999994', '44444444-4444-4444-4444-444444444444', 'Edi', 'barber', '+38345990079'),
  ('55555555-5555-5555-5555-999999999995', '55555555-5555-5555-5555-555555555555', 'Arti', 'barber', '+38345990079')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Create the 4 services with prices in EUR (€)
-- ============================================================
-- We use fixed UUIDs for services so we can resolve conflicts on the primary key (id)
-- ============================================================
INSERT INTO public.services (id, name, duration_minutes, price) 
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Haircut',        30,  5.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Beard trim',     30,  2.00),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Face treatment',  60, 15.00),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'All-in-One',     60, 15.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Link all barbers to all services
-- ============================================================
INSERT INTO public.barber_services (barber_id, service_id)
SELECT p.id, s.id 
FROM public.profiles p 
CROSS JOIN public.services s 
WHERE p.role = 'barber'
ON CONFLICT (barber_id, service_id) DO NOTHING;

-- ============================================================
-- 5. Schedules: Mon-Sat (1-6), 10:00-21:00
-- ============================================================
-- We check for existing schedule rows using a NOT EXISTS condition 
-- since schedules don't have a simple unique key on day_of_week
-- ============================================================
INSERT INTO public.schedules (barber_id, day_of_week, start_time, end_time)
SELECT p.id, day, time '10:00', time '21:00'
FROM public.profiles p 
CROSS JOIN generate_series(1, 6) day
WHERE p.role = 'barber'
  AND NOT EXISTS (
    SELECT 1 FROM public.schedules s 
    WHERE s.barber_id = p.id AND s.day_of_week = day
  );
