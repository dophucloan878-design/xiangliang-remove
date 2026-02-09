create table if not exists public.billing_records (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'paypal',
  provider_event_id text unique,
  provider_reference text,
  plan text check (plan in ('free', 'pro', 'business')),
  billing_cycle text check (billing_cycle in ('monthly', 'annual')),
  amount numeric(10, 2),
  currency text default 'USD',
  status text not null,
  refund_note text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists billing_records_user_created_idx
  on public.billing_records (user_id, created_at desc);

create index if not exists billing_records_reference_idx
  on public.billing_records (provider_reference);

alter table public.billing_records enable row level security;

drop policy if exists billing_records_select_own on public.billing_records;
create policy billing_records_select_own
on public.billing_records
for select
to authenticated
using (auth.uid() = user_id);

revoke all on public.billing_records from anon;
grant select on public.billing_records to authenticated;

create table if not exists public.usage_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free', 'pro', 'business')),
  image_count integer not null default 1 check (image_count > 0),
  processing_ms integer,
  status text not null check (status in ('success', 'failed', 'rate_limited', 'insufficient_credits')),
  failure_reason text,
  created_at timestamptz not null default now()
);

create index if not exists usage_logs_user_created_idx
  on public.usage_logs (user_id, created_at desc);

alter table public.usage_logs enable row level security;

drop policy if exists usage_logs_select_own on public.usage_logs;
create policy usage_logs_select_own
on public.usage_logs
for select
to authenticated
using (auth.uid() = user_id);

revoke all on public.usage_logs from anon;
grant select on public.usage_logs to authenticated;
