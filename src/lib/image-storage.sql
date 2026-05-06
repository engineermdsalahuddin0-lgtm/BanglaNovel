create policy "public read avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "public read covers" on storage.objects for select using (bucket_id = 'covers');
create policy "public read chapters" on storage.objects for select using (bucket_id = 'chapters');
create policy "public read stickers" on storage.objects for select using (bucket_id = 'stickers');
create policy "public read comments" on storage.objects for select using (bucket_id = 'comments');

create policy "auth upload avatars" on storage.objects for insert to authenticated with check (bucket_id = 'avatars');
create policy "auth upload covers" on storage.objects for insert to authenticated with check (bucket_id = 'covers');
create policy "auth upload chapters" on storage.objects for insert to authenticated with check (bucket_id = 'chapters');
create policy "auth upload stickers" on storage.objects for insert to authenticated with check (bucket_id = 'stickers');
create policy "auth upload comments" on storage.objects for insert to authenticated with check (bucket_id = 'comments');

create policy "auth update avatars" on storage.objects for update to authenticated using (bucket_id = 'avatars');
create policy "auth update covers" on storage.objects for update to authenticated using (bucket_id = 'covers');
create policy "auth delete own" on storage.objects for delete to authenticated using (auth.uid()::text = (storage.foldername(name))[1]);