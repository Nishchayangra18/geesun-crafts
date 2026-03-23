alter table if exists users
  add column if not exists password_hash text;
