alter table if exists products
  add column if not exists article_code text,
  add column if not exists set_type text,
  add column if not exists frame text,
  add column if not exists max_quantity integer;

update products
set max_quantity = greatest(coalesce(quantity, 0), 10)
where max_quantity is null or max_quantity <= 0;

alter table if exists products
  alter column max_quantity set default 10;

alter table if exists products
  alter column max_quantity set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_max_quantity_positive'
  ) then
    alter table products
      add constraint products_max_quantity_positive check (max_quantity > 0);
  end if;
end
$$;
