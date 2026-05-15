update products
set category = lower(style)
where category is null
  and lower(style) in ('abstract', 'spiritual', 'landscape');

create index if not exists idx_products_category
  on products(category);
