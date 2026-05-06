-- ============================================
-- WEBNOVEL BANGLADESH — FULL DATABASE SCHEMA
-- Supabase SQL Editor 
-- ============================================


-- 1. PROFILES (users এর extra info)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  role text not null default 'reader', -- 'reader' | 'writer' | 'admin'
  is_subscribed boolean default false,
  subscription_expires_at timestamptz,
  total_tips_received numeric default 0,
  created_at timestamptz default now()
);

-- 2. NOVELS (বইয়ের তথ্য)
create table novels (
  id uuid default gen_random_uuid() primary key,
  writer_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  slug text unique not null,
  description text,
  cover_url text,
  genre text, -- 'romance' | 'fantasy' | 'thriller' | 'horror' | 'other'
  status text default 'ongoing', -- 'ongoing' | 'completed' | 'hiatus'
  is_free boolean default true,
  total_chapters int default 0,
  total_views int default 0,
  total_likes int default 0,
  is_featured boolean default false,
  is_contract boolean default false, -- Harry Potter model
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. CHAPTERS
create table chapters (
  id uuid default gen_random_uuid() primary key,
  novel_id uuid references novels(id) on delete cascade not null,
  chapter_number int not null,
  title text not null,
  content text not null,
  is_free boolean default true, -- false হলে subscription লাগবে
  word_count int default 0,
  views int default 0,
  published_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(novel_id, chapter_number)
);

-- 4. SUBSCRIPTIONS (payment record)
create table subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  plan text not null, -- 'basic_49' | 'premium_99'
  amount numeric not null,
  payment_method text, -- 'bkash' | 'nagad' | 'rocket' | 'stripe'| 'bitcoin'
  payment_number text, -- যে number থেকে দিয়েছে
  transaction_id text,
  status text default 'pending', -- 'pending' | 'active' | 'expired'
  activated_by uuid references profiles(id), -- admin id
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- 5. TIPS
create table tips (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references profiles(id) on delete set null,
  to_writer_id uuid references profiles(id) on delete cascade not null,
  novel_id uuid references novels(id) on delete set null,
  amount numeric not null,
  platform_cut numeric not null, -- 30%
  writer_gets numeric not null,  -- 70%
  message text,
  payment_method text,
  transaction_id text,
  status text default 'pending', -- 'pending' | 'confirmed'
  created_at timestamptz default now()
);

-- 6. READS (reading history + ad tracking)
create table reads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  chapter_id uuid references chapters(id) on delete cascade not null,
  novel_id uuid references novels(id) on delete cascade not null,
  read_at timestamptz default now(),
  unique(user_id, chapter_id)
);

-- 7. LIKES
create table likes (
  user_id uuid references profiles(id) on delete cascade,
  novel_id uuid references novels(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(user_id, novel_id)
);

-- 8. CONTESTS
create table contests (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  genre text,
  entry_fee numeric default 100,
  prize_pool numeric default 0,
  platform_cut_percent numeric default 25,
  max_entries int,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text default 'upcoming', -- 'upcoming' | 'active' | 'judging' | 'completed'
  winner_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- 9. CONTEST ENTRIES
create table contest_entries (
  id uuid default gen_random_uuid() primary key,
  contest_id uuid references contests(id) on delete cascade not null,
  writer_id uuid references profiles(id) on delete cascade not null,
  novel_id uuid references novels(id) on delete set null,
  entry_title text not null,
  entry_content text,
  payment_status text default 'pending',
  transaction_id text,
  votes int default 0,
  rank int,
  created_at timestamptz default now(),
  unique(contest_id, writer_id)
);

-- 10. CONTRACTS (IP / Harry Potter model)
create table contracts (
  id uuid default gen_random_uuid() primary key,
  writer_id uuid references profiles(id) on delete cascade not null,
  novel_id uuid references novels(id) on delete set null,
  monthly_salary numeric not null,
  research_fund numeric default 0,
  ip_rights_held_by text default 'platform',
  adaptation_rights jsonb default '{"tv": true, "film": true, "game": true, "merch": true}',
  contract_start timestamptz,
  contract_end timestamptz,
  status text default 'draft', -- 'draft' | 'active' | 'expired' | 'terminated'
  notes text,
  created_at timestamptz default now()
);

-- 11. AI TOKENS
create table ai_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  tokens_purchased int default 0,
  tokens_used int default 0,
  amount_paid numeric default 0,
  pack_type text, -- 'starter_49' | 'pro_99'
  payment_status text default 'pending',
  transaction_id text,
  created_at timestamptz default now()
);
--12. Writing activity tracking
create table writing_activity (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  activity_date date not null default current_date,
  words_written int default 0,
  chapters_published int default 0,
  points_earned int default 0,
  unique(user_id, activity_date)
);

--13. Points/rewards log
create table points_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  points int not null,
  reason text not null, -- 'daily_chapter', 'word_milestone', 'streak_bonus' etc
  reference_id uuid, -- chapter_id বা novel_id
  created_at timestamptz default now()
);

