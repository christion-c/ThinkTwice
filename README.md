# ThinkTwice Development Guide

## What the Project Delivers

ThinkTwice is an ADHD-friendly personal finance and habit-tracking app. Instead of just showing where money went, it turns everyday spending and driving/eating habits into forward-looking predictions — for example, projecting that a recurring $35/week coffee habit becomes roughly $140 by the end of the month — so users can adjust before small habits become bigger problems.

**Complete project stack:**

* Expo front end (React Native, web + mobile)
* Node.js / Express back end (REST API)
* Python / FastAPI machine-learning service (spending forecasts)
* PostgreSQL database
* Firebase Authentication

The whole stack runs in Docker, so every team member works with the same versions, dependencies, database, and environment. **You do not need to install Node.js, npm, Python, PostgreSQL, or any project dependency directly on your computer** — Docker handles all of it.

**Team ownership** — the capstone team dissolved after presentation (Aug 2026). Christion Callahan now owns the whole project end to end (backend, frontend, and ML); Parker Lewis occasionally contributes, most often to `apps/frontend/`. Gabriel Phipps and James Lewis are no longer on the project.

Since one person owns everything, there's no longer a "coordinate with the folder's owner" step for shared files (`compose.yaml`, `.env.example`, `infra/`, `packages/`, database schemas, API request/response formats) — just be careful with them, since they're still the files most likely to break another part of the app if changed carelessly.

---

## After You Clone the Repo

Complete these steps once, the first time you set up the project.

### 1. Install required software

* Git
* Docker Desktop (must be running before you start the project)
* Visual Studio Code
* Expo Go, or a mobile emulator, for mobile testing

### 2. Clone and open the repository

```powershell
git clone <repository-url>
cd ThinkTwice
code .
```

Replace `<repository-url>` with the GitHub repository URL.

### 3. Create your environment file

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS or Linux:

```bash
cp .env.example .env
```

The `.env` file holds your local configuration. **Never commit `.env` to GitHub.**

### 4. Configure Google ADC and Firebase

The back end uses Firebase Admin with Application Default Credentials (ADC). For local development, create ADC that impersonates the dedicated development identity — never download a service-account private-key JSON:

```powershell
gcloud auth application-default login --impersonate-service-account=thinktwice-dev-backend@thinktwice-dev-christion.iam.gserviceaccount.com
```

In your root `.env`, set:

* `GOOGLE_ADC_PATH` — the absolute path to the ADC file that command generated
* `GOOGLE_CLOUD_PROJECT` — the Firebase/Google Cloud project ID

The front end also reads six Firebase web-app values from the root `.env`:

```dotenv
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

These come from the Firebase web-app configuration. `EXPO_PUBLIC_*` variables are compiled into the client, so they must never contain secrets. Native Google sign-in additionally needs the platform OAuth client IDs in `.env` and an Expo development build — Expo Go alone is not enough for that native module.

### 5. Build the full project

```powershell
docker compose --profile frontend --profile ml build
```

Docker downloads the required images and installs all project dependencies inside the containers. The first build can take a while; later startups are much faster.

---

## Every Day You Work On It

### 1. Start Docker Desktop

Wait until Docker Desktop reports that Docker is running.

### 2. Get the latest code

```powershell
git checkout main
git pull
```

Then create or switch to your feature branch — do not make normal changes directly on `main`:

```powershell
git checkout -b feature/your-feature-name
# or, to resume existing work:
git checkout feature/your-feature-name
git pull
```

### 3. Start the full project

```powershell
docker compose --profile frontend --profile ml up --watch
```

This starts the front end, back end, ML service, and PostgreSQL. Docker Compose Watch syncs source changes into the containers automatically, so development services restart on their own as you edit files.

Once it's running, the services are available at:

| Service | Address |
| --- | --- |
| Front end / Expo | `http://localhost:8081` |
| Back-end API | `http://localhost:3000` |
| Back-end health check | `http://localhost:3000/health` |
| Machine-learning service | `http://localhost:8000` |
| PostgreSQL from your computer | `localhost:5433` |

Inside Docker, containers talk to each other by service name, never `localhost` — for example `backend:3000`, `db:5432`, `ml:8000`.

If you're testing the front end from an Android emulator or a physical phone instead of a web browser, see [Front-End API Address by Platform](#front-end-api-address-by-platform) below.

### 4. If dependencies changed

Dependencies don't reinstall automatically during normal development. After pulling changes to any of these files, rebuild:

```text
apps/backend/package.json
apps/backend/package-lock.json
apps/frontend/package.json
apps/frontend/package-lock.json
services/ml/requirements.txt
```

```powershell
docker compose --profile frontend --profile ml up --watch --build
```

Never install dependencies directly on the host computer — do it through Docker so everyone stays in sync.

### 5. Useful commands while working

```powershell
docker compose ps                    # check container status
docker compose logs -f               # view all logs
docker compose logs -f backend       # view one service's logs (backend, frontend, ml, or db)
docker compose restart backend       # restart one service
docker compose exec backend sh       # open a shell in a container
docker compose config                # validate the compose configuration
```

### 6. Save your work

```powershell
git status
git add .
git commit -m "describe the completed work"
git push -u origin feature/your-feature-name
```

Open a pull request on GitHub before merging into `main`. Never commit `.env`, `node_modules/`, `dist/`, `.venv/`, `__pycache__/`, or `.expo/`.

---

## When You're Done for the Day

While the project is running in your terminal, press `Ctrl + C`, then run:

```powershell
docker compose down
```

This stops and removes the containers **but keeps your PostgreSQL data** for next time. Next time you sit down, just repeat [Every Day You Work On It](#every-day-you-work-on-it) starting from `docker compose --profile frontend --profile ml up --watch`.

> **Database warning:** `docker compose down --volumes` deletes your local PostgreSQL data. Only use `--volumes` if you intentionally want to wipe your local database — for normal shutdown, use plain `docker compose down`.

---

## Front-End API Address by Platform

The front end reads `EXPO_PUBLIC_API_URL` from `.env`. Set it based on how you're viewing the app, then restart the front-end container (`docker compose restart frontend`):

| Testing on | `EXPO_PUBLIC_API_URL` |
| --- | --- |
| Web browser | `http://localhost:3000` |
| Android emulator | `http://10.0.2.2:3000` |
| Physical phone | `http://<your-computer's-IPv4>:3000` (find it with `ipconfig`; phone and computer must share a network) |

---

## Troubleshooting

**Docker is not running** — start Docker Desktop, wait until it's ready, then retry `docker compose --profile frontend --profile ml up --watch`.

**Containers will not start** — check `docker compose ps` and `docker compose logs`.

**Dependencies are missing** — rebuild: `docker compose --profile frontend --profile ml up --watch --build`.

**A port is already in use** — run `docker compose down` to stop any existing project containers, then start again.

**The database is not connecting** — check `docker compose logs db` and confirm it's healthy with `docker compose ps`.

**Docker configuration changed** — validate it with `docker compose config`.

---

Everyone should use the committed Docker configuration as the standard development environment. Do not change shared infrastructure files without communicating with the team, and never commit secrets or local environment files.

---

## Deploying

The frontend deploys to Firebase Hosting. From `apps/frontend`:

```bash
npx expo export --platform web --clear
npx firebase-tools@latest deploy --only hosting
```

Backend and ML service deploys go to Cloud Run via Docker — see
`apps/backend/README.md` for the exact build/push/deploy commands and the
project's GCP resource reference (project ID, region, service names, Artifact
Registry path).