# ThinkTwice Development Guide

ThinkTwice is an ADHD-friendly application that uses spending history and predictive analysis to help users understand the future financial and nutritional impact of everyday habits.

The development stack runs in Docker:

- Expo and React Native front end
- Node.js and Express back end
- Python machine-learning service
- PostgreSQL database

Node.js, npm, Python, and PostgreSQL do not need to be installed directly on the computer.

## Team ownership

To reduce merge conflicts, each team member should primarily work in their assigned folder.

| Team member | Role | Branch | Primary folder |
| --- | --- | --- | --- |
| Christion | Back-End Engineer | `Christion` | `apps/backend/` |
| Parker | Front-End Engineer | `Parker` | `apps/frontend/` |
| Gabriel | Machine Learning Engineer | `Gabriel` | `services/` |

Coordinate with the team before changing shared files such as `README.md`, `compose.yaml`, `.env.example`, `infra/`, `packages/`, database schemas, or API request and response formats.

## Install once on each computer

Install these programs before cloning the project:

1. [Git](https://git-scm.com/downloads)
2. [Docker Desktop](https://www.docker.com/products/docker-desktop/) using Linux containers and the WSL 2 backend on Windows
3. [Visual Studio Code](https://code.visualstudio.com/download)
4. Optional for mobile testing: [Expo Go](https://expo.dev/go) on a physical phone or Android Studio with an Android emulator

Start Docker Desktop and wait until it reports that Docker is running. Then verify the required command-line tools in PowerShell or a terminal:

```powershell
git --version
docker --version
docker compose version
code --version
```

## First-time project setup

Complete this section once on a new computer.

### 1. Clone the repository

Open PowerShell or a terminal in the folder where the project should be stored:

```powershell
git clone https://github.com/christion-c/ThinkTwice.git
cd ThinkTwice
```

### 2. Switch to your assigned branch

Use the command for your role:

```powershell
# Christion
git switch Christion

# Parker
git switch Parker

# Gabriel
git switch Gabriel
```

Confirm that the correct branch is active:

```powershell
git branch --show-current
```

Do not make normal development changes directly on `main`.

### 3. Create local environment files

Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item apps/frontend/.env.example apps/frontend/.env
New-Item -ItemType Directory -Force secrets
```

macOS or Linux:

```bash
cp .env.example .env
cp apps/frontend/.env.example apps/frontend/.env
mkdir -p secrets
```

Obtain the Firebase service-account JSON securely from the Firebase project administrator and save it as:

```text
secrets/firebase-service-account.json
```

Add this line to the root `.env` file:

```dotenv
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-service-account.json
```

Fill in the `EXPO_PUBLIC_FIREBASE_*` and Google client ID values in `apps/frontend/.env` using the Firebase web-app configuration.

Never commit `.env` files or the Firebase service-account JSON. The repository already ignores them.

### 4. Build and start the project

From the repository root, run:

```powershell
docker compose --profile frontend --profile ml up --watch --build
```

The first build downloads the container images and installs all project dependencies, so it will take longer than later startups.

When the services are ready, press `Ctrl + C`, and then run the normal shutdown command:

```powershell
docker compose down
```

## Every work session

Follow these steps each time you open the project.

### 1. Start Docker and open the repository

Start Docker Desktop. Open PowerShell or a terminal, move into the cloned repository, and open VS Code:

```powershell
cd path\to\ThinkTwice
code .
```

### 2. Update your branch

First make sure you do not have unfinished changes:

```powershell
git status
```

Then use the commands for your branch:

```powershell
# Christion
git switch Christion
git pull --ff-only origin Christion

# Parker
git switch Parker
git pull --ff-only origin Parker

# Gabriel
git switch Gabriel
git pull --ff-only origin Gabriel
```

If `git status` shows changes that you are not ready to commit, do not discard them. Commit them or ask the team for help before pulling.

### 3. Start the full project

```powershell
docker compose --profile frontend --profile ml up --watch
```

Docker Compose Watch synchronizes source changes into the containers. Keep this terminal open while working.

### 4. Commit and push your work

Check what changed and stage only the files you intended to edit:

```powershell
git status
git diff
git add path/to/changed-file
git commit -m "Brief description of the completed work"
git push origin YOUR_BRANCH_NAME
```

Replace `YOUR_BRANCH_NAME` with `Christion`, `Parker`, or `Gabriel`. Avoid `git add .` unless you have reviewed every changed file.

### 5. Stop the project

Press `Ctrl + C` in the terminal running Docker, and then run:

```powershell
docker compose down
```

This removes the containers but preserves the PostgreSQL data for the next session.

## Project addresses

| Service | Address |
| --- | --- |
| Front end / Expo | `http://localhost:8081` |
| Back-end API | `http://localhost:3000` |
| Back-end health check | `http://localhost:3000/health` |
| Machine-learning service | `http://localhost:8000` |
| PostgreSQL from the computer | `localhost:5433` |

Inside Docker, containers communicate through service names such as `backend:3000`, `db:5432`, and `ml:8000`. Containers should not use `localhost` to reach another container.

## Front-end API address

The root `.env` file controls `EXPO_PUBLIC_API_URL`.

For a web browser:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3000
```

For an Android emulator:

```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

For a physical phone, run `ipconfig` on Windows, find the computer's IPv4 address, and use it in `.env`:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

The phone and computer must be on the same network. After changing `.env`, stop the running Compose process and start it again so the frontend container receives the new value.

## When a rebuild is required

Normal source-code changes do not require a rebuild. Rebuild after pulling changes to dependency files, Dockerfiles, or `compose.yaml`:

```powershell
docker compose --profile frontend --profile ml up --watch --build
```

Relevant dependency files include:

- `apps/backend/package.json`
- `apps/backend/package-lock.json`
- `apps/frontend/package.json`
- `apps/frontend/package-lock.json`
- `services/ml/requirements.txt`

## Useful commands

```powershell
# Show service status
docker compose ps

# Follow all logs
docker compose logs -f

# Follow one service
docker compose logs -f backend

# Validate the Compose configuration
docker compose config
```

Replace `backend` with `frontend`, `ml`, or `db` to view another service.

## Troubleshooting

### Firebase credential error

Confirm that `.env` contains `FIREBASE_SERVICE_ACCOUNT_PATH` and that `secrets/firebase-service-account.json` exists. Do not post or commit the JSON file.

### Missing dependencies or a changed Docker configuration

Rebuild the services:

```powershell
docker compose --profile frontend --profile ml up --watch --build
```

### A service will not start

```powershell
docker compose ps
docker compose logs
```

### A port is already in use

Stop existing ThinkTwice containers and start again:

```powershell
docker compose down
docker compose --profile frontend --profile ml up --watch
```

## Database warning

For normal shutdown, use `docker compose down`.

The following command permanently deletes the local PostgreSQL development data:

```powershell
docker compose down --volumes
```

Only use `--volumes` when you intentionally want a fresh local database.
