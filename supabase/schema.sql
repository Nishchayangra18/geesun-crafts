-- Geesun Crafts core schema
-- Run this in Supabase SQL editor

create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  password_hash text,
  phone text unique,
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  last_login timestamptz default now()
);

create table if not exists carts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id)
);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  article_code text,
  description text,
  image text,
  gallery_images text[] not null default '{}'::text[],
  price numeric not null,
  quantity integer not null default 0 check (quantity >= 0),
  max_quantity integer not null default 10 check (max_quantity > 0),
  set_type text,
  style text,
  medium text,
  frame text,
  size text,
  dimensions text,
  artist text,
  featured boolean default false,
  bestseller boolean default false,
  created_at timestamptz default now()
);

create table if not exists cart_items (
  id uuid primary key default uuid_generate_v4(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz default now(),
  unique(cart_id, product_id)
);

create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric not null,
  status text not null default 'pending',
  shipping_address jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid,
  quantity int not null,
  price numeric not null,
  created_at timestamptz default now()
);

create table if not exists wishlist (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

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

create table if not exists event_logs (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create or replace function validate_and_decrement_stock(p_items jsonb)
returns table (
  product_id uuid,
  quantity integer,
  unit_price numeric,
  remaining_quantity integer
)
language plpgsql
as $$
declare
  missing_count integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order items are required';
  end if;

  with request_items as (
    select
      (value->>'product_id')::uuid as product_id,
      (value->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items)
  ),
  grouped_items as (
    select product_id, sum(quantity)::integer as quantity
    from request_items
    group by product_id
  )
  select count(*) into missing_count
  from grouped_items gi
  left join products p on p.id = gi.product_id
  where p.id is null;

  if missing_count > 0 then
    raise exception 'One or more products do not exist';
  end if;

  if exists (
    with request_items as (
      select
        (value->>'product_id')::uuid as product_id,
        (value->>'quantity')::integer as quantity
      from jsonb_array_elements(p_items)
    )
    select 1 from request_items where quantity is null or quantity <= 0
  ) then
    raise exception 'Each item quantity must be a positive integer';
  end if;

  if exists (
    with request_items as (
      select
        (value->>'product_id')::uuid as product_id,
        (value->>'quantity')::integer as quantity
      from jsonb_array_elements(p_items)
    ),
    grouped_items as (
      select product_id, sum(quantity)::integer as quantity
      from request_items
      group by product_id
    )
    select 1
    from grouped_items gi
    join products p on p.id = gi.product_id
    where p.quantity < gi.quantity
  ) then
    raise exception 'Insufficient stock for one or more products';
  end if;

  return query
  with request_items as (
    select
      (value->>'product_id')::uuid as product_id,
      (value->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items)
  ),
  grouped_items as (
    select product_id, sum(quantity)::integer as quantity
    from request_items
    group by product_id
  ),
  updated as (
    update products p
    set quantity = p.quantity - gi.quantity
    from grouped_items gi
    where p.id = gi.product_id
    returning p.id, gi.quantity, p.price, p.quantity
  )
  select id, quantity, price, quantity
  from updated;
end;
$$;

create or replace function restore_stock(p_items jsonb)
returns void
language plpgsql
as $$
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return;
  end if;

  with request_items as (
    select
      (value->>'product_id')::uuid as product_id,
      (value->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items)
  ),
  grouped_items as (
    select product_id, sum(quantity)::integer as quantity
    from request_items
    where quantity is not null and quantity > 0
    group by product_id
  )
  update products p
  set quantity = p.quantity + gi.quantity
  from grouped_items gi
  where p.id = gi.product_id;
end;
$$;