-- Add points column to profiles
alter table profiles add column if not exists total_points int default 0;
alter table profiles add column if not exists current_streak int default 0;
alter table profiles add column if not exists longest_streak int default 0;
alter table profiles add column if not exists last_active_date date;

alter table writing_activity enable row level security;
alter table points_log enable row level security;

create policy "users view own activity" on writing_activity for select using (auth.uid() = user_id);
create policy "users insert own activity" on writing_activity for insert with check (auth.uid() = user_id);
create policy "users update own activity" on writing_activity for update using (auth.uid() = user_id);
create policy "users view own points" on points_log for select using (auth.uid() = user_id);
create policy "users insert own points" on points_log for insert with check (auth.uid() = user_id);

-- 13.
-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- নতুন user signup হলে profile auto তৈরি হবে
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Chapter publish হলে novel এর total_chapters update হবে
create or replace function update_novel_chapter_count()
returns trigger as $$
begin
  update novels
  set total_chapters = (
    select count(*) from chapters where novel_id = NEW.novel_id
  ),
  updated_at = now()
  where id = NEW.novel_id;
  return NEW;
end;
$$ language plpgsql;

create trigger on_chapter_insert
  after insert on chapters
  for each row execute procedure update_novel_chapter_count();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

alter table profiles enable row level security;
alter table novels enable row level security;
alter table chapters enable row level security;
alter table subscriptions enable row level security;
alter table tips enable row level security;
alter table reads enable row level security;
alter table likes enable row level security;
alter table contests enable row level security;
alter table contest_entries enable row level security;
alter table contracts enable row level security;
alter table ai_tokens enable row level security;

-- Profiles: নিজের profile সবাই দেখতে পারবে, নিজেরটাই edit করতে পারবে
create policy "profiles are viewable by everyone" on profiles for select using (true);
create policy "users can update own profile" on profiles for update using (auth.uid() = id);

-- Novels: সবাই দেখতে পারবে, writer নিজেরটা manage করবে
create policy "novels are viewable by everyone" on novels for select using (true);
create policy "writers can insert novels" on novels for insert with check (auth.uid() = writer_id);
create policy "writers can update own novels" on novels for update using (auth.uid() = writer_id);

-- Chapters: free chapter সবাই, paid chapter শুধু subscriber
create policy "free chapters viewable by all" on chapters for select
  using (is_free = true);
create policy "paid chapters for subscribers" on chapters for select
  using (
    is_free = false and exists (
      select 1 from profiles
      where id = auth.uid()
      and is_subscribed = true
      and subscription_expires_at > now()
    )
  );
create policy "writers can manage own chapters" on chapters for all
  using (
    exists (
      select 1 from novels where id = novel_id and writer_id = auth.uid()
    )
  );

-- Reads: নিজের reading history
create policy "users can insert own reads" on reads for insert with check (auth.uid() = user_id);
create policy "users can view own reads" on reads for select using (auth.uid() = user_id);

-- Likes
create policy "users can manage own likes" on likes for all using (auth.uid() = user_id);
create policy "likes viewable by all" on likes for select using (true);

-- Contests: সবাই দেখতে পারবে
create policy "contests viewable by all" on contests for select using (true);
create policy "contest entries viewable by all" on contest_entries for select using (true);
create policy "writers can enter contests" on contest_entries for insert with check (auth.uid() = writer_id);

-- Subscriptions, Tips, AI Tokens: নিজেরটাই দেখবে
create policy "users view own subscriptions" on subscriptions for select using (auth.uid() = user_id);
create policy "users insert own subscriptions" on subscriptions for insert with check (auth.uid() = user_id);
create policy "users view own tips" on tips for select using (auth.uid() = from_user_id or auth.uid() = to_writer_id);
create policy "users insert tips" on tips for insert with check (auth.uid() = from_user_id);
create policy "users view own ai tokens" on ai_tokens for select using (auth.uid() = user_id);
create policy "users insert ai tokens" on ai_tokens for insert with check (auth.uid() = user_id);

-- Contracts: writer নিজেরটা দেখবে
create policy "writers view own contracts" on contracts for select using (auth.uid() = writer_id);

-- ============================================
-- SAMPLE DATA (test case)
-- ============================================

-- Test করতে চাইলে নিচের comment সরাও:
/*
insert into novels (writer_id, title, slug, description, genre, is_free)
values (
  auth.uid(),
  'অন্ধকারের রাজপুত্র',
  'andhokarer-rajputro',
  'একটি রহস্যময় fantasy উপন্যাস...',
  'fantasy',
  true
);
*/
