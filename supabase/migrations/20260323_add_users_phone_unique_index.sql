do $$
begin
  if not exists (
    select 1
    from users
    where phone is not null
    group by phone
    having count(*) > 1
  ) then
    create unique index if not exists users_phone_unique_idx
      on users (phone)
      where phone is not null;
  end if;
end
$$;
