-- Limite stricte : 5 photos maximum par boutique.

create or replace function public.enforce_shop_storefront_photos_limit()
returns trigger
language plpgsql
as $$
declare
  photo_count integer;
begin
  select count(*)
  into photo_count
  from public.shop_storefront_photos
  where shop_id = new.shop_id;

  if photo_count >= 5 then
    raise exception using
      errcode = 'P0001',
      message = 'PHOTO_LIMIT_REACHED',
      detail = 'Maximum 5 photos par boutique.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_shop_storefront_photos_limit on public.shop_storefront_photos;
create trigger trg_enforce_shop_storefront_photos_limit
before insert on public.shop_storefront_photos
for each row execute function public.enforce_shop_storefront_photos_limit();
