# Christion's Laptop Recovery Guide

Personal setup notes for getting back to a working ThinkTwice dev environment after a factory reset. Assumes a fresh Windows 11 install with only VS Code on it. Not general project documentation — see the root [`README.md`](../README.md) and the [docs index](README.md) for that.

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
code .
```

Work from `main` (or a feature branch off it). The old `Christion` branch is
far behind `main` (45 commits as of 2026-10-05), so don't check it out.

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

First build takes a while (downloads images, installs dependencies inside containers). Once it's up, see the root README's service address table.

If you want to run backend commands directly on the host instead of through Docker (typecheck, tests, etc.):

```powershell
cd apps\backend
npm ci
npm run typecheck
npm test
```

`npm test` needs a reachable Postgres — either the one `docker compose up` already started, or point `DATABASE_URL` at it manually.

---

For deploy commands and the GCP/Firebase resource table, see [deploying.md](deploying.md); for the backend's architecture and env vars, see [backend.md](backend.md). That content isn't repeated here since it isn't laptop-specific.
