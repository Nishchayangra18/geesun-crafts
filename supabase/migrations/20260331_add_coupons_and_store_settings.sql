create table if not exists coupons (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  title text,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric not null default 0,
  minimum_order_amount numeric not null default 0,
  maximum_discount numeric,
  free_shipping boolean not null default false,
  is_active boolean not null default true,
  usage_limit integer,
  used_count integer not null default 0,
  start_date timestamptz,
  end_date timestamptz,
  applicable_categories text[],
  applicable_product_ids uuid[],
  created_at timestamptz not null default now()
);

create index if not exists idx_coupons_code on coupons(code);
create index if not exists idx_coupons_active on coupons(is_active);

create table if not exists store_settings (
  key text primary key,
  value text not null
);

insert into store_settings(key, value)
values ('free_shipping_threshold', '2000')
on conflict (key) do nothing;

alter table products
  add column if not exists category text,
  add column if not exists is_active boolean not null default true;

alter table carts
  add column if not exists applied_coupon_code text;

alter table orders
  add column if not exists coupon_code text,
  add column if not exists discount_amount numeric not null default 0,
  add column if not exists shipping_amount numeric not null default 0;
