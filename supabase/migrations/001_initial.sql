-- Users (extends auth.users)
create table public.profiles (
  id uuid references auth.users primary key,
  full_balance_payer boolean default true,
  preferred_currency text default 'Avios',
  created_at timestamptz default now()
);

-- User's cards
create table public.user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  card_id text not null,
  added_at date not null,
  annual_fee_start_date date,
  is_active boolean default true,
  current_year_spend_gbp numeric default 0,
  notes text,
  created_at timestamptz default now()
);

-- Benefit utilisation (tracks spend/use per reset period)
create table public.benefit_utilisations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  user_card_id uuid references public.user_cards not null,
  benefit_id text not null,
  period_key text not null,
  used_gbp numeric default 0,
  used_at timestamptz,
  created_at timestamptz default now(),
  unique(user_card_id, benefit_id, period_key)
);

-- Loyalty balances
create table public.loyalty_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  programme text not null,
  balance integer default 0,
  updated_at timestamptz default now(),
  unique(user_id, programme)
);

-- Sign-up bonuses
create table public.sign_up_bonuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  user_card_id uuid references public.user_cards not null,
  bonus_points integer not null,
  bonus_currency text not null,
  spend_target_gbp numeric not null,
  current_spend_gbp numeric default 0,
  start_date date not null,
  deadline_date date not null,
  claimed boolean default false,
  created_at timestamptz default now()
);

-- Transfer bonus windows (admin-maintained)
create table public.transfer_bonus_windows (
  id uuid primary key default gen_random_uuid(),
  from_programme text not null,
  to_programme text not null,
  bonus_pct integer not null,
  start_date date not null,
  end_date date not null,
  source_url text,
  created_at timestamptz default now()
);

-- Mentor chat history
create table public.mentor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.user_cards enable row level security;
alter table public.benefit_utilisations enable row level security;
alter table public.loyalty_balances enable row level security;
alter table public.sign_up_bonuses enable row level security;
alter table public.mentor_messages enable row level security;

create policy "users own their data" on public.profiles for all using (auth.uid() = id);
create policy "users own their cards" on public.user_cards for all using (auth.uid() = user_id);
create policy "users own their utilisations" on public.benefit_utilisations for all using (auth.uid() = user_id);
create policy "users own their balances" on public.loyalty_balances for all using (auth.uid() = user_id);
create policy "users own their bonuses" on public.sign_up_bonuses for all using (auth.uid() = user_id);
create policy "users own their messages" on public.mentor_messages for all using (auth.uid() = user_id);
create policy "transfer bonuses are public" on public.transfer_bonus_windows for select using (true);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
