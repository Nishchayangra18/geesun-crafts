alter table if exists orders
  add column if not exists subtotal_amount numeric not null default 0,
  add column if not exists payment_method text,
  add column if not exists payment_status text not null default 'pending';

alter table if exists orders
  drop constraint if exists orders_payment_status_check;

alter table if exists orders
  add constraint orders_payment_status_check
  check (payment_status in ('pending', 'mock_paid', 'cod_pending', 'failed'));

