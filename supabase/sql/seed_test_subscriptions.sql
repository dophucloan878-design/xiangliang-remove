-- Replace these emails with real test accounts in auth.users
-- 1) free user
-- 2) expired user
-- 3) pro user with credits
-- 4) pro user without credits
-- 5) business user with credits

with users_map as (
  select id, email
  from auth.users
  where email in (
    'free-test@example.com',
    'expired-test@example.com',
    'pro-credit-test@example.com',
    'pro-nocredit-test@example.com',
    'business-credit-test@example.com'
  )
),
seed as (
  select
    id as user_id,
    case
      when email = 'free-test@example.com' then 'free'
      when email = 'expired-test@example.com' then 'pro'
      when email = 'pro-credit-test@example.com' then 'pro'
      when email = 'pro-nocredit-test@example.com' then 'pro'
      when email = 'business-credit-test@example.com' then 'business'
      else 'free'
    end as plan,
    case
      when email = 'expired-test@example.com' then 'expired'
      else 'active'
    end as status,
    case
      when email = 'expired-test@example.com' then now() - interval '1 day'
      else now() + interval '30 days'
    end as current_period_end,
    case
      when email = 'pro-credit-test@example.com' then 5
      when email = 'pro-nocredit-test@example.com' then 0
      when email = 'business-credit-test@example.com' then 20
      else 0
    end as credits_remaining
  from users_map
)
insert into public.subscriptions (user_id, plan, status, current_period_end, credits_remaining, updated_at)
select user_id, plan, status, current_period_end, credits_remaining, now()
from seed
on conflict (user_id)
do update set
  plan = excluded.plan,
  status = excluded.status,
  current_period_end = excluded.current_period_end,
  credits_remaining = excluded.credits_remaining,
  updated_at = now();

-- Verify seeded rows
select s.user_id, u.email, s.plan, s.status, s.current_period_end, s.credits_remaining
from public.subscriptions s
join auth.users u on u.id = s.user_id
where u.email in (
  'free-test@example.com',
  'expired-test@example.com',
  'pro-credit-test@example.com',
  'pro-nocredit-test@example.com',
  'business-credit-test@example.com'
)
order by u.email;
