Project: פתוח לציבור / TLVOPEN



This is an existing Next.js project. Do not create a new project and do not scaffold a new app.



Repository:

https://github.com/simispolter/TLVOPEN



Local project folder:

C:\\Users\\simis\\Documents\\TLV OPEN



Current stack:

\- Next.js App Router

\- TypeScript

\- Tailwind CSS

\- MapLibre

\- RTL Hebrew interface

\- Local GeoJSON dataset at public/data/public-spaces.geojson

\- 337 polygon features converted from KML

\- Conversion script at scripts/convert-kml-to-geojson.mjs



Current implemented state:

\- Homepage map

\- Mobile bottom sheet

\- SpaceCard component

\- StatusBadge component

\- PublicMap component

\- Local GeoJSON loading

\- npm run lint passes

\- npm run build passes

\- Initial commit pushed to main



Product goal:

Build a mobile-first civic journalism map called "פתוח לציבור".

The site helps people find privately owned spaces that are supposed to be open to the public, such as easements, public passages, plazas, atriums, colonnades, and privately owned public spaces.



Important product principles:

\- Do not claim legal certainty without sources.

\- Distinguish between official-source data and field-verified data.

\- Default imported GIS features to "official source, not yet field verified".

\- The user should understand simply: where the place is, whether they can enter, how to enter, and whether there are reports of blockage.

\- Hebrew RTL UX is mandatory.

\- Mobile-first design is mandatory.



Commands:

\- npm install

\- npm run lint

\- npm run build

\- npm run dev



Rules for Codex:

\- Work only inside the existing repository.

\- Do not create a new folder.

\- Do not create a new Next.js app.

\- Do not add Supabase yet.

\- Do not add authentication yet.

\- Do not use public OpenStreetMap tile servers directly.

\- Keep the app buildable.

\- Before finishing, run npm run lint and npm run build.

