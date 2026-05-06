-- Storage policy — যে কেউ দেখতে পারবে
create policy "public can view covers"
on storage.objects for select
using ( bucket_id = 'covers' );

create policy "public can view avatars"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Authenticated user upload করতে পারবে
create policy "auth users can upload covers"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'covers' );

create policy "auth users can upload avatars"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'avatars' );

-- নিজের file delete/update করতে পারবে
create policy "auth users can update covers"
on storage.objects for update
to authenticated
using ( bucket_id = 'covers' );

create policy "auth users can update avatars"
on storage.objects for update
to authenticated
using ( bucket_id = 'avatars' );