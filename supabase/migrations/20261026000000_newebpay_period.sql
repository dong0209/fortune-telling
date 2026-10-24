-- 藍新金流信用卡定期定額：每月自動扣款，每期扣款成功就延長 1 個月
-- 街口、轉帳的人工回報保留，改為每次開通 30 天，金額與信用卡每月金額相同

update public.plans set days = 30;
update public.plans set name = '付費版每月贊助', price = 899 where id = 'paid';
update public.plans set name = 'VIP 版每月贊助', price = 2399 where id = 'vip';

-- 每位會員每次在藍新建立的定期定額委託
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null references public.plans (id),
  amount integer not null check (amount > 0),
  mer_order_no text not null unique,          -- 我們送給藍新的訂單編號
  period_no text,                              -- 藍新回傳的委託單號，終止委託時要用
  status text not null default 'pending' check (status in ('pending', 'active', 'failed', 'terminated')),
  message text,                                -- 藍新回傳的最近一則訊息
  next_auth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  terminated_at timestamptz
);
create index subscriptions_user_idx on public.subscriptions (user_id, created_at desc);

-- 每一期扣款結果（成功與失敗都記錄）；trade_no 唯一，重複收到同一筆通知不會重複延長
create table public.subscription_charges (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  trade_no text unique,
  amount integer,
  success boolean not null,
  message text,
  times integer,                               -- 第幾期
  auth_at timestamptz,
  created_at timestamptz not null default now()
);
create index subscription_charges_sub_idx on public.subscription_charges (subscription_id, created_at desc);

alter table public.subscriptions enable row level security;
alter table public.subscription_charges enable row level security;

-- 前端只能讀；新增與修改一律由伺服器函式（service role）處理
create policy "read own subscriptions" on public.subscriptions for select
  using (user_id = auth.uid() or public.is_admin());
create policy "read own charges" on public.subscription_charges for select
  using (public.is_admin() or exists (select 1 from public.subscriptions s where s.id = subscription_id and s.user_id = auth.uid()));

-- 記錄一期扣款結果並延長會員資格。只給伺服器函式呼叫。
-- 延長規則：
--   同等級且未到期：從原到期日往後加 1 個月（保留轉帳開通的剩餘天數）
--   升級、換等級或已過期：從現在起算 1 個月，再加 3 天寬限，避免每月扣款時間稍晚於到期時間而短暫失去權限
--   目前是有效 VIP 卻收到付費版扣款：只記錄，不降級
create function public.record_subscription_charge(
  p_mer_order_no text, p_trade_no text, p_amount integer, p_success boolean,
  p_message text, p_times integer, p_auth_at timestamptz, p_next_auth_date date
) returns text
language plpgsql security definer set search_path = public as $$
declare
  s public.subscriptions;
  p public.profiles;
  inserted integer;
begin
  select * into s from public.subscriptions where mer_order_no = p_mer_order_no for update;
  if s.id is null then return 'unknown_order'; end if;

  insert into public.subscription_charges (subscription_id, trade_no, amount, success, message, times, auth_at)
  values (s.id, p_trade_no, p_amount, p_success, left(p_message, 200), p_times, p_auth_at)
  on conflict (trade_no) do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return 'duplicate'; end if;

  update public.subscriptions set
    message = left(p_message, 200),
    next_auth_date = coalesce(p_next_auth_date, next_auth_date),
    status = case when p_success and status in ('pending', 'failed') then 'active' else status end,
    updated_at = now()
  where id = s.id;

  if not p_success then return 'recorded_failure'; end if;
  if p_amount is distinct from s.amount then return 'amount_mismatch'; end if;

  select * into p from public.profiles where id = s.user_id for update;
  if p.tier = 'vip' and p.tier_expires_at > now() and s.plan = 'paid' then return 'kept_vip'; end if;
  update public.profiles set
    tier = s.plan,
    tier_expires_at = case
      when p.tier = s.plan and p.tier_expires_at > now() then p.tier_expires_at + interval '1 month'
      else now() + interval '1 month' + interval '3 days'
    end
  where id = s.user_id;
  return 'extended';
end;
$$;

revoke execute on function public.record_subscription_charge(text, text, integer, boolean, text, integer, timestamptz, date) from public, anon, authenticated;
grant execute on function public.record_subscription_charge(text, text, integer, boolean, text, integer, timestamptz, date) to service_role;
