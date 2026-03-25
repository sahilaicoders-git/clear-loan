-- 1. Create the loans table
create table public.loans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  principal numeric not null,
  annual_interest_rate numeric not null,
  tenure_years integer not null,
  monthly_prepayment numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS) to keep data totally private
alter table public.loans enable row level security;

-- 3. Create security policies so users can ONLY access their own rows
create policy "Users can insert their own loans."
  on public.loans for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own loans."
  on public.loans for select
  using (auth.uid() = user_id);

create policy "Users can update their own loans."
  on public.loans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own loans."
  on public.loans for delete
  using (auth.uid() = user_id);
