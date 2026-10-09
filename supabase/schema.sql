-- KT 금왕점 중고폰 사이트 — 상품 DB · 사진 저장소 · 관리자 권한
-- 손님은 읽기만, used_admins 에 등록된 이메일로 로그인한 사람만 등록/수정/삭제할 수 있습니다.

-- 관리자 목록 (이메일)
create table if not exists public.used_admins (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.used_admins enable row level security;

-- 관리자 확인 함수는 API에 노출되지 않는 private 스키마에 둡니다
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_used_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.used_admins a
    where lower(a.email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
$$;
revoke all on function private.is_used_admin() from public, anon;
grant execute on function private.is_used_admin() to authenticated;

drop policy if exists "admins read self" on public.used_admins;
create policy "admins read self" on public.used_admins
  for select to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')));

-- 판매 상품
create table if not exists public.used_phones (
  id text primary key,                         -- 상품번호 GW-001
  brand text not null default 'apple' check (brand in ('apple', 'samsung', 'etc')),
  model text not null,
  storage text,
  color text,
  color_hex text default '#cccccc',
  grade text not null default 'A' check (grade in ('S', 'A', 'B', 'C')),
  battery smallint check (battery between 0 and 100),
  battery_replaced boolean not null default false,
  price integer not null check (price >= 0),
  market_price integer check (market_price >= 0),
  status text not null default 'sale' check (status in ('sale', 'reserved', 'sold')),
  images text[] not null default '{}',
  includes text[] not null default '{}',
  note_ko text,
  note_en text,
  arrived date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.used_phones enable row level security;

create or replace function public.used_phones_touch()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists used_phones_touch on public.used_phones;
create trigger used_phones_touch before update on public.used_phones
  for each row execute function public.used_phones_touch();

drop policy if exists "anyone can view phones" on public.used_phones;
create policy "anyone can view phones" on public.used_phones
  for select to anon, authenticated using (true);
drop policy if exists "admins insert phones" on public.used_phones;
create policy "admins insert phones" on public.used_phones
  for insert to authenticated with check ((select private.is_used_admin()));
drop policy if exists "admins update phones" on public.used_phones;
create policy "admins update phones" on public.used_phones
  for update to authenticated using ((select private.is_used_admin())) with check ((select private.is_used_admin()));
drop policy if exists "admins delete phones" on public.used_phones;
create policy "admins delete phones" on public.used_phones
  for delete to authenticated using ((select private.is_used_admin()));

-- 사진 저장소 (공개 읽기, 관리자만 업로드/삭제)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('used-phones', 'used-phones', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins list phone photos" on storage.objects;
create policy "admins list phone photos" on storage.objects
  for select to authenticated using (bucket_id = 'used-phones' and (select private.is_used_admin()));
drop policy if exists "admins upload phone photos" on storage.objects;
create policy "admins upload phone photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'used-phones' and (select private.is_used_admin()));
drop policy if exists "admins update phone photos" on storage.objects;
create policy "admins update phone photos" on storage.objects
  for update to authenticated using (bucket_id = 'used-phones' and (select private.is_used_admin()));
drop policy if exists "admins delete phone photos" on storage.objects;
create policy "admins delete phone photos" on storage.objects
  for delete to authenticated using (bucket_id = 'used-phones' and (select private.is_used_admin()));

-- 관리자 추가: insert into public.used_admins (email) values ('직원@이메일.com');
