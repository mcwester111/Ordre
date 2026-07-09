# Ordre

Ordre is an AI-driven fashion atelier — a private AI stylist that curates your
individual style and aesthetic. It is built with the Next.js App Router and
streams responses from Anthropic's Claude models.

## Tech stack

- **Next.js 15** (App Router, React 18, TypeScript)
- **Anthropic Claude** via `@anthropic-ai/sdk` (streaming chat + profile summaries)
- Client-side persistence in `localStorage` (no server-side accounts yet)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example file and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | **Yes** | Authenticates the `/api/curator` and `/api/profile-summary` routes with Anthropic. Get one at <https://console.anthropic.com/>. |
| `NEXT_PUBLIC_SITE_URL` | Recommended for production | Absolute base URL of the deployed site (e.g. `https://ordre.com`, no trailing slash). Used for Open Graph / Twitter card images, `robots.txt`, and the sitemap. Falls back to `http://localhost:3000` in development. |

`.env.local` is git-ignored — never commit secrets.

### 3. Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Project structure

```
app/
  api/
    curator/route.ts          # streaming chat with the AI stylist
    profile-summary/route.ts  # generates the aesthetic portrait
  curator/                    # the chat atelier (main product)
  about/ curations/ journal/  # editorial pages
  privacy/ terms/             # legal documents
  sign-in/                    # auth UI (mocked until a backend exists)
  icon.png apple-icon.png     # favicons (generated from the swan logo)
  opengraph-image.png         # social share card
  robots.ts sitemap.ts        # SEO
  not-found.tsx error.tsx     # 404 + error boundary
components/                   # shared UI (header, footer, intake, etc.)
lib/
  rate-limit.ts               # in-memory per-IP limiter (see TODOs)
  user-data.ts                # GDPR/CCPA local data erasure
public/                       # brand imagery and textures
```

## Notes

- **No backend yet.** Accounts, billing, and persistence are mocked client-side.
  Server-side work is marked with `TODO(backend)` comments — most notably the
  rate limiter (`lib/rate-limit.ts`), which is in-memory and should be replaced
  with a distributed store (e.g. Upstash/Redis) keyed on the authenticated user.
- **Data handling** is documented honestly in the Privacy Policy (`/privacy`)
  and the in-app "Your Data" deletion control (`components/DataControls.tsx`).
- The legal pages in `/terms` and `/privacy` are thorough templates and should
  be reviewed by counsel before launch.
