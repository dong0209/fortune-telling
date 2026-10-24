-- 職運羅盤 會員與付款回報
-- 等級：free 基礎版、paid 付費版、vip VIP

create table public.plans (
  id text primary key check (id in ('paid', 'vip')),
  name text not null,
  price integer not null check (price >= 0),
  days integer not null check (days > 0),
  description text not null default '',
  sort integer not null default 0
);

-- 價格與天數請依實際方案修改（也可之後在 Supabase 後台的 Table Editor 直接改）
insert into public.plans (id, name, price, days, description, sort) values
  ('paid', '付費版', 299, 365, '完整八字、紫微斗數、星盤，36 個月時機曲線，offer 比較與現職適配', 1),
  ('vip',  'VIP',   699, 365, '付費版全部內容，加上奇門遁甲擇日擇時、人類圖、主管／同事合盤', 2);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  tier text not null default 'free' check (tier in ('free', 'paid', 'vip')),
  tier_expires_at timestamptz,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null references public.plans (id),
  amount integer not null check (amount >= 0),
  method text not null check (method in ('linepay', 'jkopay', 'bank')),
  reference text not null check (char_length(reference) between 1 and 40),
  payer_name text check (char_length(payer_name) <= 40),
  note text check (char_length(note) <= 200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id)
);
create index payment_requests_status_idx on public.payment_requests (status, created_at);

-- 新使用者註冊時自動建立 profile
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

alter table public.plans enable row level security;
alter table public.profiles enable row level security;
alter table public.payment_requests enable row level security;

create policy "plans are public" on public.plans for select using (true);

create policy "read own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
-- 不開放任何前端 update：等級只能透過下方的核准函式變更

create policy "read own requests" on public.payment_requests for select using (user_id = auth.uid() or public.is_admin());
create policy "submit own request" on public.payment_requests for insert
  with check (user_id = auth.uid() and status = 'pending' and reviewed_at is null and reviewed_by is null and reject_reason is null);

-- 送出時金額一律以方案價格為準，避免前端竄改
create function public.set_request_amount() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select price into new.amount from public.plans where id = new.plan;
  return new;
end;
$$;
create trigger payment_requests_amount before insert on public.payment_requests
  for each row execute function public.set_request_amount();

-- 管理員核准：開通等級並計算到期日（同等級續約從原到期日往後加）
create function public.approve_payment(request_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  r public.payment_requests;
  p public.profiles;
  d integer;
  base timestamptz;
begin
  if not public.is_admin() then raise exception '只有管理員可以核准'; end if;
  select * into r from public.payment_requests where id = request_id for update;
  if r.id is null then raise exception '找不到這筆付款回報'; end if;
  if r.status <> 'pending' then raise exception '這筆付款回報已處理過'; end if;
  select days into d from public.plans where id = r.plan;
  select * into p from public.profiles where id = r.user_id for update;
  if p.tier = 'vip' and p.tier_expires_at > now() and r.plan = 'paid' then
    raise exception '這位會員目前是有效的 VIP，請退回這筆付費版回報';
  end if;
  -- 同等級續約：從原到期日往後加；升級或已過期：從今天起算
  base := case when p.tier = r.plan and p.tier_expires_at > now() then p.tier_expires_at else now() end;
  update public.profiles set tier = r.plan, tier_expires_at = base + make_interval(days => d) where id = r.user_id;
  update public.payment_requests set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid() where id = request_id;
end;
$$;

create function public.reject_payment(request_id uuid, reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '只有管理員可以退回'; end if;
  update public.payment_requests set status = 'rejected', reject_reason = left(reason, 200), reviewed_at = now(), reviewed_by = auth.uid()
  where id = request_id and status = 'pending';
  if not found then raise exception '找不到待處理的付款回報'; end if;
end;
$$;

revoke execute on function public.approve_payment(uuid) from public, anon;
revoke execute on function public.reject_payment(uuid, text) from public, anon;
grant execute on function public.approve_payment(uuid) to authenticated;
grant execute on function public.reject_payment(uuid, text) to authenticated;
