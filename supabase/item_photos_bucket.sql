-- Bucket público para fotos dos itens do almoxarifado GIFT
-- Rode no SQL Editor do Supabase se precisar recriar/configurar o bucket manualmente.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'giftx-almox-siqueira-2026-item-photos',
  'giftx-almox-siqueira-2026-item-photos',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='giftx_almox_item_photos_public_read'
  ) THEN
    CREATE POLICY "giftx_almox_item_photos_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'giftx-almox-siqueira-2026-item-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='giftx_almox_item_photos_insert'
  ) THEN
    CREATE POLICY "giftx_almox_item_photos_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'giftx-almox-siqueira-2026-item-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='giftx_almox_item_photos_update'
  ) THEN
    CREATE POLICY "giftx_almox_item_photos_update"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'giftx-almox-siqueira-2026-item-photos')
    WITH CHECK (bucket_id = 'giftx-almox-siqueira-2026-item-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='giftx_almox_item_photos_delete'
  ) THEN
    CREATE POLICY "giftx_almox_item_photos_delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'giftx-almox-siqueira-2026-item-photos');
  END IF;
END $$;
