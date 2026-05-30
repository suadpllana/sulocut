create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$ begin
  create type public.profile_role as enum ('client', 'barber', 'owner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'walk_in');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  role public.profile_role not null default 'client',
  phone text,
  created_at timestamptz not null default now(),
  constraint staff_profiles_require_auth check (role = 'client' or auth_user_id is not null)
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_minutes int not null check (duration_minutes > 0 and duration_minutes % 30 = 0),
  price numeric(10, 2) not null check (price >= 0),
  active boolean not null default true
);

create table if not exists public.barber_services (
  barber_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (barber_id, service_id)
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  constraint schedules_valid_time check (
    start_time < end_time and start_time >= time '10:00' and end_time <= time '21:00'
  )
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete restrict,
  barber_id uuid not null references public.profiles(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status public.appointment_status not null default 'confirmed',
  slot_range tsrange generated always as (
    tsrange(appointment_date + start_time, appointment_date + end_time, '[)')
  ) stored,
  created_at timestamptz not null default now(),
  constraint appointments_valid_time check (
    start_time < end_time
    and start_time >= time '10:00'
    and end_time <= time '21:00'
    and extract(minute from start_time)::int in (0, 30)
    and extract(second from start_time)::int = 0
    and extract(minute from end_time)::int in (0, 30)
    and extract(second from end_time)::int = 0
  ),
  constraint appointments_no_barber_overlap exclude using gist (
    barber_id with =,
    slot_range with &&
  ) where (status in ('pending', 'confirmed', 'walk_in', 'completed'))
);

create index if not exists appointments_barber_day_idx
  on public.appointments (barber_id, appointment_date, start_time);

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.current_profile_role()
returns public.profile_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.book_client_appointment(
  p_barber_id uuid,
  p_service_id uuid,
  p_appointment_date date,
  p_start_time time,
  p_full_name text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_duration int;
  v_end_time time;
  v_day_of_week int;
  v_appointment_id uuid;
begin
  if length(trim(coalesce(p_full_name, ''))) < 3 then
    raise exception 'Full name is required';
  end if;

  if length(trim(coalesce(p_phone, ''))) < 5 then
    raise exception 'Phone number is required';
  end if;

  select s.duration_minutes
    into v_duration
  from public.services s
  join public.barber_services bs on bs.service_id = s.id
  where s.id = p_service_id
    and bs.barber_id = p_barber_id
    and s.active = true;

  if v_duration is null then
    raise exception 'This service is not available for the selected barber';
  end if;

  if p_start_time < time '10:00'
    or p_start_time >= time '21:00'
    or extract(minute from p_start_time)::int not in (0, 30) then
    raise exception 'Appointments must start on a 30 minute interval between 10:00 and 21:00';
  end if;

  v_end_time := (p_start_time + make_interval(mins => v_duration))::time;
  if v_end_time > time '21:00' then
    raise exception 'Appointment ends after closing time';
  end if;

  v_day_of_week := extract(dow from p_appointment_date)::int;
  if not exists (
    select 1 from public.schedules
    where barber_id = p_barber_id
      and day_of_week = v_day_of_week
      and start_time <= p_start_time
      and end_time >= v_end_time
  ) then
    raise exception 'The selected barber is not scheduled for this time';
  end if;

  insert into public.profiles (full_name, phone, role)
  values (trim(p_full_name), trim(p_phone), 'client')
  returning id into v_client_id;

  insert into public.appointments (
    client_id, barber_id, service_id, appointment_date, start_time, end_time, status
  )
  values (
    v_client_id, p_barber_id, p_service_id, p_appointment_date, p_start_time, v_end_time, 'confirmed'
  )
  returning id into v_appointment_id;

  return v_appointment_id;
exception
  when exclusion_violation then
    raise exception 'This time was just booked. Please choose another slot';
end;
$$;

create or replace function public.book_walk_in_appointment(
  p_service_id uuid,
  p_appointment_date date,
  p_start_time time,
  p_full_name text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_barber_id uuid := public.current_profile_id();
  v_client_id uuid;
  v_duration int;
  v_end_time time;
  v_day_of_week int;
  v_appointment_id uuid;
begin
  if v_barber_id is null or public.current_profile_role() not in ('barber', 'owner') then
    raise exception 'Only barbers can create walk-ins';
  end if;

  if length(trim(coalesce(p_full_name, ''))) < 3 then
    raise exception 'Full name is required';
  end if;

  if length(trim(coalesce(p_phone, ''))) < 5 then
    raise exception 'Phone number is required';
  end if;

  select s.duration_minutes into v_duration
  from public.services s
  join public.barber_services bs on bs.service_id = s.id
  where s.id = p_service_id and bs.barber_id = v_barber_id and s.active = true;

  if v_duration is null then
    raise exception 'Service is not available';
  end if;

  v_end_time := (p_start_time + make_interval(mins => v_duration))::time;

  v_day_of_week := extract(dow from p_appointment_date)::int;
  if not exists (
    select 1 from public.schedules
    where barber_id = v_barber_id
      and day_of_week = v_day_of_week
      and start_time <= p_start_time
      and end_time >= v_end_time
  ) then
    raise exception 'You are not scheduled for this time';
  end if;

  insert into public.profiles (full_name, phone, role)
  values (trim(p_full_name), trim(p_phone), 'client')
  returning id into v_client_id;

  insert into public.appointments (
    client_id, barber_id, service_id, appointment_date, start_time, end_time, status
  )
  values (
    v_client_id, v_barber_id, p_service_id, p_appointment_date, p_start_time, v_end_time, 'walk_in'
  )
  returning id into v_appointment_id;

  return v_appointment_id;
exception
  when exclusion_violation then
    raise exception 'This time overlaps with an existing booking';
end;
$$;

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.barber_services enable row level security;
alter table public.schedules enable row level security;
alter table public.appointments enable row level security;

drop policy if exists "public can read barbers" on public.profiles;
create policy "public can read barbers" on public.profiles
  for select to anon, authenticated
  using (role = 'barber' or id = public.current_profile_id() or public.current_profile_role() = 'owner');

drop policy if exists "barbers can read their own clients" on public.profiles;
create policy "barbers can read their own clients" on public.profiles
  for select to authenticated
  using (
    id = public.current_profile_id()
    or public.current_profile_role() = 'owner'
    or exists (
      select 1 from public.appointments a
      where a.client_id = profiles.id
        and a.barber_id = public.current_profile_id()
    )
  );

drop policy if exists "public can read active services" on public.services;
create policy "public can read active services" on public.services
  for select to anon, authenticated
  using (active = true);

drop policy if exists "public can read barber services" on public.barber_services;
create policy "public can read barber services" on public.barber_services
  for select to anon, authenticated
  using (true);

drop policy if exists "public can read schedules" on public.schedules;
create policy "public can read schedules" on public.schedules
  for select to anon, authenticated
  using (true);

drop policy if exists "public can read occupied appointment slots" on public.appointments;
create policy "public can read occupied appointment slots" on public.appointments
  for select to anon
  using (status in ('pending', 'confirmed', 'walk_in', 'completed'));

drop policy if exists "barbers manage own appointments" on public.appointments;
create policy "barbers manage own appointments" on public.appointments
  for all to authenticated
  using (barber_id = public.current_profile_id() or public.current_profile_role() = 'owner')
  with check (barber_id = public.current_profile_id() or public.current_profile_role() = 'owner');

grant execute on function public.book_client_appointment(uuid, uuid, date, time, text, text) to anon, authenticated;
grant execute on function public.book_walk_in_appointment(uuid, date, time, text, text) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.appointments;
exception
  when duplicate_object then null;
end $$;

-- Example seed data after creating a Supabase Auth user for each barber:
-- insert into public.profiles (auth_user_id, full_name, role, phone)
-- values ('AUTH_USER_UUID_HERE', 'Alex Barber', 'barber', '+36 30 000 0000');
-- insert into public.services (name, duration_minutes, price)
-- values ('Haircut', 30, 5000), ('Haircut + Beard', 60, 8500);
-- insert into public.barber_services (barber_id, service_id)
-- select p.id, s.id from public.profiles p cross join public.services s where p.role = 'barber';
-- insert into public.schedules (barber_id, day_of_week, start_time, end_time)
-- select id, day, time '10:00', time '21:00'
-- from public.profiles cross join generate_series(1, 6) day
-- where role = 'barber';
