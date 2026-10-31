-- 會員可選擇「記住我的生辰」，下次登入自動帶入並排盤。
-- 生辰放在獨立的表，不放進 profiles：profiles 存著會員等級，用戶不能改；這張表則是本人可以讀寫、刪除自己那一筆。
-- 不開放管理員讀取，會員後台不會顯示任何人的生辰。刪除帳號時一併刪除。
create table public.birth_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  birth_date date not null,
  birth_time time,
  no_time boolean not null default false,
  gender text not null check (gender in ('女', '男')),
  city integer not null default 0,
  name text check (char_length(name) <= 5),
  question text not null default 'move',
  years integer not null default 1,
  solar boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.birth_profiles enable row level security;

create policy "read own birth" on public.birth_profiles for select using (user_id = auth.uid());
create policy "insert own birth" on public.birth_profiles for insert with check (user_id = auth.uid());
create policy "update own birth" on public.birth_profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own birth" on public.birth_profiles for delete using (user_id = auth.uid());
