# Treasure Booths

A mobile-first website and booking studio for a DMV photo booth business. React + Vite, Express, and persistent SQLite using Node 24. The approved price sheet is the source of launch prices; earlier suggested package prices are not used.

## Run

Use the existing checkout at `/workspace/treasure-booths`. Cloud tasks are already isolated; do not create a worktree unless requested.

```sh
cd /workspace/treasure-booths
npm ci --cache /tmp/treasure-npm-cache
npm run dev
```

The application runs on port 3000. `npm run build` builds the frontend; `npm start` runs the production build. Both serve the frontend and API from the same origin. `PORT` changes the port. Node 24 or later is required for built-in SQLite.

## Administration

Visit `/admin`. On first startup, an unpredictable admin password is generated in `data/admin-password.txt` (private, ignored by Git). Read it locally; never commit or share it. Alternatively supply `ADMIN_PASSWORD` securely before the first startup (12+ characters). An existing database keeps its password: change it through Admin → Security. Changing the password invalidates all sessions.

Admin can review customer details, confirm/cancel requests, manually block/release dates, edit package names and prices, upload exact logo/booth/event images, and change the password. `data/` holds the SQLite database, private initial password, and uploaded images. Persist and back up this directory; use a single server instance with a persistent filesystem. `DATA_DIR` may set another private persistent path. Do not expose the data directory as static content. Only uploaded image files are served under `/media`.

Digital prices: 3h $275, 4h $325, 5h $375, then +$50/hour. Print prices: 3h $390, 4h $465, 5h $540, then +$75/hour. Customers can choose 3–10 hours. The server calculates totals and ignores client-supplied prices. Stored booking quotes are preserved when pricing changes.

Pending and confirmed requests reserve the entire event date; cancelled requests release it. This intentionally assumes one booth and one event per day. Manual blocks and active bookings cannot override one another. Event dates and times are Eastern Time. Public availability never includes customer details. Pending holds do not expire automatically: review them regularly in admin.

## Images and fonts

The original attachments were visible in chat but not exposed as local downloadable files. `public/booth-hero.png` is an AI-generated promotional visualization based on the real booth reference and is labeled on the site. The initial wordmark and icon are a provisional vector/text treatment, not the exact supplied logo. Upload the original logo and photograph through Admin → Images to replace them. Event imagery uses locally bundled, generated still-life artwork without people: weddings, disco parties, birthdays, graduations, and reunions. It is never presented as actual Treasure Booths events. Hero backgrounds use separate optimized WebP images for mobile and desktop, with the booth and text sharing one curtain scene. No testimonials or past customers are fabricated.

All default photography-style artwork and fonts are local; image/font domains are no longer required at runtime. Development packages use registry.npmjs.org. The original official logo was not available as a downloadable workspace asset and remains pending: upload the exact file through Admin → Images. The current header mark is provisional and must not be represented as the official logo.

## Validation

```sh
npm test
npm run build
npx playwright test
```

Playwright uses `/usr/bin/chromium` by default; override with `CHROMIUM_PATH` if needed. It starts an isolated production server on port 3001 with a temporary test database and test-only admin credential. It exercises responsive layouts, quotes, public submission, admin confirmation, blocks, pricing changes, authentication boundaries, reduced motion, and legal pages. Screenshots are written under ignored `test-results/`.

## Before public launch

This is a functional local booking-request application. No payment is collected and no emails are sent; customers are told to expect direct contact. Monitor admin regularly and contact customers manually. Payment processing and transactional email require real provider accounts and a separate integration; no keys have been invented. Confirm payment, cancellation, travel and tax policies and business contact details before public launch; current terms disclose pending confirmation and fee approval. Replace the generated hero and provisional branding with originals. Serve through HTTPS and set `COOKIE_SECURE=true` in production. Retain normal TLS verification, persistent storage, and regular backups. Session cookies are HttpOnly/SameSite Strict, write origins are checked, passwords are scrypt hashed, and public booking/admin login endpoints are rate limited. A public multi-server or high-volume deployment should move sessions and rate limits into shared storage and add abuse prevention appropriate to the hosting platform.

No deployment, Git push, publication, or external customer notifications were performed.
