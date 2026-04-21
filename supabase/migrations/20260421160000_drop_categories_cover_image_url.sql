-- Remove category cover images (shop cover_image_url unchanged).
alter table public.categories drop column if exists cover_image_url;
