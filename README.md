# Trackfi

Trackfi is a finance tracker for managing subscriptions, recurring revenue, recurring investments, and long-term financial growth projections.

## Local setup

Install [mise](https://mise.jdx.dev/), then run:

```sh
mise install
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm dev
```

The normal local ports are:

- Web: `http://localhost:5173`
- API health: `http://localhost:8787/health`

Useful commands:

```sh
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

`pnpm check` is the CI-equivalent command: formatting, linting, type checking, tests, and production builds.

## Cloudflare deployment

GitHub Actions runs checks on every pull request and push. Production deployment is intentionally disabled until Cloudflare is bootstrapped.

1. Authenticate locally with `pnpm exec wrangler login`.
2. Create the Direct Upload Pages project:

   ```sh
   pnpm exec wrangler pages project create trackfi-web --production-branch main
   ```

3. Create a least-privilege Cloudflare API token scoped to the target account with `Workers Scripts: Write` and `Pages: Write` permissions.
4. Create a protected GitHub environment named `production` and add:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
5. Add the repository Actions variable `CLOUDFLARE_DEPLOY_ENABLED` with the value `true`.

After checks pass on `main`, CI deploys the `trackfi-api` Worker first and then uploads `apps/web/dist` to the `trackfi-web` Pages project. The first Worker deployment creates the Worker project automatically.

For local deployment validation without changing Cloudflare state, run:

```sh
pnpm --filter @trackfi/api build
pnpm --filter @trackfi/web build
```

## Troubleshooting

- Run commands through `mise exec --` if your shell has a different Node or pnpm active.
- A frozen install failure means `pnpm-lock.yaml` is out of sync; update dependencies intentionally and commit the resulting lockfile.
- If a Conductor service reports a busy port, start it through the Development action so it receives the workspace's allocated ports.
- If deployment is skipped, verify the repository variable is exactly `CLOUDFLARE_DEPLOY_ENABLED=true` and the production environment contains both Cloudflare secrets.
