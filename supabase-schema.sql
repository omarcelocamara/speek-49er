-- SPEEK 49er - Schema Supabase
-- Execute no SQL Editor do seu projeto Supabase

-- Tabela de reuniões
create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null,
  title text,
  transcript text,
  meeting_date timestamptz not null,
  created_at timestamptz default now()
);

-- Tabela de posts (gerados pela IA a partir das reuniões)
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null,
  meeting_id uuid not null references meetings(id) on delete cascade,
  content text not null,
  option_number int not null default 1,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- Índices para as consultas do dashboard
create index if not exists idx_posts_status on posts(status);
create index if not exists idx_posts_created_at on posts(created_at desc);
create index if not exists idx_posts_meeting_id on posts(meeting_id);

-- RLS (opcional): permitir leitura/escrita com anon key para desenvolvimento
-- Em produção, configure políticas por founder_id / auth.uid()
alter table meetings enable row level security;
alter table posts enable row level security;

create policy "Allow all for anon" on meetings for all using (true) with check (true);
create policy "Allow all for anon" on posts for all using (true) with check (true);

-- Tabela de founders (onboarding)
create table if not exists founders (
  id uuid primary key, -- mesmo id do auth
  name text not null,
  role text not null,
  whatsapp text,
  created_at timestamptz default now()
);

alter table founders enable row level security;

create policy "Allow all for anon" on founders for all using (true) with check (true);
