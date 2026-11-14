-- ============================================================
--  Base de datos del cuestionario (Supabase)
--  Pega todo esto en Supabase → SQL Editor → New query → Run.
--  Se puede correr más de una vez sin romper nada.
-- ============================================================

-- Progreso de cada alumno: mejores puntajes y preguntas que tiene pendientes
create table if not exists public.progreso (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  records    jsonb not null default '{}'::jsonb,   -- { "matematicas": 85, ... } mejor % por materia
  falladas   jsonb not null default '[]'::jsonb,   -- ["matematicas:abc123", ...] preguntas por repasar
  updated_at timestamptz not null default now()
);

-- Historial: una fila por cada ronda terminada
create table if not exists public.intentos (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo     text not null,
  aciertos   integer not null check (aciertos >= 0),
  total      integer not null check (total > 0),
  porcentaje integer not null check (porcentaje between 0 and 100),
  created_at timestamptz not null default now()
);
create index if not exists intentos_user_fecha on public.intentos (user_id, created_at desc);

-- Seguridad: cada alumno solo ve y cambia lo suyo
alter table public.progreso enable row level security;
alter table public.intentos enable row level security;

revoke all on public.progreso, public.intentos from anon;
grant select, insert, update, delete on public.progreso to authenticated;
grant select, insert, delete on public.intentos to authenticated;

drop policy if exists "progreso: ver el mio" on public.progreso;
drop policy if exists "progreso: crear el mio" on public.progreso;
drop policy if exists "progreso: editar el mio" on public.progreso;
drop policy if exists "progreso: borrar el mio" on public.progreso;
create policy "progreso: ver el mio"    on public.progreso for select to authenticated using ((select auth.uid()) = user_id);
create policy "progreso: crear el mio"  on public.progreso for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "progreso: editar el mio" on public.progreso for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "progreso: borrar el mio" on public.progreso for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "intentos: ver los mios" on public.intentos;
drop policy if exists "intentos: crear los mios" on public.intentos;
drop policy if exists "intentos: borrar los mios" on public.intentos;
create policy "intentos: ver los mios"    on public.intentos for select to authenticated using ((select auth.uid()) = user_id);
create policy "intentos: crear los mios"  on public.intentos for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "intentos: borrar los mios" on public.intentos for delete to authenticated using ((select auth.uid()) = user_id);
