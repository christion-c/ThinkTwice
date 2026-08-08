clear
# ThinkTwice Development Guide

ThinkTwice uses Docker so every team member works with the same software versions, dependencies, database, and development environment.

Complete Project Stack:
* Expo front end
* Node.js back end
* Python machine-learning service
* PostgreSQL database

You do not need to install Node.js, npm, Python, PostgreSQL, or project dependencies directly on your computer.

---

# Required Software

Install the following:

* Git
* Docker Desktop
* Visual Studio Code
* Expo Go or a mobile emulator for mobile testing

Docker Desktop must be running before starting the project.

---

# First-Time Setup

Complete these steps once after cloning the repository.

## 1. Clone the Repository

Open PowerShell or a terminal:

```powershell
git clone <repository-url>
cd ThinkTwice
code .
```

Replace `<repository-url>` with the GitHub repository URL.

## 2. Create the Environment File

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS or Linux:

```bash
cp .env.example .env
```

The `.env` file contains local configuration values.

Do not commit `.env` to GitHub.

## 3. Build the Full Project

Run:

```powershell
docker compose --profile frontend --profile ml build
```

Docker will download the required images and install all project dependencies inside the containers.

The first build may take longer. Future startups should be much faster.

-------------------------------------------------------------------------------------------------
[][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][][]
-------------------------------------------------------------------------------------------------

# Daily Workflow

Follow these steps whenever opening the project.

## 1. Start Docker Desktop

Wait until Docker Desktop reports that Docker is running.

## 2. Open the Project

Open the `ThinkTwice` folder in Visual Studio Code.

## 3. Pull the Latest Changes

```powershell
git checkout main
git pull
```

Create or switch to your feature branch before editing files.
Switch to an existing branch:

```powershell
git checkout feature/your-feature-name
git pull
```

Do not make normal development changes directly on `main`.

## 4. Start the Full Project

Run:

```powershell
docker compose --profile frontend --profile ml up --watch
```

This starts:

* Front end
* Back end
* Machine-learning service
* PostgreSQL database

Docker Compose Watch automatically synchronizes source-code changes into the containers.

Development services should restart automatically when files change.

---

# Project Addresses

Once the containers are running, the services are available at:

| Service                      | Address                        |
| ---------------------------- | ------------------------------ |
| Front end / Expo             | `http://localhost:8081`        |
| Back-end API                 | `http://localhost:3000`        |
| Back-end health check        | `http://localhost:3000/health` |
| Machine-learning service     | `http://localhost:8000`        |
| PostgreSQL from the computer | `localhost:5433`               |

Inside Docker, the services communicate using their service names:

```text
Frontend → backend:3000
Backend → db:5432
Backend → ml:8000
ML service → backend:3000
```

Containers should not use `localhost` to communicate with other containers.

---

# Working on the Project

Each team member should primarily work inside their assigned folder.


Back end:
apps/backend/

Front end:
apps/frontend/

Machine learning:
services/ml/


Coordinate with the team before changing shared files:

compose.yaml
.env.example
infra/
packages/
database schemas
API request and response formats

---

# Checking Container Status

Run:

```powershell
docker compose ps
```

Running services should display statuses such as:

running
healthy

---

# Viewing Logs

View all project logs:

```powershell
docker compose logs -f
```

View logs for a specific service:

```powershell
docker compose logs -f backend
```

```powershell
docker compose logs -f frontend
```

```powershell
docker compose logs -f ml
```

```powershell
docker compose logs -f db
```

Press `Ctrl + C` to stop following logs.

---

# Stopping the Project

While the project is running in the terminal, press:

Ctrl + C

Then run:

docker compose down

This stops and removes the containers but preserves the PostgreSQL database.

The next time the project is opened, run:

docker compose --profile frontend --profile ml up --watch

---

# Database Warning

The following command deletes the local PostgreSQL database:

docker compose down --volumes

Do not use `--volumes` unless you intentionally want to erase all local database data.

For normal shutdown, use:

docker compose down

---

# When Dependencies Change

Dependencies do not reinstall during normal development.

A rebuild is required when dependency files change, including:

apps/backend/package.json
apps/backend/package-lock.json
apps/frontend/package.json
apps/frontend/package-lock.json
services/ml/requirements.txt

After pulling dependency changes, run:

docker compose --profile frontend --profile ml up --watch --build

Docker will rebuild the affected services and install the updated dependencies.

Do not manually install project dependencies on the host computer.

---

# Front-End API Address

The front end uses `EXPO_PUBLIC_API_URL` from the `.env` file.

## Web Browser

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Android Emulator

```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

## Physical Phone

Find the computer’s IPv4 address:

```powershell
ipconfig
```

Update `.env` with the address:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

The phone and computer must be connected to the same network.

Restart the front-end container after changing `.env`:

```powershell
docker compose restart frontend
```

---

# Common Commands

## Start the Full Project

```powershell
docker compose --profile frontend --profile ml up --watch
```

## Start and Rebuild

```powershell
docker compose --profile frontend --profile ml up --watch --build
```

## Stop the Project

```powershell
docker compose down
```

## Check Container Status

```powershell
docker compose ps
```

## View All Logs

```powershell
docker compose logs -f
```

## Restart a Service

```powershell
docker compose restart backend
```

Replace `backend` with `frontend`, `ml`, or `db` when needed.

## Open a Back-End Container Shell

```powershell
docker compose exec backend sh
```

## Validate the Compose Configuration

```powershell
docker compose config
```

---

# Git Workflow

Before starting work:

```powershell
git checkout main
git pull
git checkout -b feature/your-feature-name
```

After completing work:

```powershell
git status
git add .
git commit -m "describe the completed work"
git push -u origin feature/your-feature-name
```

Create a pull request on GitHub before merging into `main`.

Do not commit:

```text
.env
node_modules/
dist/
.venv/
__pycache__/
.expo/
```

---

# Troubleshooting

## Docker Is Not Running

Start Docker Desktop and wait until it is ready.

Then retry:

```powershell
docker compose --profile frontend --profile ml up --watch
```

## Containers Will Not Start

Check their status:

```powershell
docker compose ps
```

View the logs:

```powershell
docker compose logs
```

## Dependencies Are Missing

Rebuild the project:

```powershell
docker compose --profile frontend --profile ml up --watch --build
```

## A Port Is Already in Use

Stop existing project containers:

```powershell
docker compose down
```

Then start the project again.

## The Database Is Not Connecting

Check the database logs:

```powershell
docker compose logs db
```

Confirm that the database is healthy:

```powershell
docker compose ps
```

## Docker Configuration Changed

Validate the configuration:

```powershell
docker compose config
```

---

# Daily Command Summary

Every team member follows the same process:

```powershell
git pull
docker compose --profile frontend --profile ml up --watch
```

When finished:

```powershell
docker compose down
```

Everyone should use the committed Docker configuration as the standard development environment. Do not change shared infrastructure files without communicating with the team, and never commit secrets or local environment files.
