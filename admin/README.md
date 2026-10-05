# Mise Admin

Admin portal for looking at a Mise user's data and copying it between accounts. Served from
`admin.georgesheppard.dev` as its own Cloudflare Worker (static assets + a small proxy in `worker/`).

## How access is enforced

1. **Cloudflare Access** guards the whole `admin.georgesheppard.dev` hostname, so nothing (not even the
   static bundle) loads until you've signed in through Access.
2. The Worker only proxies `/api/*` → `https://api.georgesheppard.dev/admin/*`, forwarding the Access
   token (`Cf-Access-Jwt-Assertion`) as `X-Admin-Access-Jwt`. Cookies are never forwarded.
3. The API verifies that token itself (signature against your team's certs, issuer, AUD, expiry) and
   checks the email against `ADMIN_EMAILS`. Calling `api.georgesheppard.dev/admin/*` directly without
   a valid token gets a 401/403, and the routes return 404 if any of the settings are missing.

## One-time setup

1. **Access application**: Zero Trust → Access → Applications → Add → Self-hosted.
   - Domain: `admin.georgesheppard.dev`
   - Policy: *Allow*, Include → Emails → your email only. Prefer an identity provider with MFA
     (e.g. GitHub/Google) over the one-time PIN, or add a *Require* rule for MFA.
   - Session duration: something short, e.g. 24 hours.
   - Copy the **Application Audience (AUD) tag**.
2. **API secrets** (Infisical, production): `CF_ACCESS_TEAM_DOMAIN=https://<team>.cloudflareaccess.com`,
   `CF_ACCESS_ADMIN_AUD=<AUD tag>`, `ADMIN_EMAILS=<your email>`.
3. **Worker**: Workers & Pages → Create → Import this repo.
   - Build command: `yarn build:admin`
   - Deploy command: `npx wrangler deploy --config admin/wrangler.jsonc`

   `wrangler.jsonc` attaches the `admin.georgesheppard.dev` custom domain and disables `workers.dev`
   and preview URLs, so the Worker can't be reached around Access.

## Local development

Runs the UI locally against the production API using your own Access token:

```bash
cloudflared access login https://admin.georgesheppard.dev
ADMIN_ACCESS_JWT=$(cloudflared access token -app=https://admin.georgesheppard.dev) yarn dev:admin
```

Set `ADMIN_API_ORIGIN=http://localhost:5240` to point at a local API instead.
