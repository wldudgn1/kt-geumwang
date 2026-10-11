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

-- 판매 장부 (관리자만 읽기/쓰기, 손님에게는 보이지 않음)
-- 열 구성은 기존 구글시트 "중고폰 판매 리스트"와 같음 + 매입가
create table if not exists public.used_sales (
  id uuid primary key default gen_random_uuid(),
  arrived date,                                -- 입고일
  sold_at date,                                -- 판매일
  phone_id text,                               -- 홈페이지에 올렸던 폰이면 상품번호
  model text,                                  -- 모델명
  color text,                                  -- 색상
  storage text,                                -- 용량
  imei text,                                   -- IMEI
  grade text,                                  -- 등급
  ref_price text,                              -- 단가표상 A급 (자유 입력)
  sale_price integer check (sale_price >= 0),  -- 판매금액
  cost integer check (cost >= 0),              -- 매입가
  margin integer,                              -- 마진 (직접 입력. 비면 판매금액 - 매입가로 표시)
  channel text,                                -- 판매채널 (예: 당근74)
  memo text,                                   -- 기타
  deposit text,                                -- 입금 (신한/카뱅/입금전 등)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.used_sales enable row level security;
create index if not exists used_sales_sold_at_idx on public.used_sales (sold_at desc);
create trigger used_sales_touch before update on public.used_sales
  for each row execute function public.used_phones_touch();
create policy "admins read sales" on public.used_sales for select to authenticated using ((select private.is_used_admin()));
create policy "admins insert sales" on public.used_sales for insert to authenticated with check ((select private.is_used_admin()));
create policy "admins update sales" on public.used_sales for update to authenticated using ((select private.is_used_admin())) with check ((select private.is_used_admin()));
create policy "admins delete sales" on public.used_sales for delete to authenticated using ((select private.is_used_admin()));

-- 재고 (관리자만 읽기/쓰기) — 열 구성은 기존 구글시트 재고 탭과 같음
create table if not exists public.used_stock (
  id uuid primary key default gen_random_uuid(),
  arrived date,          -- 입고일
  model text,            -- 모델명
  color text,            -- 색상
  storage text,          -- 용량
  imei text,             -- IMEI
  grade text,            -- 등급
  ref_price text,        -- 단가표상 A급
  memo text,             -- 기타
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.used_stock enable row level security;
create index if not exists used_stock_arrived_idx on public.used_stock (arrived);
create trigger used_stock_touch before update on public.used_stock
  for each row execute function public.used_phones_touch();
create policy "admins read stock" on public.used_stock for select to authenticated using ((select private.is_used_admin()));
create policy "admins insert stock" on public.used_stock for insert to authenticated with check ((select private.is_used_admin()));
create policy "admins update stock" on public.used_stock for update to authenticated using ((select private.is_used_admin())) with check ((select private.is_used_admin()));
create policy "admins delete stock" on public.used_stock for delete to authenticated using ((select private.is_used_admin()));
