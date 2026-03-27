create table if not exists restock_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  product_id uuid not null references products(id) on delete cascade,
  notified boolean not null default false,
  created_at timestamptz not null default now(),
  unique(email, product_id)
);

create index if not exists idx_restock_subscriptions_product_id
  on restock_subscriptions(product_id);

create index if not exists idx_restock_subscriptions_notified
  on restock_subscriptions(notified);
