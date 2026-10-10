# Deploying ThinkTwice

Nothing deploys automatically; CI only builds and tests (see [ci.md](ci.md)).
Deploys run by hand from Christion's Windows laptop, which has `gcloud`,
Docker and Node installed (see [christion-laptop-setup.md](christion-laptop-setup.md)).
The devcontainer has no `gcloud` or `gh`.

## Order

1. Merge to `main` and pull it: `git checkout main`, `git pull`, then check
   that `git log --oneline -1` shows the commit you mean to ship.
2. **Backend first.** It runs new database migrations on startup, and the
   frontend may depend on its new routes.
3. **Frontend second**, once the backend checks out.

## Backend (Cloud Run)

Build from the **repo root**, not `apps/backend`. The Docker build context
spans the whole repo so it can reach `packages/shared-types`.

```powershell
docker build -f infra/docker/backend/Dockerfile --target production -t us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice/backend:latest .
docker push us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice/backend:latest

$digest = gcloud artifacts docker images describe us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice/backend:latest --format="value(image_summary.digest)"
echo $digest   # must be one line starting with sha256:
gcloud run deploy thinktwice-backend --region us-east4 --image "us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice/backend@$digest"
```

**Deploy by digest, not `:latest`.** On 2026-10-05, deploying `:latest`
started a new revision running a stale image (no `/money-plan` routes), and
the Finance tab broke until it was redeployed by digest. If a build or push
fails, `:latest` still points at the old image, and the deploy looks
successful because the service restarts.

Migrations run automatically when the server starts (`runMigrations()` in
`server.ts`, before it listens), so there's no separate migrate step. The
runner is idempotent and takes a Postgres advisory lock.

No env vars or secrets need restating on a redeploy: Cloud Run keeps
`DATABASE_URL` and `INTERNAL_SERVICE_TOKEN` (via Secret Manager),
`CORS_ORIGIN`, `ML_SERVICE_URL` and the Cloud SQL connection, and just swaps
the image. Two gotchas when you do change them:

- `--set-env-vars` / `--set-secrets` **replace the entire list**;
  `--update-env-vars` / `--update-secrets` patch just what you name. Default
  to `--update-*`.
- On Windows/PowerShell, `gcloud`'s `.cmd` wrapper can mangle commas. Use one
  `--update-env-vars` flag per variable instead of comma-joining them.

### Check the backend

```powershell
curl.exe https://thinktwice-backend-93723759667.us-east4.run.app/health
curl.exe -s -o NUL -w "%{http_code}" https://thinktwice-backend-93723759667.us-east4.run.app/money-plan
```

`/health` should report `"database":"connected"` with a small
`uptimeSeconds`. An auth-protected route should return **401**; a **404**
(`Route not found`) means old code is live. For migration or startup errors:

```powershell
gcloud run services logs read thinktwice-backend --region us-east4 --limit 50
```

## ML service (Cloud Run)

Same pattern as the backend, but the build context is `services/ml` (see the
`docker-build` job in `.github/workflows/validate.yml`). Run from the repo
root:

```powershell
docker build -f infra/docker/ml/Dockerfile --target production -t us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice/ml:latest services/ml
docker push us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice/ml:latest

$mldigest = gcloud artifacts docker images describe us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice/ml:latest --format="value(image_summary.digest)"
echo $mldigest   # must be one line starting with sha256:
gcloud run deploy thinktwice-ml --region us-east4 --image "us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice/ml@$mldigest"
```

Deploy by digest for the same reason as the backend. To confirm which image
the service is running:

```powershell
gcloud run services describe thinktwice-ml --region us-east4 --format="value(spec.template.spec.containers[0].image)"
```

The ML service only accepts IAM-authenticated calls, so an unauthenticated
`curl` of its URL returns 403 even when it's healthy.

## Frontend (Firebase Hosting)

From `apps/frontend`:

```powershell
npx expo export --platform web --clear
npx firebase-tools@latest deploy --only hosting
```

If the CLI says you're not logged in, run `npx firebase-tools@latest login`
first. `firebase.json` (repo root) serves `apps/frontend/dist`.

The export bakes in the `EXPO_PUBLIC_*` values from `apps/frontend/.env`, so
make sure `EXPO_PUBLIC_API_URL` points at the live backend, not
`localhost`, before exporting.

Check: open https://thinktwice.site signed in and confirm the change. A hard
refresh may be needed, since the JS bundle is cached as immutable but
`index.html` isn't.

## Resource reference

| Thing                       | Value                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| GCP project                 | `thinktwice-dev-christion`                                                                |
| Backend service account     | `thinktwice-dev-backend@thinktwice-dev-christion.iam.gserviceaccount.com`                 |
| Cloud Run region            | `us-east4`                                                                                |
| Cloud Run services          | `thinktwice-backend`, `thinktwice-ml`                                                     |
| Live backend URL            | https://thinktwice-backend-93723759667.us-east4.run.app                                   |
| Live ML service URL         | https://thinktwice-ml-93723759667.us-east4.run.app                                        |
| Artifact Registry repo      | `us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice`                             |
| Images                      | `.../thinktwice/backend`, `.../thinktwice/ml`                                             |
| Cloud SQL instance          | `thinktwice` (region `us-central1`; a different region from Cloud Run on purpose)         |
| Cloud SQL connection name   | `thinktwice-dev-christion:us-central1:thinktwice`                                         |
| Secret Manager secrets      | `db-url`, `internal-service-token`                                                        |
| Firebase project            | `thinktwice-dev-christion`                                                                |
| Firebase Hosting (frontend) | https://thinktwice-dev-christion.web.app                                                  |
| Custom domain               | `thinktwice.site`                                                                         |

To see or rotate a secret's value:

```powershell
gcloud secrets versions access latest --secret=db-url
gcloud secrets versions access latest --secret=internal-service-token
```
