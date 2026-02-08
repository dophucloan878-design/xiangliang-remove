create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free', 'pro', 'business')) default 'free',
  status text not null check (status in ('active', 'trialing', 'past_due', 'canceled', 'expired')) default 'active',
  current_period_end timestamptz not null default (now() + interval '30 day'),
  credits_remaining integer not null default 0 check (credits_remaining >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_plan_status_idx on public.subscriptions (plan, status);
create index if not exists subscriptions_period_idx on public.subscriptions (current_period_end);

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);

revoke all on public.subscriptions from anon;
grant select on public.subscriptions to authenticated;
