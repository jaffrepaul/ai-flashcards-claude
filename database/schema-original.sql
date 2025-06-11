-- Create custom types
create type card_difficulty as enum ('easy', 'medium', 'hard');
create type study_session_status as enum ('active', 'completed', 'paused');

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Decks table
create table public.decks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  tags text[],
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cards table
create table public.cards (
  id uuid default gen_random_uuid() primary key,
  deck_id uuid references public.decks(id) on delete cascade not null,
  front_content text not null,
  back_content text not null,
  difficulty card_difficulty default 'medium',
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Study sessions table
create table public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  deck_id uuid references public.decks(id) on delete cascade not null,
  status study_session_status default 'active',
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  total_cards integer default 0,
  correct_answers integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Card reviews table (for spaced repetition)
create table public.card_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  card_id uuid references public.cards(id) on delete cascade not null,
  session_id uuid references public.study_sessions(id) on delete cascade,
  is_correct boolean not null,
  review_time integer not null, -- time taken in seconds
  ease_factor real default 2.5, -- for spaced repetition algorithm
  interval_days integer default 1, -- days until next review
  next_review_date timestamp with time zone,
  reviewed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.study_sessions enable row level security;
alter table public.card_reviews enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Decks policies
create policy "Users can view own decks" on public.decks
  for select using (auth.uid() = user_id);

create policy "Users can view public decks" on public.decks
  for select using (is_public = true);

create policy "Users can insert own decks" on public.decks
  for insert with check (auth.uid() = user_id);

create policy "Users can update own decks" on public.decks
  for update using (auth.uid() = user_id);

create policy "Users can delete own decks" on public.decks
  for delete using (auth.uid() = user_id);

-- Cards policies
create policy "Users can view cards from accessible decks" on public.cards
  for select using (
    deck_id in (
      select id from public.decks 
      where user_id = auth.uid() or is_public = true
    )
  );

create policy "Users can insert cards to own decks" on public.cards
  for insert with check (
    deck_id in (select id from public.decks where user_id = auth.uid())
  );

create policy "Users can update cards in own decks" on public.cards
  for update using (
    deck_id in (select id from public.decks where user_id = auth.uid())
  );

create policy "Users can delete cards from own decks" on public.cards
  for delete using (
    deck_id in (select id from public.decks where user_id = auth.uid())
  );

-- Study sessions policies
create policy "Users can view own study sessions" on public.study_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert own study sessions" on public.study_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own study sessions" on public.study_sessions
  for update using (auth.uid() = user_id);

-- Card reviews policies
create policy "Users can view own card reviews" on public.card_reviews
  for select using (auth.uid() = user_id);

create policy "Users can insert own card reviews" on public.card_reviews
  for insert with check (auth.uid() = user_id);

create policy "Users can update own card reviews" on public.card_reviews
  for update using (auth.uid() = user_id);

-- Functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated at triggers
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.decks
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.cards
  for each row execute procedure public.handle_updated_at();