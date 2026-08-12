# Trackfi

Trackfi is a finance tracker for managing subscriptions, planned expenses,
recurring revenue, recurring investments, and long-term financial growth
projections.

## Local setup

Install [mise](https://mise.jdx.dev/), then run:

```sh
mise install
mise exec -- pnpm install --frozen-lockfile
cp apps/api/.dev.vars.example apps/api/.dev.vars
cp apps/web/.env.local.example apps/web/.env.local
mise exec -- pnpm db:migrate:local
mise exec -- pnpm dev
```

The normal local ports are:

- Web: `http://localhost:5173`
- API health: `http://localhost:8787/health`

All browser routes are exposed below an explicit `/en` or `/fr` prefix. The
unprefixed legacy URLs redirect using the signed-in account preference, then
the browser preference, with English as the fallback.

The application starts in waitlist mode. Cloudflare's documented Turnstile test
keys are included in the example files, but you should replace the auth secret,
Brandfetch client ID, admin email, and Resend settings. An email listed in
`ADMIN_EMAILS` is automatically approved after joining the waitlist and
receives the first admin invitation.

Local D1 data lives under `apps/api/.wrangler` and is isolated per Conductor
workspace. The Conductor Development action also assigns distinct web and API
ports automatically.

Useful commands:

```sh
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
pnpm db:migrate:local
```

`pnpm check` is the CI-equivalent command: formatting, linting, type checking, tests, and production builds.

## Cloudflare deployment

GitHub Actions runs checks on every pull request and push. Production deployment is intentionally disabled until Cloudflare is bootstrapped.

1. Authenticate locally with `pnpm exec wrangler login`.
2. Create D1 and replace the placeholder `database_id` in
   `apps/api/wrangler.jsonc` with the returned UUID:

   ```sh
   pnpm --filter @trackfi/api exec wrangler d1 create trackfi-db
   ```

3. Create the Direct Upload Pages project:

   ```sh
   pnpm exec wrangler pages project create trackfi-web --production-branch main
   ```

4. Create a Turnstile widget for the web hostname and record its site and secret
   keys.
5. Verify a Resend sending domain and choose a sender such as
   `Trackfi <hello@updates.example.com>`.
6. Configure Worker secrets on the production `trackfi-api` Worker (not as
   GitHub Actions secrets). From the repository root, add each one with:

   ```sh
   mise exec -- pnpm --filter @trackfi/api exec wrangler secret put BETTER_AUTH_SECRET
   mise exec -- pnpm --filter @trackfi/api exec wrangler secret put RESEND_API_KEY
   mise exec -- pnpm --filter @trackfi/api exec wrangler secret put TURNSTILE_SECRET_KEY
   ```

   - Secrets: `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`

   The non-secret production values `APP_ORIGIN`, `AUTH_BASE_URL`, `EMAIL_FROM`,
   and `ADMIN_EMAILS` are versioned in `apps/api/wrangler.jsonc`. Update that
   file when the production domains, sender, or administrators change. Generate
   `BETTER_AUTH_SECRET` with at least 32 random characters.

7. Create a least-privilege Cloudflare API token scoped to the target account
   with Workers Scripts, Pages, and D1 edit permissions.
8. Create a protected GitHub environment named `production` and add:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
9. Add these repository Actions variables:

   - `CLOUDFLARE_DEPLOY_ENABLED=true`
   - `BRANDFETCH_CLIENT_ID` set to the public Brandfetch client ID
   - `TRACKFI_API_URL` set to the public Worker origin
   - `TURNSTILE_SITE_KEY` set to the public widget key

The web build exposes the public Brandfetch client ID as
`VITE_BRANDFETCH_CLIENT_ID` and loads logos directly from Brandfetch's Logo API.
This lets Brandfetch receive the application origin required by its hotlinking
policy without an extra Worker request. When Brandfetch is unavailable or has
no matching logo, Trackfi falls back to service initials without disabling
subscription features.

After checks pass on `main`, CI applies pending D1 migrations, deploys the
`trackfi-api` Worker, and uploads `apps/web/dist` together with the Pages
Functions in `apps/web/functions` to the `trackfi-web` Pages project. The
Pages Function uses the `API_URL` variable in `apps/web/wrangler.jsonc`; keep it
aligned with the browser's `VITE_API_URL`/`TRACKFI_API_URL`. The first Worker
deployment creates the Worker project automatically.

To apply migrations manually:

```sh
pnpm db:migrate:remote
```

For local deployment validation without changing Cloudflare state, run:

```sh
pnpm --filter @trackfi/api build
pnpm --filter @trackfi/web build
pnpm --filter @trackfi/web build:functions
```

## Troubleshooting

- Run commands through `mise exec --` if your shell has a different Node or pnpm active.
- A frozen install failure means `pnpm-lock.yaml` is out of sync; update dependencies intentionally and commit the resulting lockfile.
- `D1_ERROR: no such table` means local or remote migrations have not been applied.
- Authentication configuration errors usually mean `BETTER_AUTH_SECRET`, `APP_ORIGIN`, or `AUTH_BASE_URL` is missing or has the wrong origin.
- Resend requires a verified sender domain in production; `onboarding@resend.dev` is only suitable for initial testing.
- Missing brand logos usually mean the `BRANDFETCH_CLIENT_ID` GitHub Actions variable was absent when the web application was built.
- If a Conductor service reports a busy port, start it through the Development action so it receives the workspace's allocated ports.
- If deployment is skipped, verify the repository variable is exactly `CLOUDFLARE_DEPLOY_ENABLED=true` and the production environment contains both Cloudflare secrets.
