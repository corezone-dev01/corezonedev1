# COREZONEDEV website
Static site, no build step. Open index.html locally or deploy the folder root.

## Placeholders to fill (script.js CONFIG + elsewhere)
- `googleScriptUrl`, `businessWhatsApp` (digits, country code, no +), `bookingUrl`, `businessEmail`
- `OWNER_EMAIL` in google-apps-script/Code.gs
- `CONFIRM-DOMAIN.example` in index.html (canonical), robots.txt, sitemap.xml; privacy.html brackets
- assets/hero.mp4, more projects in Selected Work (copy an `<a class="proj">` card, add an image in assets/projects/)

## Google Sheets + email
1. Create a sheet named **COREZONEDEV CRM** (the Leads tab and headers are created automatically).
2. Extensions > Apps Script; paste Code.gs; set OWNER_EMAIL.
3. Deploy > New deployment > Web app; Execute as: Me; Access: Anyone. Authorise, copy the URL into `googleScriptUrl`.
4. After editing Code.gs, create a **new version** of the deployment.
5. Keep the sheet private. Public web apps have Google quotas and can be abused: the honeypot and server validation help, but add a CAPTCHA or a proper backend if spam appears.
Client acknowledgement emails are not implemented; add a transactional provider server-side later (never keys in browser JS).

## WhatsApp / booking
- wa.me links only open a drafted message; the visitor must press Send.
- Create a Google Calendar appointment schedule (15 or 30 min), paste its URL into `bookingUrl`. Unset = visitors are pointed to the form. The Bookings tab isn't automated yet.
- Automated WhatsApp needs the official WhatsApp Business Platform with opt-in and templates; not included.

## Deploy
GitHub repo > push the folder > Netlify/Vercel "import", no build command, publish root. Add the domain in the host and use only the DNS records it shows. HTTPS is automatic. Then test the whole lead journey live.

## Test checklist
Hero without video; mobile menu; no horizontal scroll at 360px; invalid email / missing consent rejected; double-click send; failed send keeps data; real submission creates a row and owner email; WhatsApp and booking links; reduced-motion; no console errors.

## Status
Nothing is deployed or integration-tested yet.

Privacy text lives in two places (the dialog in index.html and privacy.html): edit both. Starter wording; review before launch.
