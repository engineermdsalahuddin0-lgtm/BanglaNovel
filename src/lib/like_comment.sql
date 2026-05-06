-- Comments & Reviews table
create table comments (
  id uuid default gen_random_uuid() primary key,
  novel_id uuid references novels(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  rating int check (rating >= 1 and rating <= 5), -- null হলে শুধু comment, 1-5 হলে review
  parent_id uuid references comments(id) on delete cascade, -- reply এর জন্য
  likes int default 0,
  created_at timestamptz default now()
);

alter table comments enable row level security;

create policy "comments viewable by all" on comments for select using (true);
create policy "auth users can comment" on comments for insert to authenticated with check (auth.uid() = user_id);
create policy "users can delete own comments" on comments for delete using (auth.uid() = user_id);
create policy "users can update own comments" on comments for update using (auth.uid() = user_id);