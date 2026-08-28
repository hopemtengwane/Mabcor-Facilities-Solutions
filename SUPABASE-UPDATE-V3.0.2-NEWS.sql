-- Mabcor V3.0.2 news-name update
-- Run this in Supabase SQL Editor if the V3 database already exists.

update public.website_content
set data = jsonb_set(
  data,
  '{news}',
  $news$[{"category":"COMMUNITY · RUGBY","title":"Mabcor supports Excelsior Rugby Club in Middelburg","text":"Mabcor Facilities Solutions donated playing kits to Excelsior Rugby Club in Middelburg as part of its support for local sport and community development.","image":"assets/media/media-110.webp"},{"category":"COMMUNITY · FOOTBALL","title":"Mabcor supports Dickson Pirates FC in Noupoort","text":"Mabcor Facilities Solutions donated football kits to Dickson Pirates FC in Noupoort, supporting grassroots sport and youth participation in the local community.","image":"assets/media/media-131.webp"}]$news$::jsonb,
  true
)
where id = 'main';
