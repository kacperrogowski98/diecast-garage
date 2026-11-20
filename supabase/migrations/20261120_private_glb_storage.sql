-- Diecast Garage private 3D GLB storage.
-- Apply in Supabase SQL Editor only after setting up authentication.
-- Files belong to auth.uid()/glb/<encoded-release-id>.glb.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('diecast-models','diecast-models',false,26214400,array['model/gltf-binary','application/octet-stream'])
on conflict(id) do update set
 public=false,
 file_size_limit=excluded.file_size_limit,
 allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Diecast 3D models read own" on storage.objects;
create policy "Diecast 3D models read own" on storage.objects
 for select to authenticated
 using(bucket_id='diecast-models' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "Diecast 3D models insert own" on storage.objects;
create policy "Diecast 3D models insert own" on storage.objects
 for insert to authenticated
 with check(bucket_id='diecast-models' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "Diecast 3D models update own" on storage.objects;
create policy "Diecast 3D models update own" on storage.objects
 for update to authenticated
 using(bucket_id='diecast-models' and (storage.foldername(name))[1]=auth.uid()::text)
 with check(bucket_id='diecast-models' and (storage.foldername(name))[1]=auth.uid()::text);
