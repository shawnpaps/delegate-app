-- Migration: Initial schema for Delegate
-- Tables: profiles, subscriptions, tasks, task_responses, push_subscriptions
-- pg_cron job for follow-up checks every 15 minutes

-- Enable required extensions
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  full_name text,
  business_name text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text check (plan in ('starter', 'pro')),
  status text check (status in ('active', 'trialing', 'canceled', 'past_due')),
  trial_ends_at timestamptz,
  current_period_end timestamptz
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  assignee_name text,
  assignee_email text,
  assignee_phone text,
  due_at timestamptz,
  follow_up_at timestamptz,
  follow_up_sent_at timestamptz,
  owner_notified_at timestamptz,
  status text default 'active' check (status in ('active', 'awaiting_response', 'completed', 'snoozed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "Users can read own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Task responses table
create table if not exists public.task_responses (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks not null,
  channel text check (channel in ('sms', 'email')),
  body text,
  received_at timestamptz default now()
);

alter table public.task_responses enable row level security;

create policy "Users can read responses for own tasks"
  on public.task_responses for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_responses.task_id
      and tasks.user_id = auth.uid()
    )
  );

create policy "Service role can insert responses"
  on public.task_responses for insert
  with check (true);

-- Push subscriptions table
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id);

-- Updated_at trigger for tasks
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row
  execute function public.handle_updated_at();

-- pg_cron job: check for due follow-ups every 15 minutes
select cron.schedule(
  'follow-up-check',
  '*/15 * * * *',
  $$
    select net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/follow-up',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    )
  $$
);
