-- Recreate stock RPCs in case older environments missed the inventory migration
-- and force PostgREST schema cache refresh.

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
      (value->>'product_id')::uuid as request_product_id,
      (value->>'quantity')::integer as request_quantity
    from jsonb_array_elements(p_items)
  ),
  grouped_items as (
    select ri.request_product_id, sum(ri.request_quantity)::integer as request_quantity
    from request_items ri
    group by ri.request_product_id
  )
  select count(*) into missing_count
  from grouped_items gi
  left join products p on p.id = gi.request_product_id
  where p.id is null;

  if missing_count > 0 then
    raise exception 'One or more products do not exist';
  end if;

  if exists (
    with request_items as (
      select
        (value->>'product_id')::uuid as request_product_id,
        (value->>'quantity')::integer as request_quantity
      from jsonb_array_elements(p_items)
    )
    select 1 from request_items ri where ri.request_quantity is null or ri.request_quantity <= 0
  ) then
    raise exception 'Each item quantity must be a positive integer';
  end if;

  if exists (
    with request_items as (
      select
        (value->>'product_id')::uuid as request_product_id,
        (value->>'quantity')::integer as request_quantity
      from jsonb_array_elements(p_items)
    ),
    grouped_items as (
      select ri.request_product_id, sum(ri.request_quantity)::integer as request_quantity
      from request_items ri
      group by ri.request_product_id
    )
    select 1
    from grouped_items gi
    join products p on p.id = gi.request_product_id
    where p.quantity < gi.request_quantity
  ) then
    raise exception 'Insufficient stock for one or more products';
  end if;

  return query
  with request_items as (
    select
      (value->>'product_id')::uuid as request_product_id,
      (value->>'quantity')::integer as request_quantity
    from jsonb_array_elements(p_items)
  ),
  grouped_items as (
    select ri.request_product_id, sum(ri.request_quantity)::integer as request_quantity
    from request_items ri
    group by ri.request_product_id
  ),
  updated as (
    update products p
    set quantity = p.quantity - gi.request_quantity
    from grouped_items gi
    where p.id = gi.request_product_id
    returning
      p.id as updated_product_id,
      gi.request_quantity as requested_quantity,
      p.price as updated_unit_price,
      p.quantity as updated_remaining_quantity
  )
  select
    u.updated_product_id as product_id,
    u.requested_quantity as quantity,
    u.updated_unit_price as unit_price,
    u.updated_remaining_quantity as remaining_quantity
  from updated u;
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
      (value->>'product_id')::uuid as request_product_id,
      (value->>'quantity')::integer as request_quantity
    from jsonb_array_elements(p_items)
  ),
  grouped_items as (
    select ri.request_product_id, sum(ri.request_quantity)::integer as request_quantity
    from request_items ri
    where ri.request_quantity is not null and ri.request_quantity > 0
    group by ri.request_product_id
  )
  update products p
  set quantity = p.quantity + gi.request_quantity
  from grouped_items gi
  where p.id = gi.request_product_id;
end;
$$;

notify pgrst, 'reload schema';
