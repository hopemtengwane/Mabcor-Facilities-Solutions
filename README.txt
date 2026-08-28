MABCOR FACILITIES SOLUTIONS WEBSITE
Supabase Admin Edition

Open index.html to preview the public website.
For shared/persistent Website Admin editing, complete SUPABASE-SETUP.txt once and deploy the files to the website host.

The website no longer requires Python or a local content server.

Key files:
- index.html — public site
- admin.html — authenticated Website Admin
- SUPABASE-SETUP.txt — one-time setup instructions
- supabase-setup.sql — database/storage/RLS setup
- supabase-config.js — paste the Mabcor Supabase Project URL and publishable key here

The existing website design, 46-image hero, capability imagery, rotating project imagery, electrical emphasis, News & Community section and WhatsApp functionality are preserved.

V3.0.2 NEWS UPDATE
------------------
News & Community now identifies the sponsored clubs as Excelsior Rugby Club (Middelburg) and Dickson Pirates FC (Noupoort). If your Supabase database was already set up before this version, run SUPABASE-UPDATE-V3.0.2-NEWS.sql once in the Supabase SQL Editor.

V3.0.3 ADMIN UPDATE
- Includes the corrected Supabase login/authentication gate from V3.0.1.
- Website Images now has a contextual "Upload & add here" control.
- New JPG/PNG/WebP files can be uploaded directly into every editable capability thumbnail, slideshow, parallax image set and the two current News cards.
- Hero retains its own upload control. All uploaded images are stored in the same Supabase Storage media library and remain reusable anywhere on the site.
- No additional SQL migration is required if the V3 Supabase setup has already been run; this update uses the existing website_content row and website-media bucket.


V3.0.4 NEWS FIX
-----------------
- Public site normalises the two confirmed sponsorship stories even if an older cached/Supabase row is encountered.
- Admin now includes a News & Community editor for category, headline and article copy.
- Run SUPABASE-UPDATE-V3.0.4-NEWS.sql once to permanently update an already-existing Supabase row.

V3.0.5: Added an editable static image to Start a Project, with the enquiry form aligned to the far right.
