alter table if exists products
  add column if not exists gallery_images text[] not null default '{}'::text[];
