-- Inventory migration for Geesun Crafts
-- Safe for existing data

alter table if exists products
  add column if not exists quantity integer;

update products
set quantity = 0
where quantity is null;

alter table if exists products
  alter column quantity set default 0;

alter table if exists products
  alter column quantity set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_quantity_non_negative'
  ) then
    alter table products
      add constraint products_quantity_non_negative check (quantity >= 0);
  end if;
end
$$;

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
