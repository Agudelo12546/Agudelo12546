-- Trabajo Ya · Fase 1: perfiles, consentimientos, empresas, vacantes y videos de entrevistas.
-- Toda tabla nace con RLS. Los roles se guardan en profiles.role y solo un admin los cambia.

create extension if not exists citext;

-- ─── Tipos ──────────────────────────────────────────────────────────────────
create type public.user_role as enum ('candidate', 'company', 'university', 'admin');
create type public.career_stage as enum ('student', 'recent_graduate', 'professional');
create type public.job_status as enum ('draft', 'published', 'closed');
create type public.video_kind as enum ('upload', 'link');

-- ─── Perfiles ───────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'candidate',
  full_name text not null check (char_length(full_name) between 3 and 120),
  email citext not null,
  phone text not null check (phone ~ '^3[0-9]{9}$'),
  -- Privada: solo para estadísticas agregadas. Nunca se muestra a empresas ni va en la hoja de vida.
  age smallint not null check (age between 15 and 99),
  city text not null check (char_length(city) between 2 and 80),
  stage public.career_stage not null,
  university text check (char_length(university) <= 120),
  career text check (char_length(career) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.age is
  'Privada. Solo estadísticas agregadas; nunca visible para empresas ni incluida en la hoja de vida.';

-- ─── Consentimientos (Ley 1581 de 2012) ─────────────────────────────────────
create table public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('data_policy', 'terms')),
  version text not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, kind, version)
);

-- ─── Helpers de rol ─────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Solo un admin puede cambiar el rol o el correo de un perfil. Las sesiones de servidor
-- (service_role, migraciones, scripts) no pasan por este control.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.email is distinct from old.email)
     and coalesce(auth.role(), '') in ('authenticated', 'anon')
     and not public.is_admin() then
    raise exception 'No puedes cambiar el rol ni el correo de tu perfil.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el perfil y guarda los consentimientos a partir de los metadatos del registro.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, full_name, email, phone, age, city, stage, university, career)
  values (
    new.id,
    m ->> 'full_name',
    new.email,
    m ->> 'phone',
    (m ->> 'age')::smallint,
    m ->> 'city',
    (m ->> 'stage')::public.career_stage,
    nullif(m ->> 'university', ''),
    nullif(m ->> 'career', '')
  );

  if m ? 'consent_version' then
    insert into public.consents (user_id, kind, version)
    values (new.id, 'data_policy', m ->> 'consent_version'),
           (new.id, 'terms', m ->> 'consent_version');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Empresas, vacantes y videos ────────────────────────────────────────────
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sector text check (char_length(sector) <= 80),
  city text check (char_length(city) <= 80),
  website text check (website is null or website ~ '^https://'),
  description text check (char_length(description) <= 4000),
  published boolean not null default false,
  -- Datos de ejemplo para desarrollo. Nunca deben existir en producción.
  is_sample boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 140),
  location text check (char_length(location) <= 120),
  looking_for text check (char_length(looking_for) <= 4000),
  description text check (char_length(description) <= 10000),
  status public.job_status not null default 'draft',
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index jobs_company_idx on public.jobs (company_id);

create table public.interview_videos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete set null,
  title text not null check (char_length(title) between 2 and 160),
  recruiter_name text check (char_length(recruiter_name) <= 120),
  recruiter_role text check (char_length(recruiter_role) <= 120),
  kind public.video_kind not null,
  storage_path text,
  url text,
  transcript text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint video_source check (
    (kind = 'upload' and storage_path is not null and url is null)
    or (kind = 'link' and url ~ '^https://' and storage_path is null)
  )
);
create index interview_videos_company_idx on public.interview_videos (company_id);

create trigger companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger jobs_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.interview_videos enable row level security;

-- profiles: cada quien ve y edita lo suyo; el admin ve todo.
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- consents: cada quien ve los suyos y puede registrar nuevos; nadie los edita ni borra.
create policy consents_select on public.consents for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy consents_insert on public.consents for insert to authenticated
  with check (user_id = (select auth.uid()));

-- companies: los usuarios registrados ven las publicadas; el admin gestiona todo.
create policy companies_select on public.companies for select to authenticated
  using (published or (select public.is_admin()));
create policy companies_admin on public.companies for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- jobs: visibles si están publicadas y su empresa también.
create policy jobs_select on public.jobs for select to authenticated
  using (
    (status = 'published' and exists (
      select 1 from public.companies c where c.id = company_id and c.published))
    or (select public.is_admin())
  );
create policy jobs_admin on public.jobs for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- interview_videos: visibles si la empresa está publicada.
create policy videos_select on public.interview_videos for select to authenticated
  using (
    exists (select 1 from public.companies c where c.id = company_id and c.published)
    or (select public.is_admin())
  );
create policy videos_admin on public.interview_videos for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ─── Storage: videos de entrevistas ─────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'interview-videos', 'interview-videos', false, 2147483648,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do nothing;

-- Ruta: <company_id>/<archivo>. Leer: usuarios registrados si la empresa está publicada.
create policy interview_videos_read on storage.objects for select to authenticated
  using (
    bucket_id = 'interview-videos' and (
      (select public.is_admin())
      or exists (
        select 1 from public.companies c
        where c.published and c.id::text = (storage.foldername(objects.name))[1]
      )
    )
  );
create policy interview_videos_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'interview-videos' and (select public.is_admin()));
create policy interview_videos_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'interview-videos' and (select public.is_admin()));
create policy interview_videos_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'interview-videos' and (select public.is_admin()));
