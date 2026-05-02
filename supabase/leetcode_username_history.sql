create table if not exists public.leetcode_username_history (
  ip_address text primary key,
  usernames jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.record_valid_leetcode_username(
  p_ip_address text,
  p_username text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.leetcode_username_history (ip_address, usernames)
  values (p_ip_address, jsonb_build_array(p_username))
  on conflict (ip_address) do update
  set
    usernames = case
      when exists (
        select 1
        from jsonb_array_elements_text(leetcode_username_history.usernames) as existing(username)
        where lower(existing.username) = lower(p_username)
      )
      then leetcode_username_history.usernames
      else leetcode_username_history.usernames || jsonb_build_array(p_username)
    end,
    updated_at = now();
end;
$$;
