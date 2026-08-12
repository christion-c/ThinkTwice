# Christion's Laptop Recovery Guide

Personal setup notes for getting back to a working ThinkTwice backend dev environment after a factory reset. Assumes a fresh Windows 11 install with only VS Code on it.

This covers the backend specifically since that's your area (`apps/backend`), but most of the install/auth steps below are shared infrastructure — you'll need them regardless of which part of the app you're touching, since `docker compose` runs frontend + backend + ML together.

---

## 1. Install, in this order

| Tool | Why you need it | Get it from |
| --- | --- | --- |
| **Git** | Clone the repo, everything else | https://git-scm.com/downloads |
| **Docker Desktop** | Runs Postgres, backend, frontend, ML locally. On the Windows 11 installer, accept the **WSL2 backend** prompt (default) — don't pick Hyper-V. | https://www.docker.com/products/docker-desktop/ |
| **Node.js 22** (LTS) | Lets you run `npm`/`npx` directly on the host — needed for the Firebase CLI (`npx firebase-tools`) and for running backend `npm` scripts outside Docker if you want to | https://nodejs.org/ |
| **Google Cloud SDK (`gcloud`)** | Deploys to Cloud Run, manages Secret Manager, Cloud SQL, Artifact Registry | https://cloud.google.com/sdk/docs/install |

VS Code itself: install the **Docker** and **PowerShell** extensions at minimum; the repo also has a `.devcontainer/` if you want to develop inside a container instead of directly on Windows.

After installing, **start Docker Desktop once** and wait for it to say "Docker is running" before doing anything else — most things below will fail silently if it's not up.

---

## 2. Clone the repo

```powershell
git clone https://github.com/christion-c/ThinkTwice.git
cd ThinkTwice
git checkout Christion
code .
```

`main` and `Christion` should be identical — `Christion` is just the branch you normally work from.

---

## 3. Authenticate with Google Cloud

```powershell
gcloud init
```

This logs in your Google account and lets you pick the project — choose (or manually set) **`thinktwice-dev-christion`**:

```powershell
gcloud config set project thinktwice-dev-christion
```

Then set up Application Default Credentials, impersonating the dedicated backend service account (never download a service-account key file — this impersonation flow is the whole point of not needing one):

```powershell
gcloud auth application-default login --impersonate-service-account=thinktwice-dev-backend@thinktwice-dev-christion.iam.gserviceaccount.com
```

This writes a credentials file locally and prints its path — copy that path, you'll need it in step 4.

**Docker image pushes** also need one-time auth setup:

```powershell
gcloud auth configure-docker us-east4-docker.pkg.dev
```

---

## 4. Set up environment files

```powershell
Copy-Item .env.example .env
```

Open `.env` and fill in:

- `GOOGLE_ADC_PATH` — the absolute path the `gcloud auth application-default login` command printed in step 3
- `GOOGLE_CLOUD_PROJECT` — `thinktwice-dev-christion`

Everything else in `.env.example` already has sensible local-dev defaults (Postgres user/password, ports, etc.) — you shouldn't need to touch them for local development.

You do **not** need to recreate any secrets. `DATABASE_URL` and `INTERNAL_SERVICE_TOKEN` for the *deployed* backend already exist in Secret Manager (`db-url`, `internal-service-token`) and are already granted to the service account — a laptop reset doesn't touch anything server-side.

---

## 5. Run it locally

```powershell
docker compose --profile frontend --profile ml build
docker compose --profile frontend --profile ml up --watch
```

First build takes a while (downloads images, installs dependencies inside containers). Once it's up:

| Service | URL |
| --- | --- |
| Backend API | http://localhost:3000 |
| Backend health check | http://localhost:3000/health |
| Frontend / Expo | http://localhost:8081 |
| ML service | http://localhost:8000 |
| Postgres (from host tools) | localhost:5433 |

If you want to run backend commands directly on the host instead of through Docker (typecheck, tests, etc.):

```powershell
cd apps\backend
npm ci
npm run typecheck
npm test
```

`npm test` needs a reachable Postgres — either the one `docker compose up` already started, or point `DATABASE_URL` at it manually.

---

## 6. Deploying the backend to Cloud Run

Build from the **repo root**, not `apps\backend` — the Docker build context spans the whole repo so it can reach `packages/shared-types`.

```powershell
docker build -f infra\docker\backend\Dockerfile --target production -t us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice/backend:latest .

docker push us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice/backend:latest

gcloud run deploy thinktwice-backend `
  --image us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice/backend:latest `
  --region us-east4
```

No env vars or secrets need restating on a redeploy like this — Cloud Run keeps whatever's already configured on the service (`DATABASE_URL` and `INTERNAL_SERVICE_TOKEN` via Secret Manager, `CORS_ORIGIN`, `ML_SERVICE_URL`, the Cloud SQL connection) and just swaps the image.

**Two gotchas worth remembering**, both learned the hard way this project:
- `--set-env-vars` / `--set-secrets` **replace the entire list** on the service; `--update-env-vars` / `--update-secrets` patch just what you name. Default to `--update-*` unless you're deliberately restating everything.
- If a value you're passing on the command line has commas in it (multiple `KEY=VALUE` pairs in one `--set-env-vars`), Windows/PowerShell + `gcloud`'s `.cmd` wrapper can mangle the commas. Use one `--set-env-vars`/`--update-env-vars` flag per variable instead of comma-joining them.

---

## 7. Reference — the actual resources this project uses

| Thing | Value |
| --- | --- |
| GitHub repo | https://github.com/christion-c/ThinkTwice.git |
| Branches | `main`, `Christion` (kept in sync) |
| GCP project | `thinktwice-dev-christion` |
| Backend service account | `thinktwice-dev-backend@thinktwice-dev-christion.iam.gserviceaccount.com` |
| Cloud Run region | `us-east4` |
| Cloud Run services | `thinktwice-backend`, `thinktwice-ml` |
| Live backend URL | https://thinktwice-backend-93723759667.us-east4.run.app |
| Live ML service URL | https://thinktwice-ml-93723759667.us-east4.run.app |
| Artifact Registry repo | `us-east4-docker.pkg.dev/thinktwice-dev-christion/thinktwice` |
| Cloud SQL instance | `thinktwice` (region `us-central1` — different region than Cloud Run, that's intentional) |
| Cloud SQL connection name | `thinktwice-dev-christion:us-central1:thinktwice` |
| Secret Manager secrets | `db-url`, `internal-service-token` |
| Firebase project | `thinktwice-dev-christion` |
| Firebase Hosting (frontend) | https://thinktwice-dev-christion.web.app |
| Custom domain | `thinktwice.site` (bought via Squarespace/Google Domains — check Firebase Console → Hosting for current connection status, it may still be finishing DNS/SSL propagation) |

If you ever need to see or rotate a secret's value:

```powershell
gcloud secrets versions access latest --secret=db-url
gcloud secrets versions access latest --secret=internal-service-token
```
