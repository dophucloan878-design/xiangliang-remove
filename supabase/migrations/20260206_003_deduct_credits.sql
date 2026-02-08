create or replace function public.deduct_credits(p_user_id uuid, p_amount int)
returns table (
  ok boolean,
  error_code text,
  credits_remaining int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_status text;
  v_period_end timestamptz;
  v_credits int;
begin
  if p_amount is null or p_amount <= 0 then
    return query select false, 'INVALID_AMOUNT'::text, null::int;
    return;
  end if;

  -- Atomic update prevents concurrent over-deduction.
  update public.subscriptions s
     set credits_remaining = s.credits_remaining - p_amount,
         updated_at = now()
   where s.user_id = p_user_id
     and s.plan in ('pro', 'business')
     and s.status = 'active'
     and s.current_period_end > now()
     and s.credits_remaining >= p_amount
  returning s.credits_remaining
  into v_credits;

  if found then
    return query select true, null::text, v_credits;
    return;
  end if;

  select s.plan, s.status, s.current_period_end, s.credits_remaining
    into v_plan, v_status, v_period_end, v_credits
  from public.subscriptions s
  where s.user_id = p_user_id;

  if not found
     or v_plan not in ('pro', 'business')
     or v_status <> 'active'
     or v_period_end <= now() then
    return query select false, 'UPGRADE_REQUIRED'::text, null::int;
    return;
  end if;

  return query select false, 'INSUFFICIENT_CREDITS'::text, coalesce(v_credits, 0);
end;
$$;

-- Security recommendations:
-- 1) Do not expose direct execute to anon/authenticated.
-- 2) Call through trusted server code with service role key only.
revoke all on function public.deduct_credits(uuid, int) from public, anon, authenticated;
grant execute on function public.deduct_credits(uuid, int) to service_role;
