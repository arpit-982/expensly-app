-- Add the comments column to the transactions table if it doesn't exist
alter table public.transactions
add column if not exists comments text[] null;
