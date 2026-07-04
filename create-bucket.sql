insert into storage.buckets (id, name, public)
values ('gallery-media', 'gallery-media', true)
on conflict (id) do nothing;

create policy "Public Access" on storage.objects for select to public using ( bucket_id = 'gallery-media' );
create policy "Auth Upload" on storage.objects for insert to authenticated with check ( bucket_id = 'gallery-media' );
create policy "Auth Delete" on storage.objects for delete to authenticated using ( bucket_id = 'gallery-media' );
