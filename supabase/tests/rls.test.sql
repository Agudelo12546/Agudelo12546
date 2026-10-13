-- Pruebas de seguridad a nivel de filas (RLS). Correr con: pnpm db:test
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

-- ─── Datos ──────────────────────────────────────────────────────────────────
-- Partimos de una base vacía dentro de la transacción (se revierte al final).
delete from public.companies;
delete from auth.users;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@ejemplo.co',
   '{"full_name":"Ana Gómez","phone":"3001234567","age":"21","city":"Medellín","stage":"student","consent_version":"2026-10-borrador"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@ejemplo.co',
   '{"full_name":"Beto Ruiz","phone":"3109876543","age":"23","city":"Bogotá","stage":"recent_graduate"}'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@ejemplo.co',
   '{"full_name":"Admin Trabajo Ya","phone":"3000000000","age":"30","city":"Medellín","stage":"professional"}');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000ad';

insert into public.companies (id, name, slug, published) values
  ('10000000-0000-0000-0000-000000000001', 'Empresa publicada (ejemplo)', 'publicada', true),
  ('10000000-0000-0000-0000-000000000002', 'Empresa oculta (ejemplo)', 'oculta', false);
insert into public.jobs (company_id, title, status) values
  ('10000000-0000-0000-0000-000000000001', 'Practicante publicado', 'published'),
  ('10000000-0000-0000-0000-000000000001', 'Borrador', 'draft'),
  ('10000000-0000-0000-0000-000000000002', 'Publicado en empresa oculta', 'published');
insert into public.interview_videos (company_id, title, kind, url) values
  ('10000000-0000-0000-0000-000000000001', 'Visible', 'link', 'https://youtu.be/abc'),
  ('10000000-0000-0000-0000-000000000002', 'Oculto', 'link', 'https://youtu.be/def');

insert into storage.objects (bucket_id, name) values
  ('interview-videos', '10000000-0000-0000-0000-000000000001/visible.mp4'),
  ('interview-videos', '10000000-0000-0000-0000-000000000002/oculto.mp4');

-- El registro crea perfil y consentimientos.
select is((select count(*)::int from public.profiles), 3, 'el registro crea un perfil por usuario');
select is((select count(*)::int from public.consents where user_id = '00000000-0000-0000-0000-00000000000a'), 2,
  'el registro guarda consentimiento de datos y términos');

-- ─── Como Ana (candidata) ───────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is((select count(*)::int from public.profiles), 1, 'candidata ve solo su perfil');
select is((select full_name from public.profiles), 'Ana Gómez', 'y es el suyo');
select is((select count(*)::int from public.consents), 2, 'candidata ve solo sus consentimientos');
select is((select count(*)::int from public.companies), 1, 'candidata ve solo empresas publicadas');
select is((select count(*)::int from public.jobs), 1, 'candidata ve solo vacantes publicadas de empresas publicadas');
select is((select count(*)::int from public.interview_videos), 1, 'candidata ve solo videos de empresas publicadas');

select lives_ok($$update public.profiles set city = 'Envigado' where id = '00000000-0000-0000-0000-00000000000a'$$,
  'candidata puede editar sus datos');
select throws_ok($$update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000a'$$,
  '42501', null, 'candidata no puede volverse admin');

update public.profiles set city = 'Hackeado' where id = '00000000-0000-0000-0000-00000000000b';
select throws_ok($$insert into public.companies (name, slug) values ('X', 'x')$$,
  '42501', null, 'candidata no puede crear empresas');
select is((select count(*)::int from public.jobs where status = 'draft'), 0, 'candidata no ve borradores');
select throws_ok($$insert into public.consents (user_id, kind, version) values ('00000000-0000-0000-0000-00000000000b', 'terms', 'v')$$,
  '42501', null, 'candidata no puede registrar consentimientos de otra persona');

-- Storage: ve solo los archivos de empresas publicadas y no puede subir.
select is((select count(*)::int from storage.objects where bucket_id = 'interview-videos' and name like '10000000-%'), 1,
  'candidata ve solo archivos de video de empresas publicadas');
select is((select name from storage.objects where bucket_id = 'interview-videos' and name like '10000000-%'),
  '10000000-0000-0000-0000-000000000001/visible.mp4', 'y es el de la empresa publicada');
select throws_ok($$insert into storage.objects (bucket_id, name, owner) values ('interview-videos', '10000000-0000-0000-0000-000000000001/x.mp4', '00000000-0000-0000-0000-00000000000a')$$,
  '42501', null, 'candidata no puede subir videos');

-- ─── Como admin ─────────────────────────────────────────────────────────────
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ad","role":"authenticated"}';
select is((select count(*)::int from public.profiles), 3, 'admin ve todos los perfiles');
select is((select count(*)::int from public.companies), 2, 'admin ve todas las empresas');
select is((select count(*)::int from public.jobs), 3, 'admin ve todas las vacantes');
select lives_ok($$insert into public.companies (name, slug) values ('Nueva (ejemplo)', 'nueva')$$, 'admin crea empresas');

reset role;
select is((select city from public.profiles where id = '00000000-0000-0000-0000-00000000000b'), 'Bogotá',
  'la candidata no logró modificar el perfil de otra persona');

select * from finish();
rollback;
