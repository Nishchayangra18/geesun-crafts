alter table if exists users
  add column if not exists last_login timestamptz default now();

update users
set last_login = coalesce(last_login, created_at, now())
where last_login is null;
