-- Mabcor Facilities Solutions website backend
-- Run this entire file ONCE in the Mabcor Supabase project: Dashboard > SQL Editor.
-- It creates the shared website content row, authentication policies and public media bucket.

create table if not exists public.website_content (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.mabcor_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mabcor_website_content_updated_at on public.website_content;
create trigger mabcor_website_content_updated_at
before update on public.website_content
for each row execute function public.mabcor_set_updated_at();

alter table public.website_content enable row level security;

drop policy if exists "Public reads Mabcor website content" on public.website_content;
create policy "Public reads Mabcor website content"
on public.website_content for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated manages Mabcor website content" on public.website_content;
create policy "Authenticated manages Mabcor website content"
on public.website_content for all
to authenticated
using (true)
with check (true);

-- Seed the database with the exact content/image assignments packaged in this version.
insert into public.website_content (id, data)
values ('main', $mabcor${"hero":["assets/media/media-005.webp","assets/media/media-006.webp","assets/media/media-008.webp","assets/media/media-016.webp","assets/media/media-019.webp","assets/media/media-020.webp","assets/media/media-025.webp","assets/media/media-027.webp","assets/media/media-036.webp","assets/media/media-039.webp","assets/media/media-040.webp","assets/media/media-041.webp","assets/media/media-045.webp","assets/media/media-046.webp","assets/media/media-047.webp","assets/media/media-051.webp","assets/media/media-052.webp","assets/media/media-057.webp","assets/media/media-058.webp","assets/media/media-059.webp","assets/media/media-071.webp","assets/media/media-072.webp","assets/media/media-074.webp","assets/media/media-075.webp","assets/media/media-077.webp","assets/media/media-078.webp","assets/media/media-080.webp","assets/media/media-082.webp","assets/media/media-084.webp","assets/media/media-087.webp","assets/media/media-089.webp","assets/media/media-088.webp","assets/media/media-092.webp","assets/media/media-093.webp","assets/media/media-095.webp","assets/media/media-096.webp","assets/media/media-107.webp","assets/media/media-114.webp","assets/media/media-128.webp","assets/media/media-130.webp","assets/media/media-132.webp","assets/media/media-139.webp","assets/media/media-140.webp","assets/media/media-148.webp","assets/media/media-154.webp","assets/media/media-165.webp"],"capabilities":{"civil":"assets/media/media-087.webp","building":"assets/media/media-147.webp","electrical":"assets/media/media-154.webp","mechanical":"assets/media/media-036.webp","water":"assets/media/media-073.webp","facilities":"assets/media/media-034.webp","logistics":"assets/media/media-040.webp","plant":"assets/media/media-023.webp"},"slots":{"logistics-main":["assets/media/media-040.webp","assets/media/media-041.webp","assets/media/media-045.webp","assets/media/media-140.webp","assets/media/media-141.webp"],"project-civil":["assets/media/media-030.webp","assets/media/media-084.webp","assets/media/media-087.webp","assets/media/media-089.webp","assets/media/media-108.webp"],"project-site":["assets/media/media-051.webp","assets/media/media-052.webp","assets/media/media-058.webp","assets/media/media-074.webp","assets/media/media-082.webp"],"project-electrical":["assets/media/media-148.webp","assets/media/media-154.webp","assets/media/media-148.webp","assets/media/media-159.webp","assets/media/media-161.webp"],"project-logistics":["assets/media/media-039.webp","assets/media/media-040.webp","assets/media/media-042.webp","assets/media/media-043.webp","assets/media/media-045.webp"],"plant-main":["assets/media/media-023.webp","assets/media/media-024.webp","assets/media/media-092.webp","assets/media/media-093.webp","assets/media/media-114.webp"],"plant-support":["assets/media/media-021.webp","assets/media/media-022.webp","assets/media/media-078.webp","assets/media/media-130.webp","assets/media/media-004.webp"],"plant-fleet":["assets/media/media-037.webp","assets/media/media-046.webp","assets/media/media-041.webp","assets/media/media-139.webp","assets/media/media-002.webp"],"parallax-civil":["assets/media/media-084.webp","assets/media/media-087.webp","assets/media/media-095.webp","assets/media/media-052.webp","assets/media/media-016.webp"],"parallax-logistics":["assets/media/media-040.webp","assets/media/media-041.webp","assets/media/media-045.webp","assets/media/media-140.webp","assets/media/media-141.webp"]},"contact":{"phone":"+27 78 350 4926","phoneHref":"+27783504926","email":"info@mabombacorp.co.za","location":"South Africa","whatsapp":"27783504926"},"news":[{"category":"COMMUNITY · RUGBY","title":"Mabcor supports Excelsior Rugby Club in Middelburg","text":"Mabcor Facilities Solutions donated playing kits to Excelsior Rugby Club in Middelburg as part of its support for local sport and community development.","image":"assets/media/media-110.webp"},{"category":"COMMUNITY · FOOTBALL","title":"Mabcor supports Dickson Pirates FC in Noupoort","text":"Mabcor Facilities Solutions donated football kits to Dickson Pirates FC in Noupoort, supporting grassroots sport and youth participation in the local community.","image":"assets/media/media-131.webp"}]}$mabcor$::jsonb)
on conflict (id) do update set data = excluded.data;

-- Public media bucket for images uploaded from Website Admin.
insert into storage.buckets (id, name, public)
values ('website-media', 'website-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public reads Mabcor website media" on storage.objects;
create policy "Public reads Mabcor website media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'website-media');

drop policy if exists "Authenticated uploads Mabcor website media" on storage.objects;
create policy "Authenticated uploads Mabcor website media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'website-media');

drop policy if exists "Authenticated updates Mabcor website media" on storage.objects;
create policy "Authenticated updates Mabcor website media"
on storage.objects for update
to authenticated
using (bucket_id = 'website-media')
with check (bucket_id = 'website-media');

drop policy if exists "Authenticated deletes Mabcor website media" on storage.objects;
create policy "Authenticated deletes Mabcor website media"
on storage.objects for delete
to authenticated
using (bucket_id = 'website-media');
